<!-- src/lib/components/chat/SearchPanel.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { chatState, chatActions, filteredConversations } from '$lib/stores/chat';
	import type { SearchQuery } from '$lib/types/chat';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	// Props
	export let isOpen = false;

	// Estado local
	let searchTerm = '';
	let searchScope: 'all' | 'messages' | 'summaries' | 'tags' = 'all';
	let selectedConversations: string[] = [];
	let selectedTags: string[] = [];
	let hasBookmarks = false;
	let minConfidence = 0;
	let useAdvancedFilters = false;
	let searchTimeout: ReturnType<typeof setTimeout>;
	let isSearching = false;
	let startDate = '';
	let endDate = '';

	// Event dispatcher
	const dispatch = createEventDispatcher();

	// Stores reactivos
	$: state = $chatState;
	$: conversations = $filteredConversations;
	$: availableTags = state.availableTags;
	$: searchResults = state.searchResults;

	// Inicializar con conversaciones activas
	$: {
		if (isOpen && selectedConversations.length === 0) {
			selectedConversations = conversations
				.filter(c => c.status === 'active')
				.map(c => c.id);
		}
	}

	// Función para realizar búsqueda
	async function performSearch() {
		if (!searchTerm.trim()) return;

		isSearching = true;
		clearTimeout(searchTimeout);

		try {
			// Construir objeto de búsqueda
			const query: SearchQuery = {
				term: searchTerm.trim(),
				scope: searchScope,
				conversationIds: selectedConversations.length > 0 ? selectedConversations : undefined,
				tags: selectedTags.length > 0 ? selectedTags : undefined,
				hasBookmarks: hasBookmarks || undefined,
				minConfidence: minConfidence > 0 ? minConfidence / 100 : undefined
			};

			// Agregar rango de fechas si está definido
			if (startDate && endDate) {
				query.dateRange = {
					start: new Date(startDate),
					end: new Date(endDate)
				};
			}

			await chatActions.searchConversations(query);

		} catch (error) {
			console.error('Error en búsqueda:', error);
		} finally {
			isSearching = false;
		}
	}

	// Función para búsqueda con debounce
	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			performSearch();
		}, 500);
	}

	// Función para limpiar búsqueda
	function clearSearch() {
		searchTerm = '';
		chatActions.clearSearch();
	}

	// Función para cerrar el panel
	function closePanel() {
		isOpen = false;
		dispatch('close');
	}

	// Función para cerrar al presionar ESC
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closePanel();
		}
	}

	// Función para seleccionar/deseleccionar todas las conversaciones
	function toggleAllConversations(select: boolean) {
		selectedConversations = select
			? conversations.map(c => c.id)
			: [];
	}

	// Limpiar timeout al desmontar
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		if (searchTimeout) clearTimeout(searchTimeout);
	});
</script>

