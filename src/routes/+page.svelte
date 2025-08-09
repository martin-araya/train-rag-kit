<script lang="ts">
	import QuerySection from '$lib/components/QuerySection.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import Sidebar from '$lib/components/ui/Sidebar.svelte';
	import { appStore, clearError } from '$lib/stores/app';

	const { error } = $derived($appStore);
</script>

<div class="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
	<Sidebar />

	<main class="flex-1 flex flex-col overflow-hidden">
		<!-- Header mejorado -->
		<header class="relative text-center p-6 border-b border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
			<div class="max-w-4xl mx-auto">
				<h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent leading-tight">
					Chatea con tus Documentos
				</h1>
				<p class="mt-4 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
					Construido con SvelteKit, Tailwind CSS y un backend RAG inteligente.
				</p>
			</div>

			<!-- Efectos decorativos -->
			<div class="absolute top-0 left-1/4 w-24 h-24 bg-blue-400/10 rounded-full blur-xl"></div>
			<div class="absolute bottom-0 right-1/4 w-32 h-32 bg-purple-400/10 rounded-full blur-xl"></div>
		</header>

		<!-- Contenido principal -->
		<div class="flex-grow max-w-6xl w-full mx-auto p-4 flex flex-col relative">
			<!-- Alert de error mejorado -->
			{#if error}
				<div class="mb-4">
					<ErrorAlert
						{error}
						onClose={clearError}
						variant="error"
						dismissible={true}
						autoClose={8000}
					/>
				</div>
			{/if}

			<!-- Componente principal de chat -->
			<div class="flex-grow flex flex-col bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
				<QuerySection />
			</div>

			<!-- Efectos decorativos de fondo -->
			<div class="absolute -top-24 -left-24 w-48 h-48 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl pointer-events-none"></div>
			<div class="absolute -bottom-24 -right-24 w-48 h-48 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
		</div>

		<!-- Footer opcional -->
		<footer class="text-center p-4 text-sm text-slate-500 dark:text-slate-400 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm border-t border-slate-200/50 dark:border-slate-700/50">
			<p>Powered by SvelteKit & Tailwind CSS</p>
		</footer>
	</main>
</div>