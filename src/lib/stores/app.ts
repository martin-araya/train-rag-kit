import { writable, derived, get } from 'svelte/store';
import type { AppState, Message, Conversation } from '$lib/types';
import { logger } from './logger';
import { browser } from '$app/environment';

// Generar ID único para mensajes
const generateMessageId = (): string => {
	return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper para crear una nueva conversación
const createNewConversationObject = (): Conversation => {
	const now = new Date();
	const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	return {
		id: `conv_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
		name: `Chat @ ${timestamp}`,
		messages: [],
		createdAt: now,
		lastActivity: now
	};
};

// Estado inicial con una conversación por defecto
const firstConversation = createNewConversationObject();
const initialAppState: AppState = {
	selectedFile: null,
	uploadStatus: '',
	uploadProgress: 0,
	question: '',
	conversations: [firstConversation],
	activeConversationId: firstConversation.id,
	isUploading: false,
	isQuerying: false,
	error: '',
	isConnected: true
};

// Store principal de la aplicación
export const appStore = writable<AppState>(initialAppState);

// Store derivado para la conversación activa
export const activeConversation = derived([appStore], ([$appStore]) => {
	if (!$appStore.activeConversationId) return null;
	return $appStore.conversations.find((c) => c.id === $appStore.activeConversationId) || null;
});

// Stores derivados para mejor organización
export const fileStore = derived(appStore, $app => ({
	selectedFile: $app.selectedFile,
	uploadStatus: $app.uploadStatus,
	uploadProgress: $app.uploadProgress,
	isUploading: $app.isUploading
}));


export const connectionStore = derived(appStore, $app => ({
	isConnected: $app.isConnected
}));

export const errorStore = derived(appStore, $app => $app.error);


// Funciones para actualizar el estado del archivo
export function setSelectedFile(file: File | null) {
	const previousFile = get(appStore).selectedFile;

	appStore.update(state => ({
		...state,
		selectedFile: file,
		uploadStatus: file ? 'Archivo seleccionado' : '',
		uploadProgress: 0,
		error: ''
	}));


	if (file) {
		logger.info(
			`Archivo seleccionado: ${file.name}`,
			{
				filename: file.name,
				size: file.size,
				type: file.type,
				lastModified: new Date(file.lastModified)
			},
			'FileManager'
		);
	} else if (previousFile) {
		logger.info('Selección de archivo eliminada', { previousFile: previousFile.name }, 'FileManager');
	}
}

export function setUploadStatus(status: string) {
	appStore.update(state => ({
		...state,
		uploadStatus: status
	}));

	if (status) {
		logger.debug(`Estado de subida actualizado: ${status}`, null, 'Upload');
	}
}

export function setUploading(isUploading: boolean) {
	const currentState = get(appStore);

	appStore.update(state => ({
		...state,
		isUploading,
		uploadProgress: isUploading ? 0 : state.uploadProgress
	}));

	if (isUploading) {
		const activeConv = get(activeConversation);
		const operationId = `upload_${activeConv?.id}_${Date.now()}`;
		logger.startPerformance(operationId, 'upload');
		logger.info('Iniciando subida de archivo', {
			filename: currentState.selectedFile?.name,
			operationId
		}, 'Upload');
	} else {
		logger.info('Subida de archivo finalizada', null, 'Upload');
	}
}

export function setUploadProgress(progress: number) {
	const clampedProgress = Math.max(0, Math.min(100, progress));

	appStore.update(state => ({
		...state,
		uploadProgress: clampedProgress
	}));

	if (progress % 25 === 0 || progress === 100) {
		logger.debug(`Progreso de subida: ${clampedProgress}%`, { progress: clampedProgress }, 'Upload');
	}
}

// Funciones para actualizar el estado de las consultas
export function setQuestion(question: string) {
	const trimmedQuestion = question.trim();

	appStore.update(state => ({
		...state,
		question: trimmedQuestion,
		error: ''
	}));


	if (trimmedQuestion) {
		logger.debug(`Pregunta actualizada: ${trimmedQuestion.substring(0, 50)}...`,
			{ questionLength: trimmedQuestion.length }, 'Query');
	}
}

// Nueva función para añadir mensajes al chat
export function addMessage(message: Omit<Message, 'id' | 'timestamp'>) {
	const newMessage: Message = {
		...message,
		id: generateMessageId(),
		timestamp: new Date()
	};

	appStore.update(state => {
		const activeConvIndex = state.conversations.findIndex((c) => c.id === state.activeConversationId);
		if (activeConvIndex === -1) {
			logger.error('No hay conversación activa para añadir mensaje', { activeId: state.activeConversationId }, 'Chat');
			return state;
		}

		const updatedConversations = [...state.conversations];
		const updatedConversation = {
			...updatedConversations[activeConvIndex],
			messages: [...updatedConversations[activeConvIndex].messages, newMessage],
			lastActivity: new Date()
		};
		updatedConversations[activeConvIndex] = updatedConversation;

		return {
			...state,
			conversations: updatedConversations
		};
	});

	logger.info(`Mensaje añadido: ${newMessage.role}`, {
		messageId: newMessage.id,
		role: newMessage.role,
		contentLength: newMessage.content.length,
		conversationId: get(appStore).activeConversationId
	}, 'Chat');
}

// Función para limpiar mensajes
export function clearMessages() {
	appStore.update(state => {
		const activeConvIndex = state.conversations.findIndex((c) => c.id === state.activeConversationId);
		if (activeConvIndex === -1) return state;

		const updatedConversations = [...state.conversations];
		updatedConversations[activeConvIndex] = {
			...updatedConversations[activeConvIndex],
			messages: []
		};

		logger.info('Mensajes de la conversación activa limpiados', { conversationId: state.activeConversationId }, 'Chat');

		return {
			...state,
			conversations: updatedConversations
		};
	});
}



// Función para eliminar el último mensaje
export function removeLastMessage() {
	// Esta función podría necesitar una reimplementación o ser eliminada
	// ya que operar sobre el último mensaje de la conversación activa es más complejo.
	// Por ahora, la dejamos comentada para evitar errores.
	logger.warn('removeLastMessage no está implementado en el nuevo sistema de conversaciones.', null, 'Chat');

}

// Función para obtener el último mensaje de un rol específico


// Función legacy para compatibilidad (deprecated)
export function setAnswer(answer: string) {
	// Esta función ahora añade un mensaje del asistente en lugar de setear una respuesta única
	addMessage({ role: 'assistant', content: answer });

	logger.warn('setAnswer está deprecated, usa addMessage en su lugar', {
		answerLength: answer.length
	}, 'Compatibility');
}

export function setQuerying(isQuerying: boolean) {
	const currentState = get(appStore);

	appStore.update(state => ({
		...state,
		isQuerying
	}));


	if (isQuerying) {
		const activeConv = get(activeConversation);
		const operationId = `query_${activeConv?.id}_${Date.now()}`;
		logger.startPerformance(operationId, 'query');
		logger.info('Iniciando consulta', {
			question: currentState.question.substring(0, 100),
			operationId
		}, 'Query');
	} else {
		logger.info('Consulta finalizada', null, 'Query');
	}
}

// Funciones para el manejo de errores
export function setError(error: string) {
	appStore.update(state => ({
		...state,
		error,
		isUploading: false,
		isQuerying: false
	}));



	if (error) {
		logger.error('Error en la aplicación', { error }, 'App');
	}
}

export function clearError() {
	const currentError = get(appStore).error;

	appStore.update(state => ({
		...state,
		error: ''
	}));

	if (currentError) {
		logger.debug('Error limpiado', { previousError: currentError }, 'App');
	}
}

// Funciones para el estado de conexión
export function setConnectionStatus(isConnected: boolean) {
	const previousStatus = get(appStore).isConnected;

	appStore.update(state => ({
		...state,
		isConnected
	}));



	if (isConnected !== previousStatus) {
		const status = isConnected ? 'conectado' : 'desconectado';
		const level = isConnected ? 'info' : 'warn';
		logger[level](`Estado de conexión: ${status}`, { isConnected }, 'Connection');
	}
}

// Funciones de reset más específicas
export function resetUpload() {
	const currentState = get(appStore);

	appStore.update(state => ({
		...state,
		selectedFile: null,
		uploadStatus: '',
		uploadProgress: 0,
		isUploading: false
	}));



	logger.info('Estado de subida reiniciado', {
		previousFile: currentState.selectedFile?.name
	}, 'FileManager');
}

export function resetQuery() {
	const activeConv = get(activeConversation);

	if (activeConv) {
		clearMessages(); // Limpia los mensajes de la conversación activa
	}

	appStore.update(state => ({
		...state,
		question: '',
		isQuerying: false
	}));

	logger.info('Estado de consulta reiniciado para la conversación activa', {
		conversationId: activeConv?.id
	}, 'Chat');
}

export function resetAll() {
	const newConversation = createNewConversationObject();

	appStore.set({
		...initialAppState,
		conversations: [newConversation],
		activeConversationId: newConversation.id
	});

	logger.info('Aplicación reiniciada completamente. Nueva conversación creada.', { conversationId: newConversation.id }, 'App');
}

export function createNewConversation() {
	const newConversation = createNewConversationObject();
	appStore.update(state => ({
		...state,
		conversations: [newConversation, ...state.conversations],
		activeConversationId: newConversation.id,
		question: '',
		error: ''
	}));
	logger.info('Nueva conversación creada', { conversationId: newConversation.id }, 'Session');
}

export function setActiveConversation(conversationId: string) {
	appStore.update(state => {
		if (state.conversations.some(c => c.id === conversationId)) {
			logger.info('Cambiando a conversación', { conversationId }, 'Session');
			return { ...state, activeConversationId: conversationId };
		}
		logger.warn('Intento de cambiar a una conversación inexistente', { conversationId }, 'Session');
		return state;
	});
}

export function deleteConversation(conversationId: string) {
	appStore.update(state => {
		const conversations = state.conversations.filter(c => c.id !== conversationId);
		let activeConversationId = state.activeConversationId;

		if (conversations.length === 0) {
			const newConv = createNewConversationObject();
			logger.info('Última conversación eliminada, creando una nueva.', { newConversationId: newConv.id }, 'Session');
			return { ...initialAppState, conversations: [newConv], activeConversationId: newConv.id };
		}

		if (activeConversationId === conversationId) {
			activeConversationId = conversations[0].id;
			logger.info('Conversación activa eliminada, cambiando a la siguiente.', { newActiveId: activeConversationId }, 'Session');
		}

		logger.info('Conversación eliminada', { conversationId }, 'Session');
		return { ...state, conversations, activeConversationId };
	});

}

// Funciones helper para validaciones
export function canUpload(): boolean {
	const state = get(appStore);
	const canUpload = !!(state.selectedFile && !state.isUploading && state.isConnected);

	if (!canUpload) {
		const reasons = [];
		if (!state.selectedFile) reasons.push('no hay archivo seleccionado');
		if (state.isUploading) reasons.push('subida en progreso');
		if (!state.isConnected) reasons.push('sin conexión');

		logger.debug(`No se puede subir archivo: ${reasons.join(', ')}`, { state }, 'Validation');
	}

	return canUpload;
}

export function canQuery(): boolean {
	const state = get(appStore);
	const canQuery = !!(state.question.trim() && !state.isQuerying && state.isConnected);

	if (!canQuery) {
		const reasons = [];
		if (!state.question.trim()) reasons.push('pregunta vacía');
		if (state.isQuerying) reasons.push('consulta en progreso');
		if (!state.isConnected) reasons.push('sin conexión');

		logger.debug(`No se puede realizar consulta: ${reasons.join(', ')}`, { state }, 'Validation');
	}

	return canQuery;
}

export function hasValidFile(): boolean {
	const state = get(appStore);
	const isValid = !!(state.selectedFile && state.selectedFile.type === 'application/pdf');

	if (state.selectedFile && !isValid) {
		logger.warn('Archivo no válido seleccionado', {
			filename: state.selectedFile.name,
			type: state.selectedFile.type
		}, 'Validation');
	}

	return isValid;
}

// Función para mostrar notificaciones temporales
export function showTemporaryStatus(status: string, duration: number = 3000) {
	setUploadStatus(status);

	setTimeout(() => {
		setUploadStatus('');
	}, duration);

	logger.debug(`Estado temporal mostrado: ${status} (${duration}ms)`, { status, duration }, 'UI');
}

// Función para manejar errores con auto-clear
export function showTemporaryError(error: string, duration: number = 5000) {
	setError(error);

	setTimeout(() => {
		clearError();
	}, duration);

	logger.debug(`Error temporal mostrado: ${error} (${duration}ms)`, { error, duration }, 'UI');
}

// Función para obtener estadísticas de la sesión
export function getSessionStats() {
	const state = get(appStore);

	const activeConversation = state.conversations.find(c => c.id === state.activeConversationId);

	return {
		activeConversationId: state.activeConversationId,
		activeConversation,
		hasFile: !!state.selectedFile,
		hasQuery: !!state.question,
		isActive: state.isUploading || state.isQuerying,
		connectionStatus: state.isConnected ? 'connected' : 'disconnected',
		totalConversations: state.conversations.length
	};
}

// Función para watchear cambios y loggear eventos importantes
export function initializeAppLogging() {
	if (!browser) return;

	logger.info('Aplicación inicializada', {
		activeConversationId: get(appStore).activeConversationId,
		timestamp: new Date().toISOString(),
		userAgent: navigator.userAgent
	}, 'App');

	// Loggear cambios en errores
	appStore.subscribe((state) => {
		if (state.error) {
			logger.error('Error detectado en el estado', { error: state.error }, 'StateWatcher');
		}
	});

	// Loggear cambios de conexión
	let previousConnectionStatus = get(appStore).isConnected;
	appStore.subscribe((state) => {
		if (state.isConnected !== previousConnectionStatus) {
			const event = state.isConnected ? 'connection-restored' : 'connection-lost';
			logger.info(`Evento de conexión: ${event}`, {
				isConnected: state.isConnected
			}, 'ConnectionWatcher');
			previousConnectionStatus = state.isConnected;
		}
	});
}

// Función para limpiar recursos al salir
export function cleanup() {
	const stats = getSessionStats();

	logger.info('Limpieza de aplicación', {
		sessionDuration: stats.activeConversation ? Date.now() - stats.activeConversation.createdAt.getTime() : 0,
		...stats
	}, 'App');
}

// Inicializar logging si estamos en el browser
if (browser) {
	initializeAppLogging();

	// Cleanup al salir de la página
	window.addEventListener('beforeunload', cleanup);
}