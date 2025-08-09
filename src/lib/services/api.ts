import type { UploadResponse, QueryResponse, ApiError } from '$lib/types';
import { dev } from '$app/environment';
import { logger } from '$lib/stores/logger';

// Tipos para modelos de Ollama
export interface OllamaModel {
	name: string;
	size: number;
	digest: string;
	modified_at: string;
	details?: {
		format?: string;
		family?: string;
		families?: string[];
		parameter_size?: string;
		quantization_level?: string;
	};
}

export interface OllamaModelsResponse {
	models: OllamaModel[];
}

export interface ModelSelectionState {
	selectedModel: string;
	availableModels: OllamaModel[];
	isLoading: boolean;
	error?: string;
}

// URL de la API del backend con variable de entorno
const API_URL = dev
	? 'http://localhost:8080'
	: import.meta.env.VITE_API_URL || 'http://localhost:8080';

// URLs de Ollama
const OLLAMA_URL = dev
	? 'http://localhost:11434'
	: import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';

// Timeout para las requests
const REQUEST_TIMEOUT = 30000; // 30 segundos
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 segundo

// Helper para crear requests con timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

	try {
		logger.debug(`Iniciando request: ${options.method || 'GET'} ${url}`, { options }, 'API');

		const response = await fetch(url, {
			...options,
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		logger.debug(`Request completado: ${response.status} ${response.statusText}`, {
			url,
			status: response.status,
			statusText: response.statusText,
			headers: Object.fromEntries(response.headers.entries())
		}, 'API');

		return response;
	} catch (error) {
		clearTimeout(timeoutId);

		if (error instanceof Error && error.name === 'AbortError') {
			const timeoutError = new Error('La solicitud ha tardado demasiado tiempo. Inténtalo de nuevo.');
			logger.error('Request timeout', { url, timeout: REQUEST_TIMEOUT }, 'API');
			throw timeoutError;
		}

		logger.error('Request failed', { url, error: error instanceof Error ? error.message : error }, 'API');
		throw error;
	}
}

// Helper para manejar errores de la API
function handleApiError(error: unknown, context: string): Error {
	if (error instanceof Error) {
		logger.error(`API Error en ${context}`, {
			message: error.message,
			stack: error.stack,
			context
		}, 'API');
		return error;
	}

	const unknownError = new Error(`Error desconocido en ${context}`);
	logger.error('Unknown API Error', { error, context }, 'API');
	return unknownError;
}

// Helper para retry con backoff exponencial
async function withRetry<T>(
	operation: () => Promise<T>,
	context: string,
	attempts: number = RETRY_ATTEMPTS
): Promise<T> {
	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			if (attempt > 1) {
				logger.info(`Reintentando operación (intento ${attempt}/${attempts})`, { context }, 'API');
			}

			return await operation();
		} catch (error) {
			if (attempt === attempts) {
				logger.error(`Operación falló después de ${attempts} intentos`, {
					context,
					error: error instanceof Error ? error.message : error
				}, 'API');
				throw error;
			}

			const delay = RETRY_DELAY * Math.pow(2, attempt - 1); // Backoff exponencial
			logger.warn(`Intento ${attempt} falló, reintentando en ${delay}ms`, {
				context,
				error: error instanceof Error ? error.message : error,
				nextAttempt: attempt + 1
			}, 'API');

			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}

	throw new Error('Retry logic error'); // No debería llegar aquí
}

// Validaciones mejoradas
function validateFile(file: File): void {
	if (!file) {
		throw new Error('No se ha seleccionado ningún archivo');
	}

	if (file.type !== 'application/pdf') {
		logger.warn('Tipo de archivo inválido', {
			filename: file.name,
			type: file.type,
			expectedType: 'application/pdf'
		}, 'Validation');
		throw new Error('El archivo debe ser un PDF');
	}

	// Límite de tamaño (10MB)
	const MAX_FILE_SIZE = 10 * 1024 * 1024;
	if (file.size > MAX_FILE_SIZE) {
		logger.warn('Archivo demasiado grande', {
			filename: file.name,
			size: file.size,
			maxSize: MAX_FILE_SIZE
		}, 'Validation');
		throw new Error('El archivo es demasiado grande. El tamaño máximo es de 10MB');
	}

	// Validar nombre de archivo
	if (file.name.length > 255) {
		throw new Error('El nombre del archivo es demasiado largo');
	}

	logger.info('Archivo validado correctamente', {
		filename: file.name,
		size: file.size,
		type: file.type
	}, 'Validation');
}

