<!-- src/routes/+layout.svelte - Layout integrado -->
<script lang="ts">
	import '../app.css';
	import { onMount, type Snippet } from 'svelte';
	import { logger } from '$lib/stores/logger';
	import { browser } from '$app/environment';
	import { chatActions } from '$lib/stores/chat';

	let { children }: { children: Snippet } = $props();

	let darkMode = $state(false);
	let initialLoad = $state(true);
	let isTogglingTheme = false;

	onMount(() => {
		// Log inicial cuando se monta la aplicación
		logger.info('Aplicación RAG con Chat Inteligente inicializada', {
			timestamp: new Date().toISOString(),
			userAgent: navigator.userAgent,
			viewport: {
				width: window.innerWidth,
				height: window.innerHeight
			}
		}, 'App');

		// Cargar conversaciones guardadas
		chatActions.loadFromStorage();

		// Detectar preferencia de tema
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
		const savedTheme = localStorage.getItem('theme');

		if (savedTheme) {
			darkMode = savedTheme === 'dark';
		} else {
			darkMode = prefersDark.matches;
		}

		// Aplicar tema inicial
		updateTheme();

		// Escuchar cambios en la preferencia del sistema
		prefersDark.addEventListener('change', (e) => {
			if (!localStorage.getItem('theme')) {
				darkMode = e.matches;
				updateTheme();
			}
		});

		// Ocultar la pantalla de carga después de un breve momento
		setTimeout(() => {
			initialLoad = false;
		}, 200);
	});

	function updateTheme() {
		if (browser) {
			if (darkMode) {
				document.documentElement.classList.add('dark');
				localStorage.setItem('theme', 'dark');
			} else {
				document.documentElement.classList.remove('dark');
				localStorage.setItem('theme', 'light');
			}
		}
	}

	function toggleTheme() {
		if (isTogglingTheme) return;
		isTogglingTheme = true;

		darkMode = !darkMode;
		updateTheme();

		logger.info('Tema cambiado', {
			newTheme: darkMode ? 'dark' : 'light'
		}, 'ThemeToggle');

		setTimeout(() => {
			isTogglingTheme = false;
		}, 100);
	}

	// Performance monitoring
	onMount(() => {
		if ('performance' in window) {
			setTimeout(() => {
				const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
				logger.info('Performance metrics', {
					loadTime: navigation.loadEventEnd - navigation.loadEventStart,
					domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
					firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
					firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
				}, 'Performance');
			}, 1000);
		}
	});
</script>

<svelte:head>
	<title>Train RAG Kit - Chat Inteligente con tus Documentos</title>
	<meta name="description" content="Sistema avanzado de chat inteligente para análisis de documentos PDF usando RAG, con conversaciones múltiples, búsqueda avanzada y exportación." />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="theme-color" content={darkMode ? '#1c1917' : '#fafaf9'} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Train RAG Kit - Chat Inteligente" />
	<meta property="og:description" content="Sistema avanzado para chatear con documentos PDF usando IA. Conversaciones múltiples, búsqueda inteligente y exportación." />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:title" content="Train RAG Kit - Chat Inteligente" />
	<meta property="twitter:description" content="Chatea inteligentemente con tus documentos PDF. Múltiples conversaciones, búsqueda avanzada y más." />

	<!-- Favicon -->
	<link rel="icon" href="/favicon.ico" />
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />

	<!-- Preload critical assets -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
</svelte:head>

<!-- Contenedor principal con tema dinámico -->
<div class="min-h-screen bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 transition-colors duration-300 relative overflow-hidden">
	<!-- Patrón de fondo sutil (mantenido de tu diseño original) -->
	<div class="absolute inset-0 opacity-30 dark:opacity-20 pointer-events-none">
		<div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, rgb(120 113 108 / 0.15) 1px, transparent 0); background-size: 20px 20px;"></div>
	</div>

	<!-- Toggle de tema (mantenido en tu posición original) -->
	<button
		onclick={toggleTheme}
		class="fixed top-4 right-4 z-50 p-3 rounded-full bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm shadow-lg border border-stone-200/60 dark:border-stone-700/60 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-500"
		aria-label="Cambiar tema"
		title="Cambiar tema"
	>
		{#if darkMode}
			<!-- Sol (modo claro) -->
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
			</svg>
		{:else}
			<!-- Luna (modo oscuro) -->
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
			</svg>
		{/if}
	</button>

	<!-- Contenido principal -->
	<div class="relative z-10 h-screen">
		{@render children()}
	</div>
</div>

<!-- Loading screen para primera carga (mantenido igual) -->
{#if browser}
	<div
		class="fixed inset-0 bg-stone-50 dark:bg-stone-900 z-50 flex items-center justify-center transition-opacity duration-500"
		class:opacity-0={!initialLoad}
		class:pointer-events-none={!initialLoad}
	>
		<div class="text-center space-y-4">
			<div class="w-12 h-12 border-4 border-stone-200 border-t-sky-600 rounded-full animate-spin mx-auto"></div>
			<p class="text-stone-600 dark:text-stone-400">Cargando Chat Inteligente...</p>
		</div>
	</div>
{/if}