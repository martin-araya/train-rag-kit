<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { chatState, chatActions, activeConversation } from '$lib/stores/chat';
	import { startHealthMonitoring } from '$lib/services/api';
	import { logger } from '$lib/stores/logger';

	// Componentes de UI
	import ChatSidebar from '$lib/components/chat/ChatSidebar.svelte';
	import ChatWindow from '$lib/components/chat/ChatWindow.svelte';
	import ConversationTabs from '$lib/components/chat/ConversationTabs.svelte';
	import SearchPanel from '$lib/components/chat/SearchPanel.svelte';
	import TagManager from '$lib/components/chat/TagManager.svelte';
	import EnhancedExportModal from '$lib/components/chat/EnhancedExportModal.svelte';
	import ConversationSummary from '$lib/components/chat/ConversationSummary.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	// Estado de UI
	let isSidebarCollapsed = false;
	let isSearchPanelOpen = false;
	let isTagManagerOpen = false;
	let isExportModalOpen = false;
	let isSummaryModalOpen = false;
	let selectedModel = 'llama2';
	let stopHealthCheck: () => void;

	// Estado derivado
	$: state = $chatState;
	$: conversation = $activeConversation;
	$: isConnected = state.isConnected;

	// Funciones de UI
	function toggleSidebar() {
		isSidebarCollapsed = !isSidebarCollapsed;
	}

	function openSearch() {
		isSearchPanelOpen = true;
	}

	function openTagManager() {
		isTagManagerOpen = true;
	}

	function openExportModal() {
		isExportModalOpen = true;
	}

	function openSummaryModal() {
		isSummaryModalOpen = true;
	}

	// Inicialización y limpieza
	onMount(() => {
		logger.info('Inicializando layout principal', null, 'Layout');

		// Cargar datos guardados
		chatActions.loadFromStorage();

		// Iniciar monitoreo de salud
		stopHealthCheck = startHealthMonitoring(30000);

		// Escuchar eventos de teclado
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			if (stopHealthCheck) stopHealthCheck();
			window.removeEventListener('keydown', handleKeyDown);
			logger.info('Layout principal desmontado', null, 'Layout');
		};
	});

	// Atajos de teclado
	function handleKeyDown(event: KeyboardEvent) {
		// Solo procesar si no hay elementos activos como inputs o textareas
		if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
			return;
		}

		// Ctrl/Cmd + K para abrir búsqueda
		if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
			event.preventDefault();
			openSearch();
		}

		// Ctrl/Cmd + B para alternar sidebar
		if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
			event.preventDefault();
			toggleSidebar();
		}

		// Ctrl/Cmd + E para exportar
		if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
			event.preventDefault();
			openExportModal();
		}
	}
</script>

<div class="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
	<!-- Sidebar -->
	<ChatSidebar isCollapsed={isSidebarCollapsed} />

	<!-- Main Content -->
	<div class="flex-1 flex flex-col h-full overflow-hidden">
		<!-- Header with tabs -->
		<header class="flex flex-col bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
			<!-- Top Toolbar -->
			<div class="flex items-center justify-between px-4 h-12 border-b border-gray-200 dark:border-gray-700">
				<div class="flex items-center">
					<button
						on:click={toggleSidebar}
					aria-label={isSidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
					class="mr-4 p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
						title={isSidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
					>
						<svg class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</button>

					<div class="flex items-center">
						<h1 class="text-lg font-semibold text-gray-900 dark:text-white">Chat Inteligente</h1>
						{#if !isConnected}
              <span class="ml-2 px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full" role="status">
                Desconectado
              </span>
						{/if}
					</div>
				</div>

				<div class="flex items-center space-x-2">
					<button
						on:click={openSearch} aria-label="Buscar"
						class="p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-gray-600 dark:text-gray-300 flex items-center"
						title="Buscar (Ctrl+K)"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
						<span class="ml-1 text-sm hidden sm:inline-block">Buscar</span>
					</button>

					<div class="hidden sm:block h-6 border-r border-gray-300 dark:border-gray-600"></div>

					<div class="flex items-center space-x-2">
						<button
							on:click={openTagManager} aria-label="Administrar etiquetas"
							class="p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-gray-600 dark:text-gray-300"
							title="Administrar etiquetas"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
							</svg>
						</button>

						<button
							on:click={openSummaryModal} aria-label="Ver resumen de la conversación"
							class="p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-gray-600 dark:text-gray-300"
							title="Resumen de conversación"
							disabled={!conversation}
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
							</svg>
						</button>

						<button
							on:click={openExportModal}
							aria-label="Exportar conversaciones"
							class="p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-gray-600 dark:text-gray-300"
							title="Exportar conversaciones (Ctrl+E)"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
							</svg>
						</button>
					</div>
				</div>
			</div>

			<!-- Tabs for navigation -->
			<ConversationTabs />
		</header>

		<!-- Main Chat Window -->
		<main class="flex-1 overflow-hidden bg-stone-50 dark:bg-stone-900">
			{#if conversation}
				<ChatWindow selectedModel={selectedModel} />
			{:else}
				<div class="h-full flex items-center justify-center">
					<div class="text-center max-w-md p-6">
						<div class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
							</svg>
						</div>
						<h2 class="text-xl font-medium text-gray-900 dark:text-white mb-2">
							No hay conversación activa
						</h2>
						<p class="text-gray-600 dark:text-gray-400 mb-6">
							Selecciona una conversación existente del panel lateral o crea una nueva para comenzar a chatear.
						</p>
						<button
							on:click={() => chatActions.createConversation()}
							class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
						>
							Iniciar nueva conversación
						</button>
					</div>
				</div>
			{/if}
			<!-- Slot para renderizar el contenido de la página -->
			<slot />
		</main>
	</div>
</div>

<!-- Modales -->
<SearchPanel
	isOpen={isSearchPanelOpen}
	on:close={() => isSearchPanelOpen = false}
/>

<TagManager
	isOpen={isTagManagerOpen}
	conversationId={conversation?.id || null}
	on:close={() => isTagManagerOpen = false}
/>

<EnhancedExportModal
	isOpen={isExportModalOpen}
	on:close={() => isExportModalOpen = false}
/>

<ConversationSummary
	isOpen={isSummaryModalOpen}
	conversationId={conversation?.id || null}
	on:close={() => isSummaryModalOpen = false}
/>

<!-- Notificación de desconexión -->
{#if !isConnected}
	<div
		class="fixed bottom-4 right-4 max-w-xs bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 border-red-500 p-4 flex items-start"
		transition:fade={{ duration: 200 }}
	>
		<div class="flex-shrink-0 text-red-500 mr-3">
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
		</div>
		<div>
			<p class="font-medium text-gray-900 dark:text-white">
				Conexión perdida
			</p>
			<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
				No se puede conectar con el servidor. Intentando reconectar...
			</p>
			<div class="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
				<Spinner size="sm" class="mr-2" />
				<span>Reconectando...</span>
			</div>
		</div>
	</div>
{/if}