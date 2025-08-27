// src/lib/stores/chat.ts
import { writable, derived, get } from 'svelte/store';
import type {
	EnhancedMessage,
	EnhancedConversation,
	ChatState,
	SearchQuery,
	ConversationFilters,
	Favorite,
} from '$lib/types/chat';
import { chatService } from '$lib/services/chat';
import { logger } from './logger';

// Estado inicial del chat
const initialChatState: ChatState = {
	conversations: [],
	activeConversationId: null,
	searchQuery: '',
	searchResults: null,
	isSearching: false,
	selectedTags: [],
	availableTags: [],
	favorites: [],
	viewMode: 'list',
	sortBy: 'date',
	sortOrder: 'desc',
	filters: {
		status: ['active'],
		tags: [],
		hasBookmarks: false
	},
	exportStatus: {
		isExporting: false,
		progress: 0
	},
	isConnected: false,
};

// Store principal del chat
export const chatState = writable<ChatState>(initialChatState);

// Stores derivados para diferentes aspectos del chat
export const activeConversation = derived(
	chatState,
	($state) => $state.conversations.find(conv => conv.id === $state.activeConversationId) || null
);

export const filteredConversations = derived(
	chatState,
	($state) => {
		const filtered = $state.conversations.filter(conv => {
			// Filtrar por estado
			if (!$state.filters.status.includes(conv.status)) return false;

			// Filtrar por tags
			if ($state.filters.tags.length > 0) {
				const hasMatchingTag = $state.filters.tags.some(tag => conv.tags.includes(tag));
				if (!hasMatchingTag) return false;
			}

			// Filtrar por bookmarks/favoritos
			if ($state.filters.hasBookmarks && !conv.isFavorite) return false;

			// Filtrar por rango de fechas
			if ($state.filters.dateRange) {
				const { start, end } = $state.filters.dateRange;
				if (conv.lastActivity < start || conv.lastActivity > end) return false;
			}

			// Filtrar por cantidad de mensajes
			if ($state.filters.minMessages && conv.metadata.messageCount < $state.filters.minMessages) return false;
			if ($state.filters.maxMessages && conv.metadata.messageCount > $state.filters.maxMessages) return false;

			return true;
		});

		// Ordenar resultados
		filtered.sort((a, b) => {
			let comparison = 0;

			switch ($state.sortBy) {
				case 'date':
					comparison = a.lastActivity.getTime() - b.lastActivity.getTime();
					break;
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'activity':
					comparison = a.metadata.messageCount - b.metadata.messageCount;
					break;
				case 'relevance':
					// Solo relevante cuando hay búsqueda activa
					comparison = 0;
					break;
			}

			return $state.sortOrder === 'desc' ? -comparison : comparison;
		});

		return filtered;
	}
);

export const favoriteConversations = derived(
	chatState,
	($state) => $state.conversations.filter(conv => conv.isFavorite)
);

export const recentConversations = derived(
	chatState,
	($state) => $state.conversations
		.filter(conv => conv.status === 'active')
		.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
		.slice(0, 5)
);

// Acciones del chat
class ChatActions {
	/**
	 * Crea una nueva conversación
	 */
	createConversation(name?: string): string {
		const conversation = chatService.createConversation(name);

		chatState.update(state => ({
			...state,
			conversations: [conversation, ...state.conversations],
			activeConversationId: conversation.id
		}));

		this.saveToStorage();

		logger.info('Conversación creada y activada', {
			conversationId: conversation.id,
			name: conversation.name
		}, 'ChatStore');

		return conversation.id;
	}

	/**
	 * Activa una conversación específica
	 */
	setActiveConversation(conversationId: string | null): void {
		chatState.update(state => ({
			...state,
			activeConversationId: conversationId
		}));

		logger.debug('Conversación activada', { conversationId }, 'ChatStore');
	}

	/**
	 * Agrega un mensaje a la conversación activa
	 */
	addMessage(message: Omit<EnhancedMessage, 'id' | 'timestamp'>): string | null {
		let messageId: string | null = null;

		chatState.update(state => {
			if (!state.activeConversationId) {
				logger.warn('Intento de agregar mensaje sin conversación activa', null, 'ChatStore');
				return state;
			}

			const conversationIndex = state.conversations.findIndex(
				conv => conv.id === state.activeConversationId
			);

			if (conversationIndex === -1) {
				logger.error('Conversación activa no encontrada', {
					activeId: state.activeConversationId
				}, 'ChatStore');
				return state;
			}

			const enhancedMessage = chatService.addMessage(state.activeConversationId, message);
			messageId = enhancedMessage.id;

			const updatedConversations = [...state.conversations];
			updatedConversations[conversationIndex] = {
				...updatedConversations[conversationIndex],
				messages: [...updatedConversations[conversationIndex].messages, enhancedMessage]
			};

			// Actualizar metadatos
			chatService.updateConversationMetadata(updatedConversations[conversationIndex]);

			return {
				...state,
				conversations: updatedConversations
			};
		});

		this.saveToStorage();
		return messageId;
	}

