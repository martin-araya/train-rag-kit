import type { LogLevel, LogEntry } from '$lib/types';
import { browser } from '$app/environment';

// Contador para IDs únicos
let logIdCounter = 0;

// Función para crear entradas de log
export function createLogEntry(
	level: LogLevel,
	message: string,
	details?: unknown,
	component?: string,
	duration?: number
): LogEntry {
	return {
		id: `log_${Date.now()}_${++logIdCounter}`,
		timestamp: new Date(),
		level,
		message,
		details,
		component,
		duration,
		userId: getUserId()
	};
}

// Función para logging en consola
export function logToConsole(entry: LogEntry): void {
	if (!browser) return;

	const timestamp = entry.timestamp.toLocaleTimeString();
	const component = entry.component || 'App';
	const duration = entry.duration ? ` (${entry.duration.toFixed(2)}ms)` : '';

	const logMessage = `[${timestamp}] [${component}] ${entry.message}${duration}`;

	// Estilos para consola
	const styles = getConsoleStyles(entry.level);

	switch (entry.level) {
		case 'debug':
			console.debug(`%c${logMessage}`, styles, entry.details);
			break;
		case 'info':
			console.info(`%c${logMessage}`, styles, entry.details);
			break;
		case 'warn':
			console.warn(`%c${logMessage}`, styles, entry.details);
			break;
		case 'error':
			console.error(`%c${logMessage}`, styles, entry.details);
			if (entry.details instanceof Error) {
				console.error('Stack trace:', entry.details.stack);
			}
			break;
	}
}

// Función para obtener estilos de consola
function getConsoleStyles(level: LogLevel): string {
	const baseStyle = 'padding: 2px 4px; border-radius: 2px; font-weight: bold;';

	switch (level) {
		case 'debug':
			return `${baseStyle} background: #f3f4f6; color: #6b7280;`;
		case 'info':
			return `${baseStyle} background: #dbeafe; color: #2563eb;`;
		case 'warn':
			return `${baseStyle} background: #fef3c7; color: #d97706;`;
		case 'error':
			return `${baseStyle} background: #fee2e2; color: #dc2626;`;
		default:
			return baseStyle;
	}
}

// Función para colores de texto
export function getLogLevelColor(level: LogLevel): string {
	switch (level) {
		case 'debug': return 'text-gray-500 dark:text-gray-400';
		case 'info': return 'text-blue-600 dark:text-blue-400';
		case 'warn': return 'text-yellow-600 dark:text-yellow-400';
		case 'error': return 'text-red-600 dark:text-red-400';
		default: return 'text-gray-500 dark:text-gray-400';
	}
}

// Función para colores de badge
export function getLogLevelBadgeColor(level: LogLevel): string {
	switch (level) {
		case 'debug':
			return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
		case 'info':
			return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
		case 'warn':
			return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
		case 'error':
			return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
		default:
			return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
	}
}

// Función para determinar si mostrar un log
export function shouldShowLog(log: LogEntry, currentLevel: LogLevel): boolean {
	const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
	const currentLevelIndex = levels.indexOf(currentLevel);
	const logLevelIndex = levels.indexOf(log.level);
	return logLevelIndex >= currentLevelIndex;
}

