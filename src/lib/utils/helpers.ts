// src/lib/utils/helpers.ts
// Utilidades generales para el sistema de chat

/**
 * Genera un ID único
 */
export function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Trunca texto a una longitud específica
 */
export function truncateText(text: string, maxLength: number, ellipsis = '...'): string {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Formatea un número de bytes a formato legible
 */
export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Debounce function para optimizar búsquedas
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
	func: T,
	wait: number,
	immediate = false
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return function executedFunction(...args: Parameters<T>) {
		const later = () => {
			timeout = null;
			if (!immediate) func(...args);
		};

		const callNow = immediate && !timeout;

		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(later, wait);

		if (callNow) func(...args);
	};
}

/**
 * Extrae palabras clave de un texto
 */
export function extractKeywords(text: string, maxKeywords = 10): string[] {
	// Lista de palabras vacías en español
	const stopWords = new Set([
		'el', 'la', 'de', 'que', 'y', 'es', 'en', 'un', 'se', 'no', 'te', 'lo',
		'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 'las',
		'una', 'como', 'pero', 'sus', 'fue', 'ser', 'tiene', 'entre', 'sin',
		'sobre', 'esta', 'más', 'hasta', 'desde', 'cuando', 'muy', 'todo',
		'también', 'otro', 'años', 'hay', 'día', 'puede', 'hacer', 'cada',
		'tiempo', 'parte', 'mundo', 'vida', 'estados', 'gobierno', 'país',
		'me', 'mi', 'tu', 'ti', 'él', 'ella', 'nosotros', 'vosotros', 'ellos',
		'ellas', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
		'aquel', 'aquella', 'aquellos', 'aquellas', 'soy', 'eres', 'somos',
		'sois', 'son', 'era', 'eras', 'éramos', 'erais', 'eran', 'he', 'has',
		'ha', 'hemos', 'habéis', 'han', 'había', 'habías', 'habíamos',
		'habíais', 'habían', 'hube', 'hubiste', 'hubo', 'hubimos', 'hubisteis',
		'hubieron', 'seré', 'serás', 'será', 'seremos', 'seréis', 'serán'
	]);

	// Limpiar y dividir el texto
	const words = text
		.toLowerCase()
		.replace(/[^\w\sáéíóúüñ]/g, ' ')
		.split(/\s+/)
		.filter(word => word.length > 2 && !stopWords.has(word));

	// Contar frecuencias
	const wordCount = new Map<string, number>();
	words.forEach(word => {
		wordCount.set(word, (wordCount.get(word) || 0) + 1);
	});

	// Ordenar por frecuencia y devolver las más comunes
	return Array.from(wordCount.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, maxKeywords)
		.map(([word]) => word);
}

/**
 * Calcula la similitud entre dos strings usando Levenshtein distance
 */
