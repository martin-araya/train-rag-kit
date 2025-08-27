<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { chatState, chatActions } from '$lib/stores/chat';
	import ChatSidebar from '$lib/components/chat/ChatSidebar.svelte';
	import ChatWindow from '$lib/components/chat/ChatWindow.svelte';
	import ExportModal from '$lib/components/chat/ExportModal.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import { getOllamaModels, getCurrentModel } from '$lib/services/api';
	import type { OllamaModel } from '$lib/services/api';
	import { logger } from '$lib/stores/logger';

	// Estado local
	let sidebarCollapsed = false;
	let showExportModal = false;
	let selectedExportConversations: string[] = [];
	let availableModels: OllamaModel[] = [];
	let selectedModel = 'llama2';
	let showFileUpload = false;


	// Stores reactivos
	$: state = $chatState;
	$: hasActiveConversation = !!state.activeConversationId;

	// Funciones principales
	function toggleSidebar() {
		sidebarCollapsed = !sidebarCollapsed;
		logger.debug('Sidebar toggle', { collapsed: sidebarCollapsed }, 'UI');
	}

	function openExportModal(conversationIds: string[] = []) {
		selectedExportConversations = conversationIds;
		showExportModal = true;
		logger.info('Export modal opened', { conversationsSelected: conversationIds.length }, 'Export');
	}

	function handleKeyboardShortcuts(event: KeyboardEvent) {
		// Ctrl/Cmd + N: Nueva conversación
		if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
			event.preventDefault();
			chatActions.createConversation();
			logger.info('Nueva conversación creada via shortcut', null, 'Shortcuts');
		}

		// Ctrl/Cmd + E: Exportar
		if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
			event.preventDefault();
			openExportModal();
		}

		// Ctrl/Cmd + B: Toggle sidebar
		if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
			event.preventDefault();
			toggleSidebar();
		}

		// Ctrl/Cmd + U: Upload file
		if ((event.ctrlKey || event.metaKey) && event.key === 'u') {
			event.preventDefault();
			showFileUpload = true;
		}

		// Escape: Cerrar modales
		if (event.key === 'Escape') {
			showExportModal = false;
			showFileUpload = false;
		}
	}

	async function loadModels() {
		try {
			logger.info('Cargando modelos disponibles', null, 'Models');
			const models = await getOllamaModels();
			availableModels = models;

			// Obtener modelo actual
			const currentModel = await getCurrentModel();
			if (currentModel.model) {
				selectedModel = currentModel.model;
				logger.info('Modelo actual cargado', { model: selectedModel }, 'Models');
			}
		} catch (error) {
			logger.error('Error cargando modelos', {
				error: error instanceof Error ? error.message : error
			}, 'Models');
		}
	}

	function handleFileUploadComplete() {
		showFileUpload = false;
		logger.info('Archivo subido exitosamente', null, 'Upload');

		// Si no hay conversación activa, crear una nueva
		if (!hasActiveConversation) {
			chatActions.createConversation('Conversación sobre documento');
		}
	}

	onMount(() => {
		// Cargar modelos disponibles
		loadModels();

		// Configurar atajos de teclado
		document.addEventListener('keydown', handleKeyboardShortcuts);

		// Log de inicialización
		logger.info('Página principal del chat cargada', {
			conversationsCount: state.conversations.length,
			hasActiveConversation
		}, 'PageLoad');

		return () => {
			document.removeEventListener('keydown', handleKeyboardShortcuts);
		};
	});
</script>

<svelte:head>
	<title>Train RAG Kit - Chat Inteligente</title>
	<meta name="description" content="Interfaz principal del chat inteligente para análisis de documentos" />
</svelte:head>

