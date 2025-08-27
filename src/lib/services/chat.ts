// src/lib/services/chat.ts
import type {
	EnhancedConversation,
	EnhancedMessage,
	SearchQuery,
	SearchResults,
	ExportOptions,
	ExportResult,
	ConversationSummary,
	Tag,
} from '$lib/types/chat';
import { logger } from '$lib/stores/logger';
import { generateId } from '$lib/utils/helpers';

class ChatService {
	private readonly STORAGE_KEY = 'train-rag-conversations';
	private readonly EXPORT_TIMEOUT = 30000; // 30 segundos

	/**
	 * Crea una nueva conversación
	 */
	createConversation(name?: string): EnhancedConversation {
		const conversation: EnhancedConversation = {
			id: generateId(),
			name: name || `Conversación ${new Date().toLocaleDateString()}`,
			messages: [],
			createdAt: new Date(),
			lastActivity: new Date(),
			status: 'active',
			isFavorite: false,
			tags: [],
			metadata: {
				messageCount: 0,
				totalTokens: 0,
				avgResponseTime: 0,
				documentsReferenced: [],
				modelsUsed: [],
				errorCount: 0
			},
			settings: {
				autoSummary: true,
				maxMessages: 1000,
				retentionDays: 365,
				exportFormat: 'markdown',
				notifications: true
			}
		};

		logger.info('Nueva conversación creada', {
			conversationId: conversation.id,
			name: conversation.name
		}, 'Chat');

		return conversation;
	}

	/**
	 * Agrega un mensaje a la conversación
	 */
	addMessage(conversationId: string, message: Omit<EnhancedMessage, 'id' | 'timestamp'>): EnhancedMessage {
		const enhancedMessage: EnhancedMessage = {
			...message,
			id: generateId(),
			timestamp: new Date()
		};

		logger.info('Mensaje agregado a conversación', {
			conversationId,
			messageId: enhancedMessage.id,
			role: enhancedMessage.role,
			contentLength: enhancedMessage.content.length
		}, 'Chat');

		return enhancedMessage;
	}

	/**
	 * Actualiza los metadatos de la conversación
	 */
	updateConversationMetadata(conversation: EnhancedConversation): void {
		const messages = conversation.messages;

		conversation.metadata = {
			messageCount: messages.length,
			totalTokens: messages.reduce((sum, msg) => sum + (msg.tokens || 0), 0),
			avgResponseTime: this.calculateAverageResponseTime(messages),
			documentsReferenced: this.extractDocumentReferences(messages),
			modelsUsed: [...new Set(messages.map(msg => msg.model).filter((model): model is string => !!model))],
			errorCount: messages.filter(msg => msg.role === 'assistant' && msg.content.includes('Error')).length
		};

		conversation.lastActivity = new Date();
	}

	/**
	 * Genera resumen automático de conversación
	 */
	async generateSummary(conversation: EnhancedConversation): Promise<ConversationSummary> {
		logger.info('Generando resumen de conversación', {
			conversationId: conversation.id,
			messageCount: conversation.messages.length
		}, 'Chat');

		// Extraer información clave
		const userMessages = conversation.messages.filter(msg => msg.role === 'user');
		const keyTopics = this.extractKeyTopics(conversation.messages);
		const mainQuestions = userMessages.map(msg => msg.content).slice(0, 10);
		const documentsUsed = [...new Set(conversation.metadata.documentsReferenced)];

		const summary: ConversationSummary = {
			id: generateId(),
			content: this.generateSummaryText(conversation),
			keyTopics,
			mainQuestions,
			documentsUsed,
			createdAt: new Date(),
			tokenCount: conversation.metadata.totalTokens,
			confidence: this.calculateSummaryConfidence(conversation)
		};

		conversation.summary = summary;

		logger.info('Resumen generado exitosamente', {
			conversationId: conversation.id,
			summaryId: summary.id,
			keyTopics: keyTopics.length,
			confidence: summary.confidence
		}, 'Chat');

		return summary;
	}

