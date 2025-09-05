<!-- src/lib/components/chat/ConversationTabs.svelte -->
<script lang="ts">
	import { chatState, chatActions } from '$lib/stores/chat';
	import { fade } from 'svelte/transition';
	import { truncateText } from '$lib/utils/helpers';

	// Cantidad máxima de pestañas para mostrar
	const MAX_VISIBLE_TABS = 5;

	// Estado local
	let isDragging = false;
	let draggedTab: string | null = null;
	let showOverflowMenu = false;

	// Stores reactivos
	$: state = $chatState;
	$: conversations = state.conversations.filter(conv => conv.status === 'active');
	$: activeConversationId = state.activeConversationId;
	$: visibleTabs = conversations.slice(0, MAX_VISIBLE_TABS);
	$: overflowTabs = conversations.length > MAX_VISIBLE_TABS ? conversations.slice(MAX_VISIBLE_TABS) : [];

	// Funciones de manejo de pestañas
	function setActiveTab(conversationId: string) {
		chatActions.setActiveConversation(conversationId);
		showOverflowMenu = false;
	}

	function createNewConversation() {
		chatActions.createConversation();
	}

	function closeTab(event: MouseEvent, conversationId: string) {
		event.stopPropagation();

		// Si solo hay una pestaña, crear una nueva antes de cerrar
		if (conversations.length === 1) {
			const newId = chatActions.createConversation();
			chatActions.archiveConversation(conversationId);
			chatActions.setActiveConversation(newId);
		} else {
			// Si se está cerrando la pestaña activa, activar otra
			if (conversationId === activeConversationId) {
				const index = conversations.findIndex(c => c.id === conversationId);
				const nextTab = conversations[index === 0 ? 1 : index - 1];
				chatActions.setActiveConversation(nextTab.id);
			}

			chatActions.archiveConversation(conversationId);
		}
	}

	// Funciones para el menú de overflow
	function openOverflowMenu(event: MouseEvent) {
		event.preventDefault();
		showOverflowMenu = true;
	}

	// Cerrar el menú al hacer clic fuera de él
	function handleClickOutside() {
		if (showOverflowMenu) {
			showOverflowMenu = false;
		}
	}

	// Funciones de drag and drop
	function handleDragStart(event: DragEvent, conversationId: string) {
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', conversationId);
			draggedTab = conversationId;
			isDragging = true;
		}
	}

	function handleDragOver(event: DragEvent, conversationId: string) {
		event.preventDefault();
		if (draggedTab && draggedTab !== conversationId) {
			event.dataTransfer!.dropEffect = 'move';
		}
	}

	function handleDrop(event: DragEvent, targetId: string) {
		event.preventDefault();
		if (!draggedTab || draggedTab === targetId) return;

		const sourceIndex = conversations.findIndex(c => c.id === draggedTab);
		const targetIndex = conversations.findIndex(c => c.id === targetId);

		if (sourceIndex !== -1 && targetIndex !== -1) {
			// Reordenar conversaciones
			chatState.update(state => {
				const updatedConversations = [...state.conversations];
				const [movedConversation] = updatedConversations.splice(sourceIndex, 1);
				updatedConversations.splice(targetIndex, 0, movedConversation);

				return {
					...state,
					conversations: updatedConversations
				};
			});
		}

		isDragging = false;
		draggedTab = null;
	}

	function handleDragEnd() {
		isDragging = false;
		draggedTab = null;
	}
</script>

<div class="w-full border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center">
	<div class="flex-1 flex overflow-x-auto max-w-[calc(100%-80px)]"
			 class:dragging={isDragging}>
		{#each visibleTabs as conversation (conversation.id)}
			<div
				role="button"
				tabindex="0"
				class="flex-shrink-0 flex items-center border-r border-gray-200 dark:border-gray-700 h-10 px-3 cursor-pointer group relative"
				class:bg-gray-100={conversation.id === activeConversationId}
				class:dark:bg-gray-700={conversation.id === activeConversationId}
				class:border-b-2={conversation.id === activeConversationId}
				class:border-blue-500={conversation.id === activeConversationId}
				aria-label="Seleccionar conversación {conversation.name}"
				on:click={() => setActiveTab(conversation.id)}
				draggable={true}
				on:dragstart={(e) => handleDragStart(e, conversation.id)}
				on:dragover={(e) => handleDragOver(e, conversation.id)}
				on:drop={(e) => handleDrop(e, conversation.id)}
				on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab(conversation.id)}
				on:dragend={handleDragEnd}
			>
				{#if conversation.isFavorite}
					<span class="text-amber-500 mr-1">⭐</span>
				{/if}

				<span class="text-sm text-gray-800 dark:text-gray-200 max-w-[120px] truncate">
          {truncateText(conversation.name, 20)}
        </span>

				<button
					class="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
					aria-label="Cerrar pestaña {conversation.name}"
					on:click={(e) => closeTab(e, conversation.id)}
				>
					<svg class="w-3 h-3" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		{/each}

		{#if overflowTabs.length > 0}
			<div class="flex-shrink-0 flex items-center border-r border-gray-200 dark:border-gray-700 h-10 px-3 cursor-pointer relative">
				<button
					on:click={openOverflowMenu}
					class="flex items-center text-gray-600 dark:text-gray-300 text-sm hover:text-gray-800 dark:hover:text-white transition-colors"
					aria-label="Mostrar más pestañas"
				>
					+{overflowTabs.length} más
					<svg class="w-4 h-4 ml-1" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				{#if showOverflowMenu}
					<div
						class="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-10 w-48"
						transition:fade={{ duration: 150 }}
					>
						{#each overflowTabs as tab (tab.id)}
							<div
								role="menuitem"
								class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 flex items-center justify-between group"
								on:click={() => setActiveTab(tab.id)}
								on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab(tab.id)}
								tabindex="0"
							>
								<span class="flex-1 text-left truncate">
									{#if tab.isFavorite}
										<span class="text-amber-500 mr-1">⭐</span>
									{/if}
									{tab.name}
								</span>
								<button
									class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100"
									on:click={(e) => closeTab(e, tab.id)}
									aria-label="Cerrar pestaña {tab.name}"
								>
									<svg class="w-3 h-3" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<div class="flex-shrink-0 flex items-center px-2">
		<button
			on:click={createNewConversation}
			class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
			aria-label="Crear nueva conversación"
			title="Nueva conversación"
		>
			<svg class="w-5 h-5" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
		</button>
	</div>
</div>

<svelte:window on:click={handleClickOutside} />

<style>
    /* Scrollbar personalizado */
    .overflow-x-auto::-webkit-scrollbar {
        height: 3px;
    }

    .overflow-x-auto::-webkit-scrollbar-track {
        background: transparent;
    }

    .overflow-x-auto::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
    }

    /* Estilos para drag & drop */
    [draggable=true] {
        cursor: grab;
    }

    .dragging {
        cursor: grabbing;
    }

</style>