	/**
	 * Actualiza el nombre de una conversación
	 */
	updateConversationName(conversationId: string, newName: string): void {
		chatState.update(state => {
			const conversationIndex = state.conversations.findIndex(conv => conv.id === conversationId);
			if (conversationIndex === -1) return state;

			const updatedConversations = [...state.conversations];
			updatedConversations[conversationIndex] = {
				...updatedConversations[conversationIndex],
				name: newName.trim(),
				lastActivity: new Date()
			};

			return {
				...state,
				conversations: updatedConversations
			};
		});

		this.saveToStorage();

		logger.info('Nombre de conversación actualizado', {
			conversationId,
			newName
		}, 'ChatStore');
	}

	/**
	 * Agrega o quita tags de una conversación
	 */
	updateConversationTags(conversationId: string, tags: string[]): void {
		chatState.update(state => {
			const conversationIndex = state.conversations.findIndex(conv => conv.id === conversationId);
			if (conversationIndex === -1) return state;

			const updatedConversations = [...state.conversations];
			updatedConversations[conversationIndex] = {
				...updatedConversations[conversationIndex],
				tags: [...new Set(tags)], // Eliminar duplicados
				lastActivity: new Date()
			};

			return {
				...state,
				conversations: updatedConversations
			};
		});

		this.saveToStorage();

		logger.info('Tags de conversación actualizados', {
			conversationId,
			tags
		}, 'ChatStore');
	}

	/**
	 * Marca/desmarca una conversación como favorita
	 */
	toggleFavorite(conversationId: string): void {
		let isFavoriteValue: boolean | undefined;
		chatState.update(state => {
			const conversationIndex = state.conversations.findIndex(conv => conv.id === conversationId);
			if (conversationIndex === -1) return state;

			const updatedConversations = [...state.conversations];
			const isFavorite = !updatedConversations[conversationIndex].isFavorite;

			updatedConversations[conversationIndex] = {
				...updatedConversations[conversationIndex],
				isFavorite,
				lastActivity: new Date()
			};
			isFavoriteValue = isFavorite;

			// Actualizar lista de favoritos
			const favorites = state.favorites.filter(fav =>
				!(fav.type === 'conversation' && fav.targetId === conversationId)
			);

			if (isFavorite) {
				favorites.push({
					id: `fav_${Date.now()}`,
					type: 'conversation',
					targetId: conversationId,
					createdAt: new Date()
				});
			}

			return {
				...state,
				conversations: updatedConversations,
				favorites
			};
		});

		this.saveToStorage();

		logger.info('Estado de favorito actualizado', {
			conversationId,
			isFavorite: isFavoriteValue
		}, 'ChatStore');
	}

	/**
	 * Archiva una conversación
	 */
	archiveConversation(conversationId: string): void {
		this.updateConversationStatus(conversationId, 'archived');
	}

	/**
	 * Elimina una conversación (marca como eliminada)
	 */
	deleteConversation(conversationId: string): void {
		this.updateConversationStatus(conversationId, 'deleted');

		// Si es la conversación activa, desactivarla
		chatState.update(state => ({
			...state,
			activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId
		}));
	}

	/**
	 * Restaura una conversación archivada o eliminada
	 */
	restoreConversation(conversationId: string): void {
		this.updateConversationStatus(conversationId, 'active');
	}

	/**
	 * Busca en conversaciones
	 */
	async searchConversations(query: SearchQuery): Promise<void> {
		chatState.update(state => ({
			...state,
			isSearching: true,
			searchQuery: query.term
		}));

		try {
			const conversations = get(chatState).conversations;
			const results = await chatService.searchConversations(conversations, query);

			chatState.update(state => ({
				...state,
				searchResults: results,
				isSearching: false
			}));

			logger.info('Búsqueda completada', {
				query: query.term,
				resultsCount: results.totalCount
			}, 'ChatStore');

		} catch (error) {
			chatState.update(state => ({
				...state,
				isSearching: false,
				searchResults: null
			}));

			logger.error('Error en búsqueda', {
				error: error instanceof Error ? error.message : error,
				query: query.term
			}, 'ChatStore');

			throw error;
		}
	}

	/**
	 * Limpia los resultados de búsqueda
	 */
	clearSearch(): void {
		chatState.update(state => ({
			...state,
			searchQuery: '',
			searchResults: null,
			isSearching: false
		}));
	}