<!-- Añadir evento para capturar tecla ESC -->
<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div role="dialog"
		aria-labelledby="search-panel-title"
		aria-modal="true"
		tabindex="-1"
		class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
		on:click|self={closePanel}
		on:keydown={handleKeydown}
		transition:slide={{ duration: 300, easing: quintOut }}
	>
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden" on:click|stopPropagation>
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
				<h2 id="search-panel-title" class="text-xl font-semibold text-gray-900 dark:text-white">
					Búsqueda avanzada
				</h2>
				<button
					type="button"
					aria-label="Cerrar panel de búsqueda"
					on:click={closePanel}
					class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Search Form -->
			<div class="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
				<div class="space-y-4">
					<!-- Search Input -->
					<div class="relative">
						<input
							type="text"
							id="search-input"
							placeholder="Buscar en conversaciones..."
							bind:value={searchTerm}
							on:input={handleSearchInput}
							class="w-full pl-12 pr-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
							aria-label="Buscar"
						/>
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<svg class="h-6 w-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>

						{#if searchTerm.length > 0}
							<button
								type="button"
								aria-label="Limpiar búsqueda"
								on:click={clearSearch}
								class="absolute inset-y-0 right-0 pr-3 flex items-center"
							>
								<svg class="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						{/if}
					</div>

					<!-- Search Scope -->
					<fieldset>
						<legend class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Buscar en:
						</legend>
						<div class="flex flex-wrap gap-2">
							<label class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
								<input type="radio" id="scope-all" bind:group={searchScope} value="all" class="mr-2 h-4 w-4 text-blue-600" />
								<span>Todo</span>
							</label>
							<label class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
								<input type="radio" id="scope-messages" bind:group={searchScope} value="messages" class="mr-2 h-4 w-4 text-blue-600" />
								<span>Mensajes</span>
							</label>
							<label class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
								<input type="radio" id="scope-summaries" bind:group={searchScope} value="summaries" class="mr-2 h-4 w-4 text-blue-600" />
								<span>Resúmenes</span>
							</label>
							<label class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
								<input type="radio" id="scope-tags" bind:group={searchScope} value="tags" class="mr-2 h-4 w-4 text-blue-600" />
								<span>Etiquetas</span>
							</label>
						</div>
					</fieldset>

					<!-- Toggle Advanced Filters -->
					<div>
						<button
							type="button"
							on:click={() => useAdvancedFilters = !useAdvancedFilters}
							class="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
							aria-expanded={useAdvancedFilters}
							aria-controls="advanced-filters"
						>
							<svg
								class="w-4 h-4 mr-2 transition-transform duration-200"
								class:rotate-90={useAdvancedFilters}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
							{useAdvancedFilters ? 'Ocultar filtros avanzados' : 'Mostrar filtros avanzados'}
						</button>
					</div>

					{#if useAdvancedFilters}
						<div id="advanced-filters" transition:slide class="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
							<!-- Filter by Conversations -->
							<fieldset>
								<div class="flex justify-between items-center mb-2">
									<legend class="block text-sm font-medium text-gray-700 dark:text-gray-300">
										Conversaciones:
									</legend>
									<div class="flex space-x-2">
										<button
											type="button"
											on:click={() => toggleAllConversations(true)}
											class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
										>
											Seleccionar todas
										</button>
										<button
											type="button"
											on:click={() => toggleAllConversations(false)}
											class="text-xs text-gray-600 dark:text-gray-400 hover:underline"
										>
											Deseleccionar todas
										</button>
									</div>
								</div>

								<div class="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg divide-y divide-gray-200 dark:divide-gray-600">
									{#each conversations as conversation (conversation.id)}
										<label class="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
											<input
												type="checkbox"
												id="conv-{conversation.id}"
												value={conversation.id}
												bind:group={selectedConversations}
												class="mr-3 h-4 w-4 text-blue-600 rounded"
											/>
											<div class="truncate">
												<span class="font-medium">{conversation.name}</span>
												<span class="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          ({conversation.messages.length} mensajes)
                        </span>
											</div>
										</label>
									{/each}
								</div>
							</fieldset>

							<!-- Filter by Tags -->
							{#if availableTags.length > 0}
								<fieldset>
									<legend class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Etiquetas:
									</legend>
									<div class="flex flex-wrap gap-2">
										{#each availableTags as tag (tag.id)}
											<label
												class="inline-flex items-center px-3 py-2 border rounded-md cursor-pointer transition-colors"
												style="border-color: {tag.color}; background-color: {selectedTags.includes(tag.name) ? `${tag.color}20` : 'transparent'}"
											>
												<input
													type="checkbox"
													id="tag-{tag.id}"
													value={tag.name}
													bind:group={selectedTags}
													class="mr-2 h-4 w-4 text-blue-600"
												/>
												<span>{tag.name}</span>
											</label>
										{/each}
									</div>
								</fieldset>
							{/if}

							<!-- Date Range -->
							<fieldset>
								<legend class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Rango de fechas:
								</legend>
								<div class="flex space-x-3">
									<div class="flex-1">
										<label for="date-from" class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Desde:</label>
										<input
											type="date"
											id="date-from"
											bind:value={startDate}
											class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
										/>
									</div>
									<div class="flex-1">
										<label for="date-to" class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Hasta:</label>
										<input
											type="date"
											id="date-to"
											bind:value={endDate}
											class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
										/>
									</div>
								</div>
							</fieldset>

							<!-- Other Filters -->
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
										<input
											type="checkbox"
											id="has-bookmarks"
											bind:checked={hasBookmarks}
											class="h-4 w-4 text-blue-600 rounded"
										/>
										<span>Solo con favoritos/marcadores</span>
									</label>
								</div>

								<div>
									<label for="min-confidence" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Confianza mínima: {minConfidence}%
									</label>
									<input
										type="range"
										id="min-confidence"
										min="0"
										max="100"
										step="5"
										bind:value={minConfidence}
										class="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
									/>
								</div>
							</div>
						</div>
					{/if}

					<!-- Search Button -->
					<div class="flex justify-end">
						<button
							type="button"
							on:click={performSearch}
							disabled={!searchTerm.trim() || isSearching}
							class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
							aria-label={isSearching ? 'Buscando' : 'Buscar'}
						>
							{#if isSearching}
								<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
								<span>Buscando...</span>
							{:else}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
								<span>Buscar</span>
							{/if}
						</button>
					</div>
				</div>

				<!-- Search Results -->
				{#if searchResults}
					<div class="mt-6">
						<div class="flex justify-between items-center mb-4">
							<h3 class="text-lg font-medium text-gray-900 dark:text-white">
								Resultados ({searchResults.totalCount})
							</h3>
							<button
								type="button"
								on:click={clearSearch}
								class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
								aria-label="Limpiar resultados"
							>
								Limpiar resultados
							</button>
						</div>

						{#if searchResults.totalCount > 0}
							<ul class="space-y-3" role="listbox" aria-label="Resultados de búsqueda">
								{#each searchResults.results as result (result.id)}
									<li>
										<button
											type="button"
											class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
											on:click={() => {
                        chatActions.setActiveConversation(result.conversationId);
                        closePanel();
                      }}
											role="option"
											aria-selected="false"
										>
											<div class="flex items-start justify-between">
												<div class="flex-1 min-w-0">
													<div class="flex items-center">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mr-2">
                              {result.type}
                            </span>
														<h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">
															{result.title}
														</h4>
													</div>

													<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
														{result.snippet}
													</p>

													<div class="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-3">
														<span>{new Date(result.timestamp).toLocaleString()}</span>
														{#if result.tags.length > 0}
															<div class="flex space-x-1">
																{#each result.tags.slice(0, 3) as tag (tag)}
                                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800">
                                    {tag}
                                  </span>
																{/each}
																{#if result.tags.length > 3}
																	<span>+{result.tags.length - 3}</span>
																{/if}
															</div>
														{/if}
														<span>Relevancia: {Math.round(result.relevance * 100)}%</span>
													</div>
												</div>
											</div>
										</button>
									</li>
								{/each}
							</ul>

							{#if searchResults.suggestions.length > 0}
								<div class="mt-4">
									<p class="text-sm text-gray-600 dark:text-gray-400">Sugerencias:</p>
									<div class="flex flex-wrap gap-2 mt-2">
										{#each searchResults.suggestions as suggestion (suggestion)}
											<button
												type="button"
												on:click={() => {
                          searchTerm = suggestion.replace(/^"(.+)"$/, '$1');
                          performSearch();
                        }}
												class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
												aria-label={`Buscar: ${suggestion}`}
											>
												{suggestion}
											</button>
										{/each}
									</div>
								</div>
							{/if}
						{:else}
							<div class="text-center py-10">
								<div class="text-gray-400 dark:text-gray-500 mb-4" aria-hidden="true">
									<svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h.01M12 12h.01M15 12h.01M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z" />
									</svg>
								</div>
								<p class="text-lg text-gray-600 dark:text-gray-300 mb-4">
									No se encontraron resultados para "{searchTerm}"
								</p>
								<div class="text-sm text-gray-500 dark:text-gray-400">
									Prueba con términos diferentes o modifica los filtros de búsqueda
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
    /* Estilos personalizados para scrollbars */
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

    /* Animación para el spinner */
    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .animate-spin {
        animation: spin 1s linear infinite;
    }
</style>