// Función para exportar logs
export function exportLogs(logs: LogEntry[], format: 'json' | 'csv' | 'txt' = 'json'): void {
	if (!browser) return;

	const timestamp = new Date().toISOString().split('T')[0];
	let content: string;
	let mimeType: string;
	let extension: string;

	switch (format) {
		case 'csv':
			content = convertLogsToCSV(logs);
			mimeType = 'text/csv';
			extension = 'csv';
			break;
		case 'txt':
			content = convertLogsToText(logs);
			mimeType = 'text/plain';
			extension = 'txt';
			break;
		default:
			content = JSON.stringify(logs, null, 2);
			mimeType = 'application/json';
			extension = 'json';
	}

	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');

	a.href = url;
	a.download = `rag-logs-${timestamp}.${extension}`;
	a.style.display = 'none';

	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// Función para convertir logs a CSV
function convertLogsToCSV(logs: LogEntry[]): string {
	const headers = ['Timestamp', 'Level', 'Component', 'Message', 'Duration', 'Details'];
	const rows = logs.map(log => [
		log.timestamp.toISOString(),
		log.level,
		log.component || '',
		`"${log.message.replace(/"/g, '""')}"`, // Escapar comillas
		log.duration?.toString() || '',
		log.details ? `"${JSON.stringify(log.details).replace(/"/g, '""')}"` : ''
	]);

	return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

// Función para convertir logs a texto plano
function convertLogsToText(logs: LogEntry[]): string {
	return logs.map(log => {
		const timestamp = log.timestamp.toLocaleString();
		const component = log.component ? `[${log.component}] ` : '';
		const duration = log.duration ? ` (${log.duration.toFixed(2)}ms)` : '';
		const details = log.details ? `\n  Details: ${JSON.stringify(log.details, null, 2)}` : '';

		return `[${timestamp}] ${log.level.toUpperCase()} ${component}${log.message}${duration}${details}`;
	}).join('\n\n');
}

// Función para obtener ID de usuario
function getUserId(): string {
	if (!browser) return 'server';

	let userId = localStorage.getItem('rag-user-id');
	if (!userId) {
		userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		localStorage.setItem('rag-user-id', userId);
	}
	return userId;
}

// Función para formatear la duración
export function formatDuration(duration?: number): string {
	if (!duration) return '';

	if (duration < 1000) {
		return `${duration.toFixed(2)}ms`;
	} else if (duration < 60000) {
		return `${(duration / 1000).toFixed(2)}s`;
	} else {
		const minutes = Math.floor(duration / 60000);
		const seconds = ((duration % 60000) / 1000).toFixed(2);
		return `${minutes}m ${seconds}s`;
	}
}

// Función para formatear el timestamp de manera relativa
export function formatRelativeTime(timestamp: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - timestamp.getTime();

	if (diffMs < 60000) { // Menos de 1 minuto
		return 'Hace unos segundos';
	} else if (diffMs < 3600000) { // Menos de 1 hora
		const minutes = Math.floor(diffMs / 60000);
		return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
	} else if (diffMs < 86400000) { // Menos de 1 día
		const hours = Math.floor(diffMs / 3600000);
		return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
	} else {
		return timestamp.toLocaleString();
	}
}

// Función para limpiar detalles sensibles en logs
export function sanitizeLogDetails(details: unknown): unknown {
	if (typeof details !== 'object' || details === null) {
		return details;
	}

	const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential'];
	const sanitized = { ...details as Record<string, unknown> };

	Object.keys(sanitized).forEach(key => {
		if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
			sanitized[key] = '[REDACTED]';
		}
	});

	return sanitized;
}

// Función para agrupar logs por componente
export function groupLogsByComponent(logs: LogEntry[]): Record<string, LogEntry[]> {
	return logs.reduce((groups, log) => {
		const component = log.component || 'Unknown';
		if (!groups[component]) {
			groups[component] = [];
		}
		groups[component].push(log);
		return groups;
	}, {} as Record<string, LogEntry[]>);
}

// Función para obtener estadísticas de performance
export function getPerformanceStats(logs: LogEntry[]): {
	averageDuration: number;
	totalOperations: number;
	slowestOperation: LogEntry | null;
	fastestOperation: LogEntry | null;
} {
	const logsWithDuration = logs.filter(log => log.duration !== undefined);

	if (logsWithDuration.length === 0) {
		return {
			averageDuration: 0,
			totalOperations: 0,
			slowestOperation: null,
			fastestOperation: null
		};
	}

	const durations = logsWithDuration.map(log => log.duration!);
	const averageDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;

	const slowestOperation = logsWithDuration.reduce((slowest, current) =>
		(current.duration! > (slowest?.duration || 0)) ? current : slowest
	);

	const fastestOperation = logsWithDuration.reduce((fastest, current) =>
		(current.duration! < (fastest?.duration || Infinity)) ? current : fastest
	);

	return {
		averageDuration,
		totalOperations: logsWithDuration.length,
		slowestOperation,
		fastestOperation
	};
}