	/**
	 * Busca en conversaciones y mensajes
	 */
	async searchConversations(
		conversations: EnhancedConversation[],
		query: SearchQuery
	): Promise<SearchResults> {
		const startTime = performance.now();

		logger.info('Iniciando búsqueda en conversaciones', {
			query: query.term,
			scope: query.scope,
			conversationCount: conversations.length
		}, 'Search');

		const results = [];
		const searchTerm = query.term.toLowerCase();

		for (const conversation of conversations) {
			// Filtrar por fechas
			if (query.dateRange && !this.isInDateRange(conversation.lastActivity, query.dateRange)) {
				continue;
			}

			// Filtrar por tags
			if (query.tags?.length && !query.tags.some(tag => conversation.tags.includes(tag))) {
				continue;
			}

			// Buscar en conversación
			if (query.scope === 'all' || query.scope === 'summaries') {
				if (conversation.summary?.content.toLowerCase().includes(searchTerm)) {
					results.push({
						id: generateId(),
						type: 'summary' as const,
						conversationId: conversation.id,
						title: conversation.name,
						snippet: this.createSnippet(conversation.summary.content, searchTerm),
						relevance: this.calculateRelevance(conversation.summary.content, searchTerm),
						timestamp: conversation.summary.createdAt,
						tags: conversation.tags,
						highlights: this.findHighlights(conversation.summary.content, searchTerm)
					});
				}
			}

			// Buscar en mensajes
			if (query.scope === 'all' || query.scope === 'messages') {
				for (const message of conversation.messages) {
					if (message.content.toLowerCase().includes(searchTerm)) {
						// Filtrar por tipo de mensaje
						if (query.messageTypes?.length && !query.messageTypes.includes(message.role as 'user' | 'assistant')) {
							continue;
						}

						// Filtrar por confianza mínima
						if (query.minConfidence && (message.confidence || 0) < query.minConfidence) {
							continue;
						}

						results.push({
							id: generateId(),
							type: 'message' as const,
							conversationId: conversation.id,
							messageId: message.id,
							title: `${conversation.name} - ${message.role}`,
							snippet: this.createSnippet(message.content, searchTerm),
							relevance: this.calculateRelevance(message.content, searchTerm),
							timestamp: message.timestamp,
							tags: conversation.tags,
							highlights: this.findHighlights(message.content, searchTerm)
						});
					}
				}
			}
		}

		// Ordenar por relevancia
		results.sort((a, b) => b.relevance - a.relevance);

		const executionTime = performance.now() - startTime;

		logger.info('Búsqueda completada', {
			query: query.term,
			resultsCount: results.length,
			executionTime: Math.round(executionTime)
		}, 'Search');

		return {
			query,
			results,
			totalCount: results.length,
			executionTime,
			suggestions: this.generateSearchSuggestions(query.term, results)
		};
	}

	/**
	 * Exporta conversaciones en diferentes formatos
	 */
	async exportConversations(
		conversations: EnhancedConversation[],
		options: ExportOptions
	): Promise<ExportResult> {
		const startTime = performance.now();

		logger.info('Iniciando exportación de conversaciones', {
			format: options.format,
			conversationCount: conversations.length,
			includeMetadata: options.includeMetadata
		}, 'Export');

		try {
			let content: string;
			let mimeType: string;
			let fileExtension: string;

			switch (options.format) {
				case 'markdown':
					content = this.exportToMarkdown(conversations, options);
					mimeType = 'text/markdown';
					fileExtension = 'md';
					break;

				case 'json':
					content = this.exportToJSON(conversations, options);
					mimeType = 'application/json';
					fileExtension = 'json';
					break;

				case 'txt':
					content = this.exportToText(conversations, options);
					mimeType = 'text/plain';
					fileExtension = 'txt';
					break;

				case 'pdf':
					// Para PDF necesitaríamos una librería como jsPDF
					throw new Error('Exportación a PDF no implementada aún');

				default:
					throw new Error(`Formato de exportación no soportado: ${options.format}`);
			}

			const blob = new Blob([content], { type: mimeType });
			const url = URL.createObjectURL(blob);
			const filename = `conversaciones_${new Date().toISOString().split('T')[0]}.${fileExtension}`;

			const result: ExportResult = {
				id: generateId(),
				format: options.format,
				filename,
				size: blob.size,
				createdAt: new Date(),
				downloadUrl: url,
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
			};

			const executionTime = performance.now() - startTime;

			logger.info('Exportación completada exitosamente', {
				format: options.format,
				filename,
				size: blob.size,
				executionTime: Math.round(executionTime)
			}, 'Export');

			return result;

		} catch (error) {
			logger.error('Error en exportación', {
				error: error instanceof Error ? error.message : error,
				format: options.format
			}, 'Export');
			throw error;
		}
	}

	/**
	 * Gestiona tags de conversaciones
	 */
	async manageTags(): Promise<Tag[]> {
		// Esta función se conectaría con el almacenamiento de tags
		const systemTags: Tag[] = [
			{
				id: 'important',
				name: 'Importante',
				color: '#ef4444',
				description: 'Conversaciones marcadas como importantes',
				createdAt: new Date(),
				usageCount: 0,
				isSystemTag: true
			},
			{
				id: 'work',
				name: 'Trabajo',
				color: '#3b82f6',
				description: 'Conversaciones relacionadas con trabajo',
				createdAt: new Date(),
				usageCount: 0,
				isSystemTag: true
			},
			{
				id: 'research',
				name: 'Investigación',
				color: '#10b981',
				description: 'Conversaciones de investigación',
				createdAt: new Date(),
				usageCount: 0,
				isSystemTag: true
			}
		];

		return systemTags;
	}

