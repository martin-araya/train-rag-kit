<script lang="ts">
	import { onMount } from 'svelte';
	import { chatState, chatActions, filteredConversations, favoriteConversations } from '$lib/stores/chat';
	// CORRECCIÓN: Se eliminó 'EnhancedConversation' que no se usaba.
	import type { SearchQuery } from '$lib/types/chat';
	import { formatDistanceToNow } from 'date-fns';
	import { es } from 'date-fns/locale';

	// Props
	export let isCollapsed = false;

	// Estado local
	let searchTerm = '';
	let searchTimeout: ReturnType<typeof setTimeout>;
	// CORRECCIÓN: Se eliminó 'showFilters' que no se usaba.
	let selectedFilter: 'all' | 'favorites' | 'archived' = 'all';

	// Stores reactivos
	$: state = $chatState;
	$: conversations = $filteredConversations;
	$: favorites = $favoriteConversations;

	// Funciones
	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(async () => {
			if (searchTerm.trim()) {
				const query: SearchQuery = {
					term: searchTerm.trim(),
					scope: 'all'
				};
				await chatActions.searchConversations(query);
			} else {
				chatActions.clearSearch();
			}
		}, 300);
	}

	function selectConversation(conversationId: string) {
		chatActions.setActiveConversation(conversationId);
	}

	function createNewConversation() {
		const name = `Nueva conversación`;
		chatActions.createConversation(name);
	}

	function toggleFavorite(conversationId: string, event: Event) {
		event.stopPropagation();
		chatActions.toggleFavorite(conversationId);
	}

	function archiveConversation(conversationId: string, event: Event) {
		event.stopPropagation();
		if (confirm('¿Estás seguro de que quieres archivar esta conversación?')) {
			chatActions.archiveConversation(conversationId);
		}
	}

	function deleteConversation(conversationId: string, event: Event) {
		event.stopPropagation();
		if (confirm('¿Estás seguro de que quieres eliminar esta conversación? Esta acción no se puede deshacer.')) {
			chatActions.deleteConversation(conversationId);
		}
	}

	function getConversationsToShow() {
		switch (selectedFilter) {
			case 'favorites':
				return favorites;
			case 'archived':
				return state.conversations.filter(conv => conv.status === 'archived');
			default:
				return conversations;
		}
	}

	function formatLastActivity(date: Date): string {
		return formatDistanceToNow(date, {
			addSuffix: true,
			locale: es
		});
	}

	function truncateMessage(content: string, maxLength: number = 60): string {
		return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
	}

	onMount(() => {
		return () => {
			if (searchTimeout) clearTimeout(searchTimeout);
		};
	});
</script>

<aside
	class="flex flex-col h-full bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm border-r border-stone-200/60 dark:border-stone-700/60 transition-all duration-300 shadow-sm"
	class:w-80={!isCollapsed}
	class:w-16={isCollapsed}