export function calculateSimilarity(str1: string, str2: string): number {
	const track = Array(str2.length + 1).fill(null).map(() =>
		Array(str1.length + 1).fill(null));

	for (let i = 0; i <= str1.length; i += 1) {
		track[0][i] = i;
	}

	for (let j = 0; j <= str2.length; j += 1) {
		track[j][0] = j;
	}

	for (let j = 1; j <= str2.length; j += 1) {
		for (let i = 1; i <= str1.length; i += 1) {
			const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
			track[j][i] = Math.min(
				track[j][i - 1] + 1, // deletion
				track[j - 1][i] + 1, // insertion
				track[j - 1][i - 1] + indicator, // substitution
			);
		}
	}

	const distance = track[str2.length][str1.length];
	const maxLength = Math.max(str1.length, str2.length);

	return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

/**
 * Resalta términos de búsqueda en un texto
 */
export function highlightSearchTerms(text: string, searchTerm: string): string {
	if (!searchTerm.trim()) return text;

	const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
	return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
}

/**
 * Escapa caracteres especiales para regex
 */
export function escapeRegExp(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Convierte un timestamp a formato legible relativo
 */
export function timeAgo(date: Date): string {
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	const intervals = [
		{ label: 'año', seconds: 31536000 },
		{ label: 'mes', seconds: 2592000 },
		{ label: 'día', seconds: 86400 },
		{ label: 'hora', seconds: 3600 },
		{ label: 'minuto', seconds: 60 },
		{ label: 'segundo', seconds: 1 }
	];

	for (const interval of intervals) {
		const count = Math.floor(diffInSeconds / interval.seconds);
		if (count >= 1) {
			return `hace ${count} ${interval.label}${count !== 1 ? 's' : ''}`;
		}
	}

	return 'ahora mismo';
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Genera un color hexadecimal basado en un string
 */
export function stringToColor(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}

	const hue = hash % 360;
	return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Convierte texto a formato slug
 */
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '') // Remover acentos
		.replace(/[^a-z0-9 -]/g, '') // Solo letras, números, espacios y guiones
		.replace(/\s+/g, '-') // Reemplazar espacios con guiones
		.replace(/-+/g, '-') // Eliminar guiones duplicados
		.trim();
}

/**
 * Copia texto al portapapeles
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		if (navigator.clipboard && window.isSecureContext) {
			await navigator.clipboard.writeText(text);
			return true;
		} else {
			// Fallback para navegadores más antiguos
			const textArea = document.createElement('textarea');
			textArea.value = text;
			textArea.style.position = 'fixed';
			textArea.style.left = '-999999px';
			textArea.style.top = '-999999px';
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			const result = document.execCommand('copy');
			document.body.removeChild(textArea);
			return result;
		}
	} catch (error) {
		console.error('Error copiando al portapapeles:', error);
		return false;
	}
}

/**
 * Descarga contenido como archivo
 */
export function downloadAsFile(content: string, filename: string, mimeType = 'text/plain'): void {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	// Limpiar URL después de un tiempo
	setTimeout(() => {
		URL.revokeObjectURL(url);
	}, 1000);
}

/**
 * Valida estructura de JSON
 */
export function isValidJSON(str: string): boolean {
	try {
		JSON.parse(str);
		return true;
	} catch {
		return false;
	}
}

/**
 * Formatea número con separadores de miles
 */
export function formatNumber(num: number, locale = 'es-ES'): string {
	return new Intl.NumberFormat(locale).format(num);
}

/**
 * Capitaliza la primera letra de cada palabra
 */
export function capitalize(str: string): string {
	return str.replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Trunca texto por palabras en lugar de caracteres
 */
export function truncateWords(text: string, maxWords: number, ellipsis = '...'): string {
	const words = text.split(' ');
	if (words.length <= maxWords) return text;

	return words.slice(0, maxWords).join(' ') + ellipsis;
}

/**
 * Determina si es modo oscuro basado en preferencias del sistema
 */
export function prefersDarkMode(): boolean {
	return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Obtiene contraste legible para un color de fondo
 */
export function getContrastColor(backgroundColor: string): string {
	// Convertir color a RGB
	const rgb = backgroundColor.match(/\d+/g);
	if (!rgb || rgb.length < 3) return '#000000';

	// Calcular luminancia
	const [r, g, b] = rgb.map(Number);
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

	// Retornar color con buen contraste
	return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Parsea parámetros de URL
 */
export function parseUrlParams(url: string): Record<string, string> {
	const params = new URLSearchParams(url.split('?')[1] || '');
	const result: Record<string, string> = {};

	for (const [key, value] of params) {
		result[key] = value;
	}

	return result;
}

/**
 * Genera un hash simple para un string
 */
export function simpleHash(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convertir a 32-bit integer
	}
	return Math.abs(hash);
}

/**
 * Limpia texto de caracteres especiales manteniendo espacios
 */
export function cleanText(text: string): string {
	return text
		.replace(/[^\w\sáéíóúüñÁÉÍÓÚÜÑ]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Convierte camelCase a palabras separadas
 */
export function camelCaseToWords(str: string): string {
	return str
		.replace(/([A-Z])/g, ' $1')
		.replace(/^./, str => str.toUpperCase())
		.trim();
}

/**
 * Obtiene la extensión de un nombre de archivo
 */
export function getFileExtension(filename: string): string {
	return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * Verifica si un elemento está visible en el viewport
 */
export function isElementInViewport(element: Element): boolean {
	const rect = element.getBoundingClientRect();
	return (
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	);
}

/**
 * Scroll suave hacia un elemento
 */
export function smoothScrollTo(element: Element, offset = 0): void {
	const elementPosition = element.getBoundingClientRect().top;
	const offsetPosition = elementPosition + window.pageYOffset - offset;

	window.scrollTo({
		top: offsetPosition,
		behavior: 'smooth'
	});
}

/**
 * Throttle function para optimizar eventos como scroll
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
	func: T,
	limit: number
): (this: ThisParameterType<T>, ...args: Parameters<T>) => void {
	let inThrottle: boolean;

	return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}

/**
 * Genera nombre de archivo único agregando timestamp
 */
export function generateUniqueFilename(originalName: string): string {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const extension = getFileExtension(originalName);
	const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');

	return `${slugify(nameWithoutExt)}-${timestamp}${extension ? '.' + extension : ''}`;
}

/**
 * Convierte objeto a parámetros de URL
 */
export function objectToUrlParams(obj: Record<string, unknown>): string {
	const params = new URLSearchParams();

	for (const [key, value] of Object.entries(obj)) {
		if (value !== null && value !== undefined) {
			params.append(key, String(value));
		}
	}

	return params.toString();
}

/**
 * Detecta tipo de dispositivo
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
	const width = window.innerWidth;

	if (width < 768) return 'mobile';
	if (width < 1024) return 'tablet';
	return 'desktop';
}

/**
 * Formatea duración en milisegundos a formato legible
 */
export function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
	} else if (minutes > 0) {
		return `${minutes}m ${seconds % 60}s`;
	} else {
		return `${seconds}s`;
	}
}

/**
 * Divide array en chunks de tamaño específico
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}
	return chunks;
}

/**
 * Obtiene valor anidado de objeto usando path de puntos
 */
export function getNestedValue(obj: object, path: string): unknown {
	return path.split('.').reduce((current, key) => {
		if (current === null || current === undefined) {
			return undefined;
		}
		return (current as Record<string, unknown>)[key];
	}, obj as unknown);
}

/**
 * Establece valor anidado en objeto usando path de puntos
 */
export function setNestedValue(obj: object, path: string, value: unknown): void {
	const keys = path.split('.');
	const lastKey = keys.pop();

	if (!lastKey) return;

	// 1. Cambiamos 'any' por 'unknown' para mayor seguridad de tipos.
	const target = keys.reduce((current: Record<string, unknown>, key) => {
		// Verificamos si la propiedad actual no es un objeto que podamos recorrer.
		if (!current[key] || typeof current[key] !== 'object') {
			current[key] = {}; // Si no lo es, creamos un objeto vacío.
		}
		// 2. Usamos una aserción para decirle a TypeScript que el valor devuelto es del tipo esperado.
		return current[key] as Record<string, unknown>;
	}, obj as Record<string, unknown>); // 3. Iniciamos el reduce con el tipo correcto.

	// Asignamos el valor final a la última clave del path.
	target[lastKey] = value;
}