	// Métodos privados auxiliares

	private calculateAverageResponseTime(messages: EnhancedMessage[]): number {
		const responseTimes = messages
			.filter(msg => msg.processingTime)
			.map(msg => msg.processingTime!);

		return responseTimes.length > 0
			? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
			: 0;
	}

	private extractDocumentReferences(messages: EnhancedMessage[]): string[] {
		const documents = new Set<string>();

		messages.forEach(message => {
			message.sources?.forEach(source => {
				documents.add(source.filename);
			});
		});

		return Array.from(documents);
	}

	private extractKeyTopics(messages: EnhancedMessage[]): string[] {
		// Implementación simple - en producción usarías NLP
		const allText = messages.map(msg => msg.content).join(' ').toLowerCase();
		const words = allText.split(/\s+/);
		const wordCount = new Map<string, number>();

		// Filtrar palabras comunes y contar frecuencias
		const stopWords = new Set(['el', 'la', 'de', 'que', 'y', 'es', 'en', 'un', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 'las', 'una', 'como', 'pero', 'sus', 'fue', 'ser', 'tiene', 'entre', 'sin', 'sobre', 'esta', 'más', 'hasta', 'desde', 'cuando', 'muy', 'todo', 'también', 'otro', 'años', 'hay', 'día', 'puede', 'hacer', 'cada', 'tiempo', 'parte', 'mundo', 'vida', 'estados', 'gobierno', 'país']);

		words.forEach(word => {
			if (word.length > 3 && !stopWords.has(word)) {
				wordCount.set(word, (wordCount.get(word) || 0) + 1);
			}
		});

		return Array.from(wordCount.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.map(([word]) => word);
	}

	private generateSummaryText(conversation: EnhancedConversation): string {
		const userQuestions = conversation.messages
			.filter(msg => msg.role === 'user')
			.slice(0, 5)
			.map(msg => msg.content.substring(0, 100))
			.join('. ');

		return `Esta conversación incluye ${conversation.messages.length} mensajes sobre temas como: ${conversation.summary?.keyTopics?.join(', ') || 'varios temas'}. Las principales consultas fueron: ${userQuestions}`;
	}

	private calculateSummaryConfidence(conversation: EnhancedConversation): number {
		// Calcular confianza basada en varios factores
		let confidence = 0.5; // Base

		// Más mensajes = más confianza
		if (conversation.messages.length > 10) confidence += 0.2;
		if (conversation.messages.length > 20) confidence += 0.1;

		// Presencia de fuentes aumenta confianza
		const messagesWithSources = conversation.messages.filter(msg => msg.sources?.length);
		if (messagesWithSources.length > 0) {
			confidence += Math.min(0.2, messagesWithSources.length * 0.05);
		}

		// Pocos errores aumenta confianza
		if (conversation.metadata.errorCount === 0) confidence += 0.1;

		return Math.min(1, confidence);
	}

	private isInDateRange(date: Date, range: { start: Date; end: Date }): boolean {
		return date >= range.start && date <= range.end;
	}

	private createSnippet(content: string, searchTerm: string, maxLength: number = 150): string {
		const index = content.toLowerCase().indexOf(searchTerm.toLowerCase());
		if (index === -1) return content.substring(0, maxLength) + '...';

		const start = Math.max(0, index - 50);
		const end = Math.min(content.length, index + searchTerm.length + 50);

		return (start > 0 ? '...' : '') +
			content.substring(start, end) +
			(end < content.length ? '...' : '');
	}

	private calculateRelevance(content: string, searchTerm: string): number {
		const contentLower = content.toLowerCase();
		const termLower = searchTerm.toLowerCase();

		// Contar ocurrencias
		const matches = (contentLower.match(new RegExp(termLower, 'g')) || []).length;

		// Normalizar por longitud del contenido
		return Math.min(1, matches / Math.sqrt(content.length / 100));
	}

	private findHighlights(content: string, searchTerm: string): string[] {
		const highlights = [];
		const regex = new RegExp(searchTerm, 'gi');
		let match;

		while ((match = regex.exec(content)) !== null && highlights.length < 5) {
			const start = Math.max(0, match.index - 20);
			const end = Math.min(content.length, match.index + searchTerm.length + 20);
			highlights.push(content.substring(start, end));
		}

		return highlights;
	}

	private generateSearchSuggestions(term: string, results: SearchResults['results']): string[] {
		// Implementación simple de sugerencias
		const suggestions = [];

		if (results.length === 0) {
			suggestions.push(`"${term}" con diferente ortografía`);
			suggestions.push(`Términos relacionados a "${term}"`);
		} else if (results.length < 5) {
			suggestions.push(`"${term}" en todas las conversaciones`);
			suggestions.push(`"${term}" solo en favoritos`);
		}

		return suggestions.slice(0, 3);
	}

	private exportToMarkdown(conversations: EnhancedConversation[], options: ExportOptions): string {
		let content = `# Exportación de Conversaciones\n\n`;
		content += `**Fecha de exportación:** ${new Date().toLocaleString()}\n`;
		content += `**Conversaciones incluidas:** ${conversations.length}\n\n`;

		conversations.forEach(conversation => {
			content += `## ${conversation.name}\n\n`;

			if (options.includeMetadata) {
				content += `**ID:** ${conversation.id}\n`;
				content += `**Creada:** ${conversation.createdAt.toLocaleString()}\n`;
				content += `**Última actividad:** ${conversation.lastActivity.toLocaleString()}\n`;
				content += `**Mensajes:** ${conversation.metadata.messageCount}\n`;
				content += `**Tags:** ${conversation.tags.join(', ') || 'Ninguno'}\n\n`;
			}

			if (conversation.summary && options.includeMetadata) {
				content += `### Resumen\n${conversation.summary.content}\n\n`;
			}

			content += `### Mensajes\n\n`;

			conversation.messages.forEach(message => {
				const role = message.role === 'user' ? '👤 Usuario' : '🤖 Asistente';
				content += `#### ${role}${options.includeTimestamps ? ` - ${message.timestamp.toLocaleString()}` : ''}\n\n`;
				content += `${message.content}\n\n`;

				if (options.includeSources && message.sources?.length) {
					content += `**Fuentes:**\n`;
					message.sources.forEach(source => {
						content += `- ${source.filename} (página ${source.page || 'N/A'})\n`;
					});
					content += `\n`;
				}
			});

			content += `---\n\n`;
		});

		return content;
	}

	private exportToJSON(conversations: EnhancedConversation[], options: ExportOptions): string {
		const exportData = {
			exportDate: new Date().toISOString(),
			options,
			conversations: conversations.map(conv => ({
				...conv,
				messages: conv.messages.map(msg => ({
					...msg,
					sources: options.includeSources ? msg.sources : undefined
				})),
				metadata: options.includeMetadata ? conv.metadata : undefined,
				summary: options.includeMetadata ? conv.summary : undefined
			}))
		};

		return JSON.stringify(exportData, null, 2);
	}

	private exportToText(conversations: EnhancedConversation[], options: ExportOptions): string {
		let content = `EXPORTACIÓN DE CONVERSACIONES\n`;
		content += `===============================\n\n`;
		content += `Fecha de exportación: ${new Date().toLocaleString()}\n`;
		content += `Conversaciones incluidas: ${conversations.length}\n\n`;

		conversations.forEach((conversation, index) => {
			content += `\n${'='.repeat(50)}\n`;
			content += `CONVERSACIÓN ${index + 1}: ${conversation.name}\n`;
			content += `${'='.repeat(50)}\n\n`;

			if (options.includeMetadata) {
				content += `ID: ${conversation.id}\n`;
				content += `Creada: ${conversation.createdAt.toLocaleString()}\n`;
				content += `Última actividad: ${conversation.lastActivity.toLocaleString()}\n`;
				content += `Mensajes: ${conversation.metadata.messageCount}\n`;
				content += `Tags: ${conversation.tags.join(', ') || 'Ninguno'}\n\n`;
			}

			conversation.messages.forEach((message, msgIndex) => {
				const role = message.role === 'user' ? 'USUARIO' : 'ASISTENTE';
				content += `\n${'-'.repeat(30)}\n`;
				content += `${role} ${msgIndex + 1}${options.includeTimestamps ? ` - ${message.timestamp.toLocaleString()}` : ''}\n`;
				content += `${'-'.repeat(30)}\n`;
				content += `${message.content}\n`;

				if (options.includeSources && message.sources?.length) {
					content += `\nFUENTES:\n`;
					message.sources.forEach(source => {
						content += `- ${source.filename} (página ${source.page || 'N/A'})\n`;
					});
				}
			});
		});

		return content;
	}
}

// Instancia singleton del servicio
export const chatService = new ChatService();