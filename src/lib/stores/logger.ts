import { writable, derived, get } from 'svelte/store';
import type { LogLevel, LogState, LogEntry, LoggerConfig, PerformanceMetrics } from '$lib/types';
import { createLogEntry, logToConsole, shouldShowLog } from '$lib/utils/logger';
import { browser } from '$app/environment';

// Configuración por defecto del logger
const defaultConfig: LoggerConfig = {
	maxEntries: 1000,
	enableConsole: true,
	enableStorage: browser,
	defaultLevel: 'info',
	enablePerformanceTracking: true
};

// Estado inicial del logger
const initialLogState: LogState = {
	logs: [],
	showLogs: false,
	logLevel: 'info',
	config: defaultConfig,
	isAutoScroll: true,
	searchFilter: '',
	componentFilter: []
};

// Store principal del logger
export const logStore = writable<LogState>(initialLogState);

// Store derivado para logs filtrados
export const filteredLogs = derived(logStore, ($logState) => {
	let filtered = $logState.logs.filter(log =>
		shouldShowLog(log, $logState.logLevel)
	);

	// Filtro por búsqueda
	if ($logState.searchFilter) {
		const searchTerm = $logState.searchFilter.toLowerCase();
		filtered = filtered.filter(log =>
			log.message.toLowerCase().includes(searchTerm) ||
			log.component?.toLowerCase().includes(searchTerm) ||
			(typeof log.details === 'string' && log.details.toLowerCase().includes(searchTerm))
		);
	}

	// Filtro por componente
	if ($logState.componentFilter.length > 0) {
		filtered = filtered.filter(log =>
			log.component && $logState.componentFilter.includes(log.component)
		);
	}

	return filtered;
});

// Store derivado para estadísticas de logs
export const logStats = derived(logStore, ($logState) => {
	const stats = {
		total: $logState.logs.length,
		debug: 0,
		info: 0,
		warn: 0,
		error: 0,
		components: new Set<string>()
	};

	$logState.logs.forEach(log => {
		stats[log.level]++;
		if (log.component) {
			stats.components.add(log.component);
		}
	});

	return {
		...stats,
		components: Array.from(stats.components)
	};
});

// Map para tracking de performance
const performanceTracking = new Map<string, PerformanceMetrics>();

// Función mejorada para agregar un log
export function addLog(
	level: LogLevel,
	message: string,
	details?: unknown,
	component?: string,
	duration?: number
) {
	const state = get(logStore);

	// Verificar si el log debe ser mostrado según el nivel
	if (!shouldShowLog({ level } as LogEntry, state.logLevel)) {
		return;
	}

	const entry = createLogEntry(level, message, details, component, duration);

	// Log en consola si está habilitado
	if (state.config.enableConsole) {
		logToConsole(entry);
	}

	// Actualizar store
	logStore.update(currentState => {
		const newLogs = [entry, ...currentState.logs];

		// Mantener solo el máximo de entradas configurado
		if (newLogs.length > currentState.config.maxEntries) {
			newLogs.splice(currentState.config.maxEntries);
		}

		return {
			...currentState,
			logs: newLogs
		};
	});

	// Guardar en localStorage si está habilitado
	if (state.config.enableStorage && browser) {
		try {
			const recentLogs = get(logStore).logs.slice(0, 100); // Solo últimos 100
			localStorage.setItem('rag-app-logs', JSON.stringify(recentLogs));
		} catch (error) {
			console.warn('No se pudieron guardar los logs en localStorage:', error);
		}
	}
}

// Logger mejorado con funciones adicionales
export const logger = {
	debug: (message: string, details?: unknown, component?: string) =>
		addLog('debug', message, details, component),

	info: (message: string, details?: unknown, component?: string) =>
		addLog('info', message, details, component),

	warn: (message: string, details?: unknown, component?: string) =>
		addLog('warn', message, details, component),

	error: (message: string, details?: unknown, component?: string) =>
		addLog('error', message, details, component),

	// Función para logs con duración
	withDuration: (
		level: LogLevel,
		message: string,
		duration: number,
		details?: unknown,
		component?: string
	) => addLog(level, message, details, component, duration),

	// Función para iniciar tracking de performance
	startPerformance: (operationId: string, type: PerformanceMetrics['operationType']): void => {
		if (!get(logStore).config.enablePerformanceTracking) return;

		performanceTracking.set(operationId, {
			operationId,
			operationType: type,
			startTime: performance.now(),
			success: false
		});

		logger.debug(`Iniciando operación: ${type}`, { operationId }, 'Performance');
	},

	// Función para finalizar tracking de performance
	endPerformance: (operationId: string, success: boolean = true, metadata?: Record<string, unknown>): void => {
		const metrics = performanceTracking.get(operationId);
		if (!metrics) return;

		const endTime = performance.now();
		const duration = endTime - metrics.startTime;

		const completedMetrics: PerformanceMetrics = {
			...metrics,
			endTime,
			duration,
			success,
			metadata
		};

		performanceTracking.delete(operationId);

		const level = success ? 'info' : 'warn';
		const status = success ? 'completada' : 'falló';

		logger.withDuration(
			level,
			`Operación ${metrics.operationType} ${status}`,
			duration,
			completedMetrics,
			'Performance'
		);
	}
};

// Función para limpiar logs
export function clearLogs() {
	logStore.update(state => ({
		...state,
		logs: []
	}));

	if (browser) {
		localStorage.removeItem('rag-app-logs');
	}

	logger.info('Logs limpiados', null, 'LogSystem');
}

// Función para toggle de visibilidad
export function toggleLogs() {
	logStore.update(state => {
		const newShowLogs = !state.showLogs;
		logger.debug(`Panel de logs ${newShowLogs ? 'mostrado' : 'ocultado'}`, null, 'UI');
		return {
			...state,
			showLogs: newShowLogs
		};
	});
}

// Función para cambiar nivel de log
export function setLogLevel(level: LogLevel) {
	logStore.update(state => ({
		...state,
		logLevel: level
	}));
	logger.info(`Nivel de log cambiado a: ${level}`, null, 'LogSystem');
}

// Función para configurar el logger
export function configureLogger(config: Partial<LoggerConfig>) {
	logStore.update(state => ({
		...state,
		config: { ...state.config, ...config }
	}));
	logger.info('Configuración del logger actualizada', config, 'LogSystem');
}

// Función para establecer filtros
export function setSearchFilter(filter: string) {
	logStore.update(state => ({
		...state,
		searchFilter: filter
	}));
}

export function setComponentFilter(components: string[]) {
	logStore.update(state => ({
		...state,
		componentFilter: components
	}));
}

export function toggleAutoScroll() {
	logStore.update(state => ({
		...state,
		isAutoScroll: !state.isAutoScroll
	}));
}

// Función para cargar logs desde localStorage
export function loadStoredLogs() {
	if (!browser) return;

	try {
		const stored = localStorage.getItem('rag-app-logs');
		if (stored) {
			const logs: LogEntry[] = JSON.parse(stored);
			logStore.update(state => ({
				...state,
				logs: logs.map(log => ({
					...log,
					timestamp: new Date(log.timestamp)
				}))
			}));
			logger.info(`${logs.length} logs cargados desde localStorage`, null, 'LogSystem');
		}
	} catch (error) {
		logger.error('Error cargando logs desde localStorage', error, 'LogSystem');
	}
}

// Inicializar logs almacenados al crear el store
if (browser) {
	loadStoredLogs();
}