<!-- src/lib/components/layout/MainLayout.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { chatState, chatActions } from '$lib/stores/chat';
	import ChatSidebar from '../chat/ChatSidebar.svelte';
	import ChatWindow from '../chat/ChatWindow.svelte';
	import ExportModal from '../chat/ExportModal.svelte';
	import FileUpload from '../FileUpload.svelte';
	import { getOllamaModels, getCurrentModel } from '$lib/services/api';
	import type { OllamaModel } from '$lib/services/api';

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

	// Funciones
	function toggleSidebar() {
		sidebarCollapsed = !sidebarCollapsed;
	}

	function openExportModal(conversationIds: string[] = []) {
		selectedExportConversations = conversationIds;
		showExportModal = true;
	}

	function handleKeyboardShortcuts(event: KeyboardEvent) {
		// Ctrl/Cmd + N: Nueva conversación
		if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
			event.preventDefault();
			chatActions.createConversation();
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

		// Escape: Cerrar modales
		if (event.key === 'Escape') {
			showExportModal = false;
			showFileUpload = false;
		}
	}

	async function loadModels() {
		try {
			const models = await getOllamaModels();
			availableModels = models;

			// Obtener modelo actual
			const currentModel = await getCurrentModel();
			if (currentModel.model) {
				selectedModel = currentModel.model;
			}
		} catch (error) {
			console.error('Error cargando modelos:', error);
		}
	}

	onMount(() => {
		// Cargar modelos disponibles
		loadModels();

		// Configurar atajos de teclado
		document.addEventListener('keydown', handleKeyboardShortcuts);

		return () => {
			document.removeEventListener('keydown', handleKeyboardShortcuts);
		};
	});
</script>

<svelte:head>
	<title>Train RAG Kit - Chat Inteligente</title>
	<meta name="description" content="Sistema de chat inteligente con RAG para análisis de documentos" />
</svelte:head>

