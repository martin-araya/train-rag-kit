// src/lib/types/chat.ts
// Tipos extendidos para el sistema de chat inteligente

export type ExportFormat = 'pdf' | 'markdown' | 'json' | 'txt';
export type ConversationStatus = 'active' | 'archived' | 'deleted';
export type SearchScope = 'all' | 'messages' | 'summaries' | 'tags';

// Interfaz extendida para mensajes con más metadatos
export interface EnhancedMessage {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: Date;
	edited?: boolean;
	editedAt?: Date;
	tokens?: number;
	model?: string;
	processingTime?: number;
	confidence?: number;
	sources?: MessageSource[];
	reactions?: MessageReaction[];
	isBookmarked?: boolean;
}

export interface MessageSource {
	id: string;
	filename: string;
	page?: number;
	chunk: string;
	relevance: number;
}

export interface MessageReaction {
	type: 'like' | 'dislike' | 'bookmark' | 'flag';
	timestamp: Date;
	userId?: string;
}

// Interfaz extendida para conversaciones
export interface EnhancedConversation {
	id: string;
	name: string;
	messages: EnhancedMessage[];
	createdAt: Date;
	lastActivity: Date;
	status: ConversationStatus;
	isFavorite: boolean;
	tags: string[];
	summary?: ConversationSummary;
	metadata: ConversationMetadata;
	settings: ConversationSettings;
}

export interface ConversationSummary {
	id: string;
	content: string;
	keyTopics: string[];
	mainQuestions: string[];
	documentsUsed: string[];
	createdAt: Date;
	tokenCount: number;
	confidence: number;
}

export interface ConversationMetadata {
	messageCount: number;
	totalTokens: number;
	avgResponseTime: number;
	documentsReferenced: string[];
	modelsUsed: string[];
	errorCount: number;
	lastBackup?: Date;
}

export interface ConversationSettings {
	autoSummary: boolean;
	maxMessages: number;
	retentionDays: number;
	exportFormat: ExportFormat;
	notifications: boolean;
}

// Tipos para búsqueda avanzada
export interface SearchQuery {
	term: string;
	scope: SearchScope;
	dateRange?: DateRange;
	tags?: string[];
	conversationIds?: string[];
	messageTypes?: ('user' | 'assistant')[];
	hasBookmarks?: boolean;
	minConfidence?: number;
}

export interface DateRange {
	start: Date;
	end: Date;
}

export interface SearchResult {
	id: string;
	type: 'message' | 'conversation' | 'summary';
	conversationId: string;
	messageId?: string;
	title: string;
	snippet: string;
	relevance: number;
	timestamp: Date;
	tags: string[];
	highlights: string[];
}

export interface SearchResults {
	query: SearchQuery;
	results: SearchResult[];
	totalCount: number;
	executionTime: number;
	suggestions: string[];
}

// Tipos para exportación
export interface ExportOptions {
	format: ExportFormat;
	includeMetadata: boolean;
	includeSources: boolean;
	includeTimestamps: boolean;
	dateRange?: DateRange;
	conversations?: string[];
	template?: string;
}

export interface ExportResult {
	id: string;
	format: ExportFormat;
	filename: string;
	size: number;
	createdAt: Date;
	downloadUrl: string;
	expiresAt: Date;
}

// Tipos para gestión de tags
export interface Tag {
	id: string;
	name: string;
	color: string;
	description?: string;
	createdAt: Date;
	usageCount: number;
	isSystemTag: boolean;
}

// Tipos para favoritos y bookmarks
export interface Favorite {
	id: string;
	type: 'conversation' | 'message';
	targetId: string;
	createdAt: Date;
	note?: string;
}

// Estado del chat inteligente
export interface ChatState {
	conversations: EnhancedConversation[];
	activeConversationId: string | null;
	searchQuery: string;
	searchResults: SearchResults | null;
	isSearching: boolean;
	selectedTags: string[];
	availableTags: Tag[];
	favorites: Favorite[];
	viewMode: 'list' | 'grid' | 'timeline';
	sortBy: 'date' | 'name' | 'activity' | 'relevance';
	sortOrder: 'asc' | 'desc';
	filters: ConversationFilters;
	exportStatus: ExportStatus;
	isConnected: boolean;
}

export interface ConversationFilters {
	status: ConversationStatus[];
	tags: string[];
	dateRange?: DateRange;
	hasBookmarks?: boolean;
	minMessages?: number;
	maxMessages?: number;
}

export interface ExportStatus {
	isExporting: boolean;
	progress: number;
	currentFile?: string;
	error?: string;
}

// Tipos para configuración del chat
export interface ChatConfig {
	autoSummary: {
		enabled: boolean;
		minMessages: number;
		interval: number; // en minutos
	};
	search: {
		maxResults: number;
		highlightLength: number;
		fuzzySearch: boolean;
	};
	export: {
		defaultFormat: ExportFormat;
		includeMetadata: boolean;
		maxFileSize: number; // en MB
	};
	ui: {
		messagesPerPage: number;
		autoScroll: boolean;
		showTimestamps: boolean;
		compactMode: boolean;
	};
	retention: {
		autoArchive: boolean;
		archiveAfterDays: number;
		autoDelete: boolean;
		deleteAfterDays: number;
	};
}