	/**
	 * Genera resumen para una conversación
	 */
	async generateSummary(conversationId: string): Promise<void> {
		const state = get(chatState);
		const conversation = state.conversations.find(conv => conv.id === conversationId);

		if (!conversation) {
			throw new Error('Conversación no encontrada');
		}

		try {
			const summary = await chatService.generateSummary(conversation);

			chatState.update(state => {
				const conversationIndex = state.conversations.findIndex(conv => conv.id === conversationId);
				if (conversationIndex === -1) return state;

				const updatedConversations = [...state.conversations];
				updatedConversations[conversationIndex] = {
					...updatedConversations[conversationIndex],
					summary
				};

				return {
					...state,
					conversations: updatedConversations
				};
			});

			this.saveToStorage();

		} catch (error) {
			logger.error('Error generando resumen', {
				conversationId,
				error: error instanceof Error ? error.message : error
			}, 'ChatStore');
			throw error;
		}
	}

	/**
	 * Actualiza filtros de conversaciones
	 */
	updateFilters(filters: Partial<ConversationFilters>): void {
		chatState.update(state => ({
			...state,
			filters: {
				...state.filters,
				...filters
			}
		}));

		logger.debug('Filtros actualizados', { filters }, 'ChatStore');
	}

	/**
	 * Cambia el modo de vista
	 */
	setViewMode(mode: 'list' | 'grid' | 'timeline'): void {
		chatState.update(state => ({
			...state,
			viewMode: mode
		}));
	}

	/**
	 * Cambia criterio de ordenamiento
	 */
	setSorting(sortBy: 'date' | 'name' | 'activity' | 'relevance', sortOrder: 'asc' | 'desc'): void {
		chatState.update(state => ({
			...state,
			sortBy,
			sortOrder
		}));
	}

	/**
	 * Carga conversaciones desde el almacenamiento local
	 */
	loadFromStorage(): void {
		try {
			const stored = localStorage.getItem('train-rag-conversations');
			if (stored) {
				// En la línea 468, el `any` se encuentra aquí: `conv: Record<string, any>`
				// Lo correcto sería utilizar el tipo de `Conversation` que ya has definido.
				const data = JSON.parse(stored);

				// Convertir fechas desde strings
				const conversations = data.conversations.map((conv: EnhancedConversation) => ({
					...conv,
					createdAt: new Date(conv.createdAt),
					lastActivity: new Date(conv.lastActivity),
					messages: conv.messages.map((msg: EnhancedMessage) => ({
						...msg,
						timestamp: new Date(msg.timestamp),
						editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined
					})),
					summary: conv.summary ? {
						...conv.summary,
						createdAt: new Date(conv.summary.createdAt)
					} : undefined
				}));

				chatState.update(state => ({
					...state,
					conversations,
					availableTags: data.availableTags || [],
					favorites: data.favorites?.map((fav: Favorite) => ({
						...fav,
						createdAt: new Date(fav.createdAt)
					})) || []
				}));

				logger.info('Conversaciones cargadas desde almacenamiento', {
					count: conversations.length
				}, 'ChatStore');
			}
		} catch (error) {
			logger.error('Error cargando desde almacenamiento', {
				error: error instanceof Error ? error.message : error
			}, 'ChatStore');
		}
	}

	/**
	 * Guarda conversaciones en el almacenamiento local
	 */
	private saveToStorage(): void {
		try {
			const state = get(chatState);
			const data = {
				conversations: state.conversations,
				availableTags: state.availableTags,
				favorites: state.favorites,
				lastSaved: new Date().toISOString()
			};

			// En la línea 487, la función `JSON.stringify` no requiere un tipo `any` para funcionar.
			// El error se debe a la definición de la función `saveToStorage`.
			localStorage.setItem('train-rag-conversations', JSON.stringify(data));

			logger.debug('Conversaciones guardadas en almacenamiento', {
				count: state.conversations.length
			}, 'ChatStore');
		} catch (error) {
			logger.error('Error guardando en almacenamiento', {
				error: error instanceof Error ? error.message : error
			}, 'ChatStore');
		}
	}


	/**
	 * Actualiza el estado de una conversación
	 */
	private updateConversationStatus(conversationId: string, status: 'active' | 'archived' | 'deleted'): void {
		chatState.update(state => {
			const conversationIndex = state.conversations.findIndex(conv => conv.id === conversationId);
			if (conversationIndex === -1) return state;

			const updatedConversations = [...state.conversations];
			updatedConversations[conversationIndex] = {
				...updatedConversations[conversationIndex],
				status,
				lastActivity: new Date()
			};

			return {
				...state,
				conversations: updatedConversations
			};
		});

		this.saveToStorage();

		logger.info('Estado de conversación actualizado', {
			conversationId,
			status
		}, 'ChatStore');
	}
}

// Instancia singleton de las acciones
export const chatActions = new ChatActions();

// Cargar datos al inicializar
if (typeof window !== 'undefined') {
	chatActions.loadFromStorage();
}