>
	<div class="flex items-center justify-between p-4 border-b border-stone-200/60 dark:border-stone-700/60 bg-stone-50/50 dark:bg-stone-900/50">
		{#if !isCollapsed}
			<h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">
				Conversaciones
			</h2>
		{/if}

		<button
			on:click={createNewConversation}
			class="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
			title="Nueva conversación"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
		</button>
	</div>

	{#if !isCollapsed}
		<div class="p-4 space-y-3 bg-stone-50/30 dark:bg-stone-900/30">
			<div class="relative">
				<input
					type="text"
					placeholder="Buscar conversaciones..."
					bind:value={searchTerm}
					on:input={handleSearch}
					class="w-full pl-10 pr-4 py-2 text-sm border border-stone-300/60 dark:border-stone-600/60 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white/70 dark:bg-stone-700/70 text-stone-900 dark:text-stone-100 placeholder-stone-500 dark:placeholder-stone-400 backdrop-blur-sm transition-all duration-200"
				/>
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<svg class="h-5 w-5 text-stone-400 dark:text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				</div>

				{#if state.isSearching}
					<div class="absolute inset-y-0 right-0 pr-3 flex items-center">
						<div class="animate-spin h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full"></div>
					</div>
				{/if}
			</div>

			<div class="flex space-x-1">
				<button
					on:click={() => selectedFilter = 'all'}
					class="px-3 py-1 text-xs rounded-full transition-all duration-200 font-medium"
					class:bg-sky-100={selectedFilter === 'all'}
					class:text-sky-700={selectedFilter === 'all'}
					class:dark:bg-sky-900={selectedFilter === 'all'}
					class:dark:text-sky-300={selectedFilter === 'all'}
					class:text-stone-600={selectedFilter !== 'all'}
					class:hover:bg-stone-100={selectedFilter !== 'all'}
					class:dark:hover:bg-stone-700={selectedFilter !== 'all'}
				>
					Todas ({conversations.length})
				</button>

				<button
					on:click={() => selectedFilter = 'favorites'}
					class="px-3 py-1 text-xs rounded-full transition-all duration-200 font-medium"
					class:bg-amber-100={selectedFilter === 'favorites'}
					class:text-amber-700={selectedFilter === 'favorites'}
					class:dark:bg-amber-900={selectedFilter === 'favorites'}
					class:dark:text-amber-300={selectedFilter === 'favorites'}
					class:text-stone-600={selectedFilter !== 'favorites'}
					class:hover:bg-stone-100={selectedFilter !== 'favorites'}
					class:dark:hover:bg-stone-700={selectedFilter !== 'favorites'}
				>
					⭐ Favoritas ({favorites.length})
				</button>

				<button
					on:click={() => selectedFilter = 'archived'}
					class="px-3 py-1 text-xs rounded-full transition-all duration-200 font-medium"
					class:bg-stone-200={selectedFilter === 'archived'}
					class:text-stone-700={selectedFilter === 'archived'}
					class:dark:bg-stone-700={selectedFilter === 'archived'}
					class:dark:text-stone-300={selectedFilter === 'archived'}
					class:text-stone-600={selectedFilter !== 'archived'}
					class:hover:bg-stone-100={selectedFilter !== 'archived'}
					class:dark:hover:bg-stone-700={selectedFilter !== 'archived'}
				>
					📁 Archivadas
				</button>
			</div>
		</div>

		<div class="flex-1 overflow-y-auto">
			{#if state.searchResults && state.searchQuery}
				<div class="p-4">
					<div class="text-sm text-stone-500 dark:text-stone-400 mb-3 flex items-center justify-between">
						<span>{state.searchResults.totalCount} resultados para "{state.searchQuery}"</span>
						<button
							on:click={chatActions.clearSearch}
							class="text-sky-600 hover:text-sky-800 dark:text-sky-400 text-xs underline"
						>
							Limpiar
						</button>
					</div>

					{#each state.searchResults.results as result (result.conversationId)}
						<div
							class="mb-3 p-3 bg-white/70 dark:bg-stone-700/70 backdrop-blur-sm rounded-lg border border-stone-200/60 dark:border-stone-600/60 cursor-pointer hover:bg-white/90 dark:hover:bg-stone-700/90 transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
							on:click={() => selectConversation(result.conversationId)}
						>
							<div class="flex items-start justify-between">
								<div class="flex-1 min-w-0">
									<h4 class="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
										{result.title}
									</h4>
									<p class="text-xs text-stone-600 dark:text-stone-400 mt-1">
										{result.snippet}
									</p>
									<div class="flex items-center mt-2 text-xs text-stone-500">
           <span class="bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 px-2 py-1 rounded font-medium">
            {result.type}
           </span>
										<span class="ml-2">
            {formatLastActivity(result.timestamp)}
           </span>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="space-y-1 p-2">
					{#each getConversationsToShow() as conversation (conversation.id)}
						<div
							on:click={() => selectConversation(conversation.id)}
							class="group relative p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.02]
        {state.activeConversationId === conversation.id
          ? 'bg-sky-50 dark:bg-sky-900/50 border-l-4 border-sky-500 shadow-md'
          : 'hover:bg-stone-100 dark:hover:bg-stone-700/50'}"
						>
							<div class="flex items-start justify-between">
								<div class="flex-1 min-w-0">
									<div class="flex items-center space-x-2">
										<h4 class="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
											{conversation.name}
										</h4>
										{#if conversation.isFavorite}
											<span class="text-amber-500">⭐</span>
										{/if}
									</div>

									{#if conversation.messages.length > 0}
										<p class="text-xs text-stone-600 dark:text-stone-400 mt-1">
											{truncateMessage(conversation.messages[conversation.messages.length - 1].content)}
										</p>
									{/if}

									<div class="flex items-center justify-between mt-2">
            <span class="text-xs text-stone-500">
             {formatLastActivity(conversation.lastActivity)}
            </span>

										<div class="flex items-center space-x-1">
											{#if conversation.metadata.messageCount > 0}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-stone-100 dark:bg-stone-600 text-stone-600 dark:text-stone-300 font-medium">
               {conversation.metadata.messageCount}
              </span>
											{/if}

											{#if conversation.tags.length > 0}
												<div class="flex space-x-1">
													{#each conversation.tags.slice(0, 2) as tag (tag)}
                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 font-medium">
                 {tag}
                </span>
													{/each}
													{#if conversation.tags.length > 2}
														<span class="text-xs text-stone-500">+{conversation.tags.length - 2}</span>
													{/if}
												</div>
											{/if}
										</div>
									</div>
								</div>
							</div>

							<div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
								<div class="flex space-x-1">
									<button
										on:click={(e) => toggleFavorite(conversation.id, e)}
										class="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
										title={conversation.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
									>
										<svg class="w-4 h-4" class:text-amber-500={conversation.isFavorite} fill="currentColor" viewBox="0 0 20 20">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
										</svg>
									</button>

									<button
										on:click={(e) => archiveConversation(conversation.id, e)}
										class="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
										title="Archivar conversación"
									>
										<svg class="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8l4 4 4-4m0 0V4a2 2 0 012-2h4a2 2 0 012 2v16l-6-3-6 3V8z" />
										</svg>
									</button>

									<button
										on:click={(e) => deleteConversation(conversation.id, e)}
										class="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
										title="Eliminar conversación"
									>
										<svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								</div>
							</div>
						</div>
					{:else}
						<div class="p-8 text-center">
							<div class="text-stone-400 dark:text-stone-500 mb-4">
								<svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
								</svg>
							</div>
							<p class="text-sm text-stone-500 dark:text-stone-400 mb-4">
								{#if selectedFilter === 'favorites'}
									No tienes conversaciones favoritas
								{:else if selectedFilter === 'archived'}
									No hay conversaciones archivadas
								{:else}
									No hay conversaciones
								{/if}
							</p>
							{#if selectedFilter === 'all'}
								<button
									on:click={createNewConversation}
									class="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
								>
									Crear primera conversación
								</button>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="border-t border-stone-200/60 dark:border-stone-700/60 p-4 bg-stone-50/30 dark:bg-stone-900/30">
			<div class="text-xs text-stone-500 dark:text-stone-400 space-y-1">
				<div class="flex justify-between">
					<span>Total conversaciones:</span>
					<span class="font-medium text-stone-700 dark:text-stone-300">{state.conversations.length}</span>
				</div>
				<div class="flex justify-between">
					<span>Favoritas:</span>
					<span class="font-medium text-amber-600 dark:text-amber-400">{favorites.length}</span>
				</div>
				<div class="flex justify-between">
					<span>Archivadas:</span>
					<span class="font-medium text-stone-600 dark:text-stone-400">{state.conversations.filter(c => c.status === 'archived').length}</span>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex-1 overflow-y-auto py-2">
			{#each getConversationsToShow().slice(0, 8) as conversation (conversation.id)}
				<div
					class="group relative mx-2 mb-2 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105"
					class:bg-sky-100={state.activeConversationId === conversation.id}
					class:dark:bg-sky-900={state.activeConversationId === conversation.id}
					class:shadow-md={state.activeConversationId === conversation.id}
					class:hover:bg-stone-100={state.activeConversationId !== conversation.id}
					class:dark:hover:bg-stone-700={state.activeConversationId !== conversation.id}
					on:click={() => selectConversation(conversation.id)}
					title={conversation.name}
				>
					<div class="flex items-center justify-center">
						<div class="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
							{conversation.name.charAt(0).toUpperCase()}
						</div>

						{#if conversation.isFavorite}
							<div class="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
								<span class="text-xs text-white">★</span>
							</div>
						{/if}

						{#if conversation.metadata.messageCount > 0}
							<div class="absolute -bottom-1 -right-1 w-4 h-4 bg-stone-500 rounded-full flex items-center justify-center shadow-sm">
								<span class="text-xs text-white font-medium">{Math.min(conversation.metadata.messageCount, 99)}</span>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</aside>

<style>
    /* Scrollbar personalizado para el tema stone */
    .overflow-y-auto::-webkit-scrollbar {
        width: 4px;
    }

    .overflow-y-auto::-webkit-scrollbar-track {
        background: transparent;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb {
        background: rgb(120 113 108 / 0.3);
        border-radius: 2px;
    }

    .dark .overflow-y-auto::-webkit-scrollbar-thumb {
        background: rgb(168 162 158 / 0.3);
    }

    /* Animación suave para el colapso */
    aside {
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Efectos glassmorphism */
    .backdrop-blur-sm {
        backdrop-filter: blur(4px);
    }
</style>