function validateQuery(question: string): string {
	if (!question?.trim()) {
		throw new Error('La pregunta no puede estar vacía');
	}

	const trimmed = question.trim();

	if (trimmed.length < 3) {
		throw new Error('La pregunta es demasiado corta. Mínimo 3 caracteres');
	}

	if (trimmed.length > 1000) {
		logger.warn('Pregunta muy larga', {
			questionLength: trimmed.length,
			maxLength: 1000
		}, 'Validation');
		throw new Error('La pregunta es demasiado larga. Máximo 1000 caracteres');
	}

	logger.debug('Pregunta validada', {
		questionLength: trimmed.length,
		wordCount: trimmed.split(/\s+/).length
	}, 'Validation');

	return trimmed;
}

// Función para obtener modelos disponibles de Ollama
export async function getOllamaModels(): Promise<OllamaModel[]> {
	const operationId = `get_models_${Date.now()}`;
	logger.startPerformance(operationId, 'api-call');

	try {
		logger.info('Obteniendo modelos de Ollama', { ollamaUrl: OLLAMA_URL }, 'Ollama');

		const response = await withRetry(
			() => fetchWithTimeout(`${OLLAMA_URL}/api/tags`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				}
			}),
			'get Ollama models'
		);

		if (!response.ok) {
			throw new Error(`Error al obtener modelos de Ollama: ${response.status} ${response.statusText}`);
		}

		const result: OllamaModelsResponse = await response.json();

		logger.info('Modelos de Ollama obtenidos exitosamente', {
			modelsCount: result.models.length,
			models: result.models.map(m => m.name)
		}, 'Ollama');

		logger.endPerformance(operationId, true, {
			modelsCount: result.models.length
		});

		return result.models;
	} catch (error) {
		logger.error('Error obteniendo modelos de Ollama', {
			error: error instanceof Error ? error.message : error
		}, 'Ollama');

		logger.endPerformance(operationId, false, {
			error: error instanceof Error ? error.message : 'Unknown error'
		});

		// En caso de error, retornamos un array vacío en lugar de lanzar error
		// para que la aplicación pueda funcionar sin Ollama
		return [];
	}
}

// Función para verificar si Ollama está disponible
export async function checkOllamaHealth(): Promise<boolean> {
	try {
		logger.debug('Verificando salud de Ollama', { ollamaUrl: OLLAMA_URL }, 'Ollama');

		const response = await fetchWithTimeout(`${OLLAMA_URL}/api/version`, {
			method: 'GET'
		});

		const isHealthy = response.ok;

		logger.info(`Estado de Ollama: ${isHealthy ? 'disponible' : 'no disponible'}`, {
			status: response.status,
			statusText: response.statusText
		}, 'Ollama');

		return isHealthy;
	} catch (error) {
		logger.warn('Ollama no está disponible', {
			error: error instanceof Error ? error.message : error
		}, 'Ollama');
		return false;
	}
}

