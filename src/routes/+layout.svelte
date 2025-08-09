<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { logger } from '$lib/stores/logger';
	import { browser } from '$app/environment';

	let darkMode = $state(false);

	onMount(() => {
		// Log inicial cuando se monta la aplicación
		logger.info('Aplicación RAG inicializada', {
			timestamp: new Date().toISOString(),
			userAgent: navigator.userAgent,
			viewport: {
				width: window.innerWidth,
				height: window.innerHeight
			}
		}, 'App');

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

		// Prevenir zoom en mobile
		document.addEventListener('gesturestart', (e) => e.preventDefault());
		document.addEventListener('gesturechange', (e) => e.preventDefault());
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
		darkMode = !darkMode;
		updateTheme();

		logger.info('Tema cambiado', {
			newTheme: darkMode ? 'dark' : 'light'
		}, 'ThemeToggle');
	}

	// Performance monitoring
	onMount(() => {
		// Log performance metrics
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
	<title>RAG con SvelteKit - Chatea con tus Documentos</title>
	<meta name="description" content="Aplicación inteligente para chatear con documentos PDF usando SvelteKit, Tailwind CSS y tecnología RAG (Retrieval-Augmented Generation)." />
	<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
	<meta name="theme-color" content={darkMode ? '#0f172a' : '#ffffff'} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content="RAG con SvelteKit - Chatea con tus Documentos" />
	<meta property="og:description" content="Aplicación inteligente para chatear con documentos PDF usando tecnología RAG." />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary" />
	<meta property="twitter:title" content="RAG con SvelteKit" />
	<meta property="twitter:description" content="Chatea con tus documentos PDF de forma inteligente" />

	<!-- Favicon -->
	<link rel="icon" href="/favicon.ico" />
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />

	<!-- Preload critical assets -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
</svelte:head>

<!-- Contenedor principal con tema dinámico -->
<div class="min-h-screen text-slate-800 dark:text-slate-200 transition-colors duration-300 relative overflow-hidden">
	<!-- Toggle de tema -->
	<button
		onclick={toggleTheme}
		class="fixed top-4 right-4 z-50 p-3 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

	<!-- Gradiente de fondo animado -->
	<div class="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/30 dark:via-transparent dark:to-purple-950/30 pointer-events-none"></div>

	<!-- Efectos decorativos -->
	<div class="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
		<div class="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
		<div class="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
	</div>

	<!-- Contenido principal -->
	<div class="relative z-10">
		<slot />
	</div>
</div>

<!-- Loading screen para primera carga -->
{#if browser}
	<div class="fixed inset-0 bg-white dark:bg-slate-900 z-50 flex items-center justify-center transition-opacity duration-500 opacity-0 pointer-events-none" id="loading-screen">
		<div class="text-center space-y-4">
			<div class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
			<p class="text-slate-600 dark:text-slate-400">Cargando aplicación...</p>
		</div>
	</div>
{/if}