<div class="h-full flex flex-col bg-stone-50 dark:bg-stone-900 overflow-hidden">
	<!-- Header moderno -->
	<header class="flex-shrink-0 bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm border-b border-stone-200/60 dark:border-stone-700/60 shadow-sm">
		<div class="flex items-center justify-between px-4 py-3">
			<!-- Left section -->
			<div class="flex items-center space-x-4">
				<button
					on:click={toggleSidebar}
					class="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
					title="Toggle sidebar (Ctrl+B)"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>

				<div class="flex items-center space-x-3">
					<div class="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
						<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
					</div>
					<div>
						<h1 class="text-lg font-bold text-stone-900 dark:text-stone-100">
							Train RAG Kit
						</h1>
						<p class="text-xs text-stone-500 dark:text-stone-400">
							Chat Inteligente
						</p>
					</div>
				</div>
			</div>

			<!-- Center section - Model selector -->
			<div class="flex items-center space-x-3">
				{#if availableModels.length > 0}
					<div class="flex items-center space-x-2 bg-stone-100 dark:bg-stone-700 rounded-lg px-3 py-2">
						<svg class="w-4 h-4 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
						</svg>
						<select
							bind:value={selectedModel}
							class="text-sm bg-transparent border-none focus:ring-0 text-stone-700 dark:text-stone-300 font-medium"
						>
							{#each availableModels as model (model.name)}
							<option value={model.name} class="bg-stone-100 dark:bg-stone-700">
									{model.name}
									{#if model.details?.parameter_size}
										({model.details.parameter_size})
									{/if}
								</option>
							{/each}
						</select>
					</div>
				{:else}
					<div class="text-sm text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-700 rounded-lg px-3 py-2">
						Cargando modelos...
					</div>
				{/if}
			</div>

			<!-- Right section -->
			<div class="flex items-center space-x-2">
				<button
					on:click={() => showFileUpload = true}
					class="flex items-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 text-sm shadow-sm hover:shadow-md hover:scale-105"
					title="Subir documentos (Ctrl+U)"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
					</svg>
					<span class="hidden sm:inline">PDF</span>
				</button>

				<button
					on:click={() => openExportModal()}
					class="flex items-center space-x-2 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-all duration-200 text-sm shadow-sm hover:shadow-md hover:scale-105"
					title="Exportar conversaciones (Ctrl+E)"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					<span class="hidden sm:inline">Exportar</span>
				</button>

				<!-- Connection status -->
				<div class="flex items-center space-x-2 text-sm bg-stone-100 dark:bg-stone-700 rounded-lg px-2 py-2">
					<div
						class="w-2 h-2 rounded-full"
						class:bg-emerald-500={state.isConnected}
						class:bg-red-500={!state.isConnected}
						class:animate-pulse={!state.isConnected}
					></div>
					<span class="text-stone-600 dark:text-stone-400 hidden lg:inline text-xs">
						{state.isConnected ? 'Conectado' : 'Sin conexión'}
					</span>
				</div>
			</div>
		</div>
	</header>

	<!-- Main content -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Sidebar -->
		<ChatSidebar bind:isCollapsed={sidebarCollapsed} />

		<!-- Main area -->
		<main class="flex-1 flex flex-col overflow-hidden bg-white/50 dark:bg-stone-800/50 backdrop-blur-sm">
			{#if hasActiveConversation}
				<!-- Chat interface -->
				<ChatWindow {selectedModel} />
			{:else}
				<!-- Welcome screen mejorado -->
				<div class="flex-1 flex items-center justify-center p-8">
					<div class="max-w-4xl text-center space-y-8">
						<!-- Hero section -->
						<div class="space-y-6">
							<div class="w-24 h-24 bg-gradient-to-br from-sky-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
								<svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
								</svg>
							</div>

							<div class="space-y-4">
								<h1 class="text-5xl font-bold bg-gradient-to-r from-stone-900 via-stone-700 to-stone-900 dark:from-stone-100 dark:via-stone-300 dark:to-stone-100 bg-clip-text text-transparent">
									Chat Inteligente
								</h1>
								<p class="text-xl text-stone-600 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
									Analiza documentos PDF con IA avanzada. Conversaciones múltiples, búsqueda inteligente y exportación profesional.
								</p>
							</div>
						</div>

						<!-- Statistics -->
						<div class="grid grid-cols-3 gap-6 max-w-lg mx-auto">
							<div class="text-center">
								<div class="text-2xl font-bold text-sky-600 dark:text-sky-400">
									{state.conversations.length}
								</div>
								<div class="text-sm text-stone-500 dark:text-stone-400">
									Conversaciones
								</div>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
									{state.conversations.filter(c => c.isFavorite).length}
								</div>
								<div class="text-sm text-stone-500 dark:text-stone-400">
									Favoritas
								</div>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
									{availableModels.length}
								</div>
								<div class="text-sm text-stone-500 dark:text-stone-400">
									Modelos IA
								</div>
							</div>
						</div>

						<!-- Quick actions -->
						<div class="space-y-6">
							<div class="flex flex-col sm:flex-row gap-4 justify-center">
								<button
									on:click={() => chatActions.createConversation()}
									class="flex items-center justify-center space-x-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:scale-105"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
									</svg>
									<span>Nueva Conversación</span>
								</button>

								<button
									on:click={() => showFileUpload = true}
									class="flex items-center justify-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:scale-105"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
									</svg>
									<span>Subir Documento</span>
								</button>
							</div>

							<!-- Keyboard shortcuts -->
							<div class="text-center text-sm text-stone-500 dark:text-stone-400 space-y-2">
								<p class="font-medium">Atajos de teclado:</p>
								<div class="flex flex-wrap justify-center gap-4 text-xs">
									<span><kbd class="px-2 py-1 bg-stone-200 dark:bg-stone-700 rounded text-stone-700 dark:text-stone-300 font-mono">Ctrl+N</kbd> Nueva conversación</span>
									<span><kbd class="px-2 py-1 bg-stone-200 dark:bg-stone-700 rounded text-stone-700 dark:text-stone-300 font-mono">Ctrl+U</kbd> Subir archivo</span>
									<span><kbd class="px-2 py-1 bg-stone-200 dark:bg-stone-700 rounded text-stone-700 dark:text-stone-300 font-mono">Ctrl+E</kbd> Exportar</span>
									<span><kbd class="px-2 py-1 bg-stone-200 dark:bg-stone-700 rounded text-stone-700 dark:text-stone-300 font-mono">Ctrl+B</kbd> Sidebar</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</main>
	</div>

	<!-- Modals -->
	{#if showExportModal}
		<ExportModal
			bind:isOpen={showExportModal}
			bind:selectedConversations={selectedExportConversations}
			on:close={() => showExportModal = false}
		/>
	{/if}

	{#if showFileUpload}
		<!-- File Upload Modal -->
		<div
			class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
			on:click={(e) => e.target === e.currentTarget && (showFileUpload = false)}
		>
			<div class="bg-white dark:bg-stone-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-stone-200 dark:border-stone-700">
				<div class="flex items-center justify-between p-6 border-b border-stone-200 dark:border-stone-700">
					<h2 class="text-xl font-semibold text-stone-900 dark:text-stone-100">
						Subir Documento PDF
					</h2>
					<button
						on:click={() => showFileUpload = false}
						class="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors text-stone-500 dark:text-stone-400"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="p-6">
					<FileUpload on:upload-complete={handleFileUploadComplete} />
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
    /* Estilos personalizados que complementan tu tema */
    kbd {
        font-family: ui-monospace, SFMono-Regular, "Cascadia Code", "Roboto Mono", Menlo, Consolas, monospace;
        font-size: 0.75rem;
        font-weight: 600;
    }

    /* Glassmorphism effects */
    .backdrop-blur-sm {
        backdrop-filter: blur(4px);
    }

    /* Smooth animations */
    .transition-all {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Custom gradients matching your theme */
    .bg-gradient-to-br {
        background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
    }

    /* Enhanced shadows */
    .shadow-2xl {
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    /* Hover effects */
    button:hover {
        transform: translateY(-2px);
    }

    button:active {
        transform: translateY(0);
    }

    /* Selection styles */
    ::selection {
        background-color: rgb(14 165 233 / 0.3);
        color: rgb(15 23 42);
    }

    :global(.dark) ::selection {
        background-color: rgb(14 165 233 / 0.2);
        color: rgb(248 250 252);
    }
</style>