// Función para cambiar el modelo activo en el backend
export async function setActiveModel(modelName: string): Promise<{ success: boolean; message: string }> {
	const operationId = `set_model_${Date.now()}`;
	logger.startPerformance(operationId, 'api-call');

	try {
		logger.info('Cambiando modelo activo', { modelName }, 'ModelSelection');

		const response = await withRetry(
			() => fetchWithTimeout(`${API_URL}/set-model`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ model: modelName })
			}),
			'set active model'
		);

		const result = await response.json();

		if (!response.ok) {
			const errorData = result as ApiError;
			const errorMessage = errorData.error || `Error del servidor: ${response.status}`;

			logger.error('Error al cambiar modelo', {
				error: errorMessage,
				status: response.status,
				modelName
			}, 'ModelSelection');

			logger.endPerformance(operationId, false, { error: errorMessage });
			throw new Error(errorMessage);
		}

		logger.info('Modelo cambiado exitosamente', {
			modelName,
			message: result.message
		}, 'ModelSelection');

		logger.endPerformance(operationId, true, { modelName });

		return { success: true, message: result.message || 'Modelo cambiado correctamente' };
	} catch (error) {
		logger.endPerformance(operationId, false, {
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		throw handleApiError(error, 'setActiveModel');
	}
}

// Función para obtener el modelo activo actual
export async function getCurrentModel(): Promise<{ model: string; available: boolean }> {
	try {
		logger.debug('Obteniendo modelo actual', null, 'ModelSelection');

		const response = await fetchWithTimeout(`${API_URL}/current-model`, {
			method: 'GET',
			headers: {
				'Accept': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`Error al obtener modelo actual: ${response.status}`);
		}

		const result = await response.json();

		logger.info('Modelo actual obtenido', {
			model: result.model,
			available: result.available
		}, 'ModelSelection');

		return result;
	} catch (error) {
		logger.warn('Error obteniendo modelo actual', {
			error: error instanceof Error ? error.message : error
		}, 'ModelSelection');

		// Retornamos un modelo por defecto en caso de error
		return { model: 'llama2', available: false };
	}
}

// Servicio para subir archivos PDF (sin cambios)
export async function uploadPDF(file: File): Promise<UploadResponse> {
	const operationId = `upload_${Date.now()}`;
	logger.startPerformance(operationId, 'upload');

	try {
		validateFile(file);

		const formData = new FormData();

		if (!file || !(file instanceof File)) {
			throw new Error('El objeto proporcionado no es un archivo válido');
		}

		formData.append('upload_file', file, file.name);

		logger.debug('FormData creado', {
			filename: file.name,
			size: file.size,
			type: file.type,
			hasFile: formData.has('upload_file')
		}, 'Upload');

		const uploadedFile = formData.get('upload_file');
		if (!uploadedFile) {
			throw new Error('Error al agregar el archivo al FormData');
		}

		logger.info('Iniciando subida de PDF', {
			filename: file.name,
			size: file.size,
			operationId
		}, 'Upload');

		const response = await withRetry(
			() => fetchWithTimeout(`${API_URL}/upload-pdf`, {
				method: 'POST',
				body: formData
			}),
			'upload PDF'
		);

		logger.debug('Response recibida', {
			status: response.status,
			statusText: response.statusText,
			headers: Object.fromEntries(response.headers.entries()),
			operationId
		}, 'Upload');

		let result;
		try {
			result = await response.json();
		} catch (jsonError) {
			logger.error('Error parsing JSON response', {
				jsonError: jsonError instanceof Error ? jsonError.message : jsonError,
				operationId
			}, 'Upload');
			throw new Error('Respuesta del servidor no válida');
		}

		if (!response.ok) {
			const errorData = result as ApiError;
			const errorMessage = errorData.error || `Error del servidor: ${response.status}`;

			logger.error('Upload failed', {
				error: errorMessage,
				status: response.status,
				responseBody: result,
				operationId
			}, 'Upload');

			logger.endPerformance(operationId, false, { error: errorMessage });
			throw new Error(errorMessage);
		}

		const uploadResponse = result as UploadResponse;

		logger.info('PDF subido exitosamente', {
			filename: file.name,
			chunksAdded: uploadResponse.chunks_added,
			message: uploadResponse.message,
			operationId
		}, 'Upload');

		logger.endPerformance(operationId, true, {
			chunksAdded: uploadResponse.chunks_added,
			fileSize: file.size
		});

		return uploadResponse;
	} catch (error) {
		logger.endPerformance(operationId, false, {
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		throw handleApiError(error, 'uploadPDF');
	}
}

// Servicio para realizar consultas (modificado para incluir modelo)
export async function queryDocuments(question: string, model?: string): Promise<QueryResponse> {
	const operationId = `query_${Date.now()}`;
	logger.startPerformance(operationId, 'query');

	try {
		const validatedQuestion = validateQuery(question);
		const encodedQuestion = encodeURIComponent(validatedQuestion);

		// Construir URL con parámetros opcionales
		let url = `${API_URL}/query?q=${encodedQuestion}`;
		if (model) {
			url += `&model=${encodeURIComponent(model)}`;
		}

		logger.info('Iniciando consulta a documentos', {
			question: validatedQuestion.substring(0, 100),
			questionLength: validatedQuestion.length,
			model: model || 'default',
			operationId
		}, 'Query');

		const response = await withRetry(
			() => fetchWithTimeout(url, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				}
			}),
			'query documents'
		);

		const result = await response.json();

		if (!response.ok) {
			const errorData = result as ApiError;
			const errorMessage = errorData.error || `Error del servidor: ${response.status}`;

			logger.error('Query failed', {
				error: errorMessage,
				status: response.status,
				question: validatedQuestion.substring(0, 50),
				model: model || 'default',
				operationId
			}, 'Query');

			logger.endPerformance(operationId, false, { error: errorMessage });
			throw new Error(errorMessage);
		}

		const queryResponse = result as QueryResponse;

		logger.info('Consulta completada exitosamente', {
			question: validatedQuestion.substring(0, 50),
			answerLength: queryResponse.answer.length,
			sourcesCount: queryResponse.sources?.length || 0,
			confidence: queryResponse.confidence_score,
			model: model || 'default',
			operationId
		}, 'Query');

		logger.endPerformance(operationId, true, {
			answerLength: queryResponse.answer.length,
			sourcesCount: queryResponse.sources?.length || 0,
			confidence: queryResponse.confidence_score,
			processingTime: queryResponse.metadata?.processing_time
		});

		return queryResponse;
	} catch (error) {
		logger.endPerformance(operationId, false, {
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		throw handleApiError(error, 'queryDocuments');
	}
}

// Función para verificar la conectividad con la API
export async function checkApiHealth(): Promise<boolean> {
	try {
		logger.debug('Verificando salud de la API', null, 'HealthCheck');

		const response = await fetchWithTimeout(`${API_URL}/health`, {
			method: 'GET'
		});

		const isHealthy = response.ok;

		logger.info(`Estado de la API: ${isHealthy ? 'saludable' : 'no disponible'}`, {
			status: response.status,
			statusText: response.statusText
		}, 'HealthCheck');

		return isHealthy;
	} catch (error) {
		logger.error('Health check failed', {
			error: error instanceof Error ? error.message : error
		}, 'HealthCheck');
		return false;
	}
}

// Función para obtener información del servidor
export async function getServerInfo(): Promise<{ status: string; version?: string }> {
	try {
		logger.debug('Obteniendo información del servidor', null, 'ServerInfo');

		const response = await fetchWithTimeout(`${API_URL}/`, {
			method: 'GET',
			headers: {
				'Accept': 'application/json'
			}
		});

		if (response.ok) {
			const data = await response.json();

			logger.info('Información del servidor obtenida', {
				status: data.status,
				version: data.version
			}, 'ServerInfo');

			return data;
		}

		logger.warn('Servidor disponible pero sin información detallada', {
			status: response.status
		}, 'ServerInfo');

		return { status: 'unknown' };
	} catch (error) {
		logger.error('No se pudo obtener información del servidor', {
			error: error instanceof Error ? error.message : error
		}, 'ServerInfo');
		return { status: 'offline' };
	}
}

// Función para verificar conectividad periodicamente (incluyendo Ollama)
export function startHealthMonitoring(intervalMs: number = 30000): () => void {
	logger.info('Iniciando monitoreo de salud de la API y Ollama', { intervalMs }, 'HealthMonitor');

	const intervalId = setInterval(async () => {
		const [apiHealthy, ollamaHealthy] = await Promise.all([
			checkApiHealth(),
			checkOllamaHealth()
		]);

		// Emitir evento personalizado para que otros componentes puedan reaccionar
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('health-check', {
				detail: {
					api: apiHealthy,
					ollama: ollamaHealthy
				}
			}));
		}
	}, intervalMs);

	// Función para detener el monitoreo
	return () => {
		clearInterval(intervalId);
		logger.info('Monitoreo de salud detenido', null, 'HealthMonitor');
	};
}

// Función para limpiar caché del navegador relacionado con la API
export function clearApiCache(): void {
	if (typeof window !== 'undefined' && 'caches' in window) {
		caches.keys().then(cacheNames => {
			cacheNames.forEach(cacheName => {
				if (cacheName.includes('api') || cacheName.includes(API_URL) || cacheName.includes(OLLAMA_URL)) {
					caches.delete(cacheName);
					logger.info(`Cache eliminado: ${cacheName}`, null, 'CacheManager');
				}
			});
		});
	}
}

// Función para obtener métricas de la API
export function getApiMetrics() {
	return {
		baseUrl: API_URL,
		ollamaUrl: OLLAMA_URL,
		timeout: REQUEST_TIMEOUT,
		retryAttempts: RETRY_ATTEMPTS,
		retryDelay: RETRY_DELAY
	};
}

// Helper para formatear el tamaño de los modelos
export function formatModelSize(bytes: number): string {
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	if (bytes === 0) return '0 B';
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Helper para obtener información resumida del modelo
export function getModelInfo(model: OllamaModel): string {
	const size = formatModelSize(model.size);
	const params = model.details?.parameter_size || '';
	const family = model.details?.family || '';

	let info = size;
	if (params) info += ` • ${params}`;
	if (family) info += ` • ${family}`;

	return info;
}

// Log de inicialización del servicio
logger.info('Servicio de API con soporte Ollama inicializado', {
	apiUrl: API_URL,
	ollamaUrl: OLLAMA_URL,
	timeout: REQUEST_TIMEOUT,
	retryAttempts: RETRY_ATTEMPTS,
	environment: dev ? 'development' : 'production'
}, 'API');