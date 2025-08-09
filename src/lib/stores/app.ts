import { writable, derived, get } from 'svelte/store';
import type { AppState, Message } from '$lib/types';
import { logger } from './logger';
import { browser } from '$app/environment';

// Generar ID único para mensajes
const generateMessageId = (): string => {
	return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Generar ID de sesión único
const generateSessionId = (): string => {
	return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Estado inicial de la aplicación (actualizado con sistema de mensajes)
const initialAppState: AppState = {
	selectedFile: null,
	uploadStatus: '',
	uploadProgress: 0,
	question: '',
	messages: [], // Reemplaza 'answer: ""'
	isUploading: false,
	isQuerying: false,
	error: '',
	isConnected: true,
	lastActivity: null,
	sessionId: generateSessionId()
};

// Store principal de la aplicación
export const appStore = writable<AppState>(initialAppState);

// Stores derivados para mejor organización
export const fileStore = derived(appStore, $app => ({
	selectedFile: $app.selectedFile,
	uploadStatus: $app.uploadStatus,
	uploadProgress: $app.uploadProgress,
	isUploading: $app.isUploading
}));

export const queryStore = derived(appStore, $app => ({
	question: $app.question,
	messages: $app.messages,
	isQuerying: $app.isQuerying
}));

export const connectionStore = derived(appStore, $app => ({
	isConnected: $app.isConnected,
	lastActivity: $app.lastActivity
}));

export const errorStore = derived(appStore, $app => $app.error);

// Helper para actualizar última actividad
function updateLastActivity() {
	appStore.update(state => ({
		...state,
		lastActivity: new Date()
	}));
}

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

	updateLastActivity();

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

	updateLastActivity();

	if (isUploading) {
		const operationId = `upload_${currentState.sessionId}_${Date.now()}`;
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

	updateLastActivity();

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

	appStore.update(state => ({
		...state,
		messages: [...state.messages, newMessage]
	}));

	updateLastActivity();

	logger.info(`Mensaje añadido: ${newMessage.role}`, {
		messageId: newMessage.id,
		role: newMessage.role,
		contentLength: newMessage.content.length,
		messagesCount: get(appStore).messages.length
	}, 'Chat');
}

// Función para limpiar mensajes
export function clearMessages() {
	const currentMessageCount = get(appStore).messages.length;

	appStore.update(state => ({
		...state,
		messages: []
	}));

	updateLastActivity();

	logger.info('Mensajes del chat limpiados', {
		previousMessageCount: currentMessageCount
	}, 'Chat');
}

// Función para eliminar el último mensaje
export function removeLastMessage() {
	const currentState = get(appStore);
	if (currentState.messages.length === 0) return;

	const removedMessage = currentState.messages[currentState.messages.length - 1];

	appStore.update(state => ({
		...state,
		messages: state.messages.slice(0, -1)
	}));

	updateLastActivity();

	logger.info('Último mensaje eliminado', {
		removedMessageId: removedMessage.id,
		removedRole: removedMessage.role,
		remainingMessages: get(appStore).messages.length
	}, 'Chat');
}

// Función para obtener el último mensaje de un rol específico
export function getLastMessage(role?: 'user' | 'assistant'): Message | null {
	const messages = get(appStore).messages;

	if (!role) {
		return messages[messages.length - 1] || null;
	}

	for (let i = messages.length - 1; i >= 0; i--) {
		if (messages[i].role === role) {
			return messages[i];
		}
	}

	return null;
}

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

	updateLastActivity();

	if (isQuerying) {
		const operationId = `query_${currentState.sessionId}_${Date.now()}`;
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

	updateLastActivity();

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

	updateLastActivity();

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

	updateLastActivity();

	logger.info('Estado de subida reiniciado', {
		previousFile: currentState.selectedFile?.name
	}, 'FileManager');
}

export function resetQuery() {
	const currentState = get(appStore);

	appStore.update(state => ({
		...state,
		question: '',
		messages: [], // Limpiar mensajes en lugar de answer
		isQuerying: false
	}));

	updateLastActivity();

	logger.info('Estado de consulta reiniciado', {
		hadQuestion: !!currentState.question,
		messageCount: currentState.messages.length
	}, 'Query');
}

export function resetAll() {
	const currentSessionId = get(appStore).sessionId;

	appStore.set({
		...initialAppState,
		sessionId: currentSessionId // Mantener el ID de sesión actual
	});

	logger.info('Aplicación reiniciada completamente', { sessionId: currentSessionId }, 'App');
}

export function startNewSession() {
	const newSessionId = generateSessionId();

	appStore.set({
		...initialAppState,
		sessionId: newSessionId
	});

	logger.info('Nueva sesión iniciada', { sessionId: newSessionId }, 'Session');
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

	return {
		sessionId: state.sessionId,
		startTime: initialAppState.lastActivity || new Date(),
		lastActivity: state.lastActivity,
		hasFile: !!state.selectedFile,
		hasQuery: !!state.question,
		questionCount: state.messages.filter((m) => m.role === 'user').length,
		answerCount: state.messages.filter((m) => m.role === 'assistant').length,
		isActive: state.isUploading || state.isQuerying,
		connectionStatus: state.isConnected ? 'connected' : 'disconnected'
	};
}

// Función para watchear cambios y loggear eventos importantes
export function initializeAppLogging() {
	if (!browser) return;

	logger.info('Aplicación inicializada', {
		sessionId: get(appStore).sessionId,
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
		sessionDuration: stats.lastActivity ?
			Date.now() - (stats.lastActivity?.getTime() || 0) : 0,
		...stats
	}, 'App');
}

// Inicializar logging si estamos en el browser
if (browser) {
	initializeAppLogging();

	// Cleanup al salir de la página
	window.addEventListener('beforeunload', cleanup);
}