<div class="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
	<!-- Header -->
	<header class="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
		<div class="flex items-center justify-between px-4 py-3">
			<!-- Left section -->
			<div class="flex items-center space-x-4">
				<button
					on:click={toggleSidebar}
					class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					title="Toggle sidebar (Ctrl+B)"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>

				<div class="flex items-center space-x-2">
					<h1 class="text-xl font-bold text-gray-900 dark:text-white">
						Train RAG Kit
					</h1>
					<span class="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
						Chat Inteligente
					</span>
				</div>
			</div>

			<!-- Center section - Model selector -->
			<div class="flex items-center space-x-3">
				{#if availableModels.length > 0}
					<div class="flex items-center space-x-2">
						<label class="text-sm font-medium text-gray-700 dark:text-gray-300">
							Modelo:
						</label>
						<select
							bind:value={selectedModel}
							class="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							{#each availableModels as model (model.name)}
								<option value={model.name}>
									{model.name}
									{#if model.details?.parameter_size}
										({model.details.parameter_size})
									{/if}
								</option>
							{/each}
						</select>
					</div>
				{:else}
					<div class="text-sm text-gray-500 dark:text-gray-400">
						Cargando modelos...
					</div>
				{/if}
			</div>

			<!-- Right section -->
			<div class="flex items-center space-x-2">
				<button
					on:click={() => showFileUpload = true}
					class="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
					title="Subir documentos"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
					</svg>
					<span class="hidden sm:inline">Subir PDF</span>
				</button>

				<button
					on:click={() => openExportModal()}
					class="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
					title="Exportar conversaciones (Ctrl+E)"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					<span class="hidden sm:inline">Exportar</span>
				</button>

				<div class="flex items-center space-x-1 text-sm">
					<!-- Connection status -->
					<div class="flex items-center space-x-1">
						<div
							class="w-2 h-2 rounded-full"
							class:bg-green-500={state.isConnected}
							class:bg-red-500={!state.isConnected}
						></div>
						<span class="text-gray-600 dark:text-gray-400 hidden lg:inline">
							{state.isConnected ? 'Conectado' : 'Desconectado'}
						</span>
					</div>
				</div>
			</div>
		</div>
	</header>

	<!-- Main content -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Sidebar -->
		<ChatSidebar bind:isCollapsed={sidebarCollapsed} />

		<!-- Main area -->
		<main class="flex-1 flex flex-col overflow-hidden">
			{#if hasActiveConversation}
				<!-- Chat interface -->
				<ChatWindow {selectedModel} />
			{:else}
				<!-- Welcome screen -->
				<div class="flex-1 flex items-center justify-center p-8">
					<div class="max-w-2xl text-center space-y-8">
						<!-- Hero section -->
						<div class="space-y-4">
							<div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
								<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
								</svg>
							</div>

							<h1 class="text-4xl font-bold text-gray-900 dark:text-white">
								¡Bienvenido al Chat Inteligente!
							</h1>

							<p class="text-xl text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
								Analiza documentos PDF y obtén respuestas precisas usando inteligencia artificial
							</p>
						</div>

						<!-- Features -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
							<div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
								<div class="flex items-center space-x-3 mb-3">
									<div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
										<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
										</svg>
									</div>
									<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
										Conversaciones Múltiples
									</h3>
								</div>
								<p class="text-gray-600 dark:text-gray-400">
									Organiza tus consultas en conversaciones separadas con historial completo y búsqueda avanzada.
								</p>
							</div>

							<div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
								<div class="flex items-center space-x-3 mb-3">
									<div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
										<svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										</svg>
									</div>
									<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
										Análisis de Documentos
									</h3>
								</div>
								<p class="text-gray-600 dark:text-gray-400">
									Sube archivos PDF y obtén respuestas precisas basadas en el contenido de tus documentos.
								</p>
							</div>

							<div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
								<div class="flex items-center space-x-3 mb-3">
									<div class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
										<svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
										</svg>
									</div>
									<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
										Favoritos y Etiquetas
									</h3>
								</div>
								<p class="text-gray-600 dark:text-gray-400">
									Marca conversaciones importantes y organízalas con etiquetas personalizadas para acceso rápido.
								</p>
							</div>

							<div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
								<div class="flex items-center space-x-3 mb-3">
									<div class="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
										<svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										</svg>
									</div>
									<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
										Exportación Avanzada
									</h3>
								</div>
								<p class="text-gray-600 dark:text-gray-400">
									Exporta conversaciones en múltiples formatos: Markdown, JSON, PDF y texto plano.
								</p>
							</div>
						</div>

						<!-- Quick actions -->
						<div class="space-y-4">
							<h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
								¿Cómo empezar?
							</h2>

							<div class="flex flex-col sm:flex-row gap-4 justify-center">
								<button
									on:click={() => chatActions.createConversation()}
									class="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
									</svg>
									<span>Nueva Conversación</span>
								</button>

								<button
									on:click={() => showFileUpload = true}
									class="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
									</svg>
									<span>Subir Documento</span>
								</button>
							</div>
						</div>

						<!-- Keyboard shortcuts hint -->
						<div class="text-center text-sm text-gray-500 dark:text-gray-400 space-y-1">
							<p><strong>Atajos de teclado:</strong></p>
							<div class="flex flex-wrap justify-center gap-4 text-xs">
								<span><kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+N</kbd> Nueva conversación</span>
								<span><kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+E</kbd> Exportar</span>
								<span><kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+B</kbd> Toggle sidebar</span>
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
			class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
			on:click={(e) => e.target === e.currentTarget && (showFileUpload = false)}
		>
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
				<div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
					<h2 class="text-xl font-semibold text-gray-900 dark:text-white">
						Subir Documento PDF
					</h2>
					<button
						on:click={() => showFileUpload = false}
						class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="p-6">
					<FileUpload on:upload-complete={() => showFileUpload = false} />
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
    /* Estilos globales para el layout */
    :global(html, body) {
        height: 100%;
        overflow: hidden;
    }

    /* Estilos para kbd elements */
    kbd {
        font-family: ui-monospace, SFMono-Regular, "Cascadia Code", "Roboto Mono", Menlo, Consolas, monospace;
        font-size: 0.75rem;
        font-weight: 600;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        padding: 0.125rem 0.375rem;
        background-color: #f3f4f6;
        color: #374151;
    }

    :global(.dark) kbd {
        background-color: #374151;
        color: #f9fafb;
        border-color: #4b5563;
    }

    /* Animaciones suaves */
    .transition-colors {
        transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
    }

    /* Gradientes personalizados */
    .bg-gradient-to-br {
        background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
    }

    /* Sombras personalizadas */
    .shadow-lg {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    /* Efectos hover mejorados */
    button:hover {
        transform: translateY(-1px);
        transition: all 0.2s ease;
    }

    button:active {
        transform: translateY(0);
    }

    /* Estilos para el área de scroll */
    .overflow-hidden {
        overflow: hidden;
    }

    .overflow-y-auto::-webkit-scrollbar {
        width: 6px;
    }

    .overflow-y-auto::-webkit-scrollbar-track {
        background: transparent;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
    }

    :global(.dark) .overflow-y-auto::-webkit-scrollbar-thumb {
        background: #475569;
    }
</style>