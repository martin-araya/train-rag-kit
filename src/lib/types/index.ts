// Tipos para el sistema de logs
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
	id: string; // ID único para cada entrada
	timestamp: Date;
	level: LogLevel;
	message: string;
	details?: unknown;
	component?: string;
	duration?: number; // Para medir duración de operaciones
	userId?: string; // Para tracking de usuario
}

// Configuración del logger
export interface LoggerConfig {
	maxEntries: number;
	enableConsole: boolean;
	enableStorage: boolean;
	defaultLevel: LogLevel;
	enablePerformanceTracking: boolean;
}

// Tipos mejorados para la API
export interface UploadResponse {
	message: string;
	chunks_added: number;
	filename?: string;
	file_id?: string;
	status: 'success' | 'error';
	metadata?: {
		pages?: number;
		size: number;
		processing_time?: number;
		created_at: string;
	};
}

export interface QueryResponse {
	query: string;
	answer: string;
	status: 'success' | 'error';
	query_id?: string;
	confidence_score?: number;
	sources?: Array<{
		chunk_id: string;
		content: string;
		relevance_score: number;
		page?: number;
	}>;
	metadata?: {
		processing_time: number;
		tokens_used: number;
		model_used: string;
	};
}

export interface ApiError {
	error: string;
	status: 'error';
	code?: string;
	details?: string;
	timestamp?: string;
	request_id?: string;
}

// Tipo para mensajes del chat
export interface Message {
	role: 'user' | 'assistant';
	content: string;
	timestamp?: Date;
	id?: string;
}

// Estados mejorados de la aplicación (actualizado con sistema de mensajes)
export interface AppState {
	selectedFile: File | null;
	uploadStatus: string;
	uploadProgress: number;
	question: string;
	messages: Message[]; // Reemplaza 'answer: string'
	isUploading: boolean;
	isQuerying: boolean;
	error: string;
	isConnected: boolean;
	lastActivity: Date | null;
	sessionId: string;
}

export interface LogState {
	logs: LogEntry[];
	showLogs: boolean;
	logLevel: LogLevel;
	config: LoggerConfig;
	isAutoScroll: boolean;
	searchFilter: string;
	componentFilter: string[];
}

// Tipos para performance tracking
export interface PerformanceMetrics {
	operationId: string;
	operationType: 'upload' | 'query' | 'api-call';
	startTime: number;
	endTime?: number;
	duration?: number;
	success: boolean;
	metadata?: Record<string, unknown>;
}

// Tipos para notificaciones
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
	id: string;
	type: NotificationType;
	title: string;
	message: string;
	duration?: number;
	persistent?: boolean;
	timestamp: Date;
}

// Tipos para validaciones mejoradas
export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	suggestions: string[];
}

export interface FileValidation extends ValidationResult {
	file?: File;
	size?: number;
	type?: string;
}

export interface QueryValidation extends ValidationResult {
	query?: string;
	wordCount?: number;
	estimatedTokens?: number;
}

// Tipos para configuración de la aplicación
export interface AppConfig {
	api: {
		baseUrl: string;
		timeout: number;
		retryAttempts: number;
		retryDelay: number;
	};
	upload: {
		maxFileSize: number;
		allowedTypes: string[];
		chunkSize: number;
	};
	query: {
		maxLength: number;
		minLength: number;
		timeout: number;
	};
	logging: LoggerConfig;
	ui: {
		theme: 'light' | 'dark' | 'auto';
		language: string;
		autoSave: boolean;
	};
}

// Tipos para eventos del sistema
export interface SystemEvent {
	type: string;
	timestamp: Date;
	data: unknown;
	source: string;
}

// Tipos para el estado de la sesión
export interface SessionState {
	id: string;
	startTime: Date;
	lastActivity: Date;
	uploadCount: number;
	queryCount: number;
	errorsCount: number;
	isActive: boolean;
}