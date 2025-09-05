<!-- src/lib/components/chat/TagManager.svelte -->
<script lang="ts">
	import { chatState, chatActions } from '$lib/stores/chat';
	import type { Tag } from '$lib/types/chat';
	import { fade } from 'svelte/transition';

	// Props
	export let isOpen = false;
	export let conversationId: string | null = null;
	export let onclose: () => void = () => {};

	// Estado local
	let newTagName = '';
	let newTagColor = '#3b82f6'; // Default blue
	let isAdding = false;
	let selectedTags: string[] = [];
	let editingTag: Tag | null = null;
	let searchTag = '';

	// Stores reactivos
	$: state = $chatState;
	$: availableTags = state.availableTags;

	// Actualizar tags seleccionados cuando cambia la conversación
	$: selectedTags = state.conversations.find(conv => conv.id === conversationId)?.tags ?? [];

	// Tags filtrados por búsqueda
	$: filteredTags = searchTag.trim()
		? availableTags.filter(tag =>
			tag.name.toLowerCase().includes(searchTag.toLowerCase()))
		: availableTags;

	// Colores predefinidos para tags
	const predefinedColors = [
		'#ef4444', // Red
		'#f97316', // Orange
		'#f59e0b', // Amber
		'#10b981', // Emerald
		'#3b82f6', // Blue
		'#6366f1', // Indigo
		'#8b5cf6', // Violet
		'#ec4899', // Pink
		'#6b7280', // Gray
	];

	// Función para añadir nuevo tag
	function addNewTag() {
		if (!newTagName.trim()) return;

		if (availableTags.some(tag => tag.name.toLowerCase() === newTagName.toLowerCase())) {
			alert('Ya existe una etiqueta con ese nombre');
			return;
		}

		const newTag: Tag = {
			id: `tag_${Date.now()}`,
			name: newTagName.trim(),
			color: newTagColor,
			description: '',
			createdAt: new Date(),
			usageCount: 0,
			isSystemTag: false
		};

		// Actualizar store
		chatState.update(state => ({
			...state,
			availableTags: [...state.availableTags, newTag]
		}));

		// Limpiar formulario
		newTagName = '';
		isAdding = false;
	}

	// Función para actualizar un tag existente
	function updateTag() {
		if (!editingTag || !editingTag.name.trim()) return;

		// Verificar duplicados (excepto el tag actual)
		const duplicateName = availableTags.some(tag =>
			tag.id !== editingTag!.id &&
			tag.name.toLowerCase() === editingTag!.name.toLowerCase()
		);

		if (duplicateName) {
			alert('Ya existe una etiqueta con ese nombre');
			return;
		}

		// Actualizar store
		chatState.update(state => ({
			...state,
			availableTags: state.availableTags.map(tag =>
				tag.id === editingTag!.id ? editingTag! : tag
			)
		}));

		editingTag = null;
	}

	// Función para eliminar un tag
	function deleteTag(tagId: string) {
		if (!confirm('¿Estás seguro de que quieres eliminar esta etiqueta? Se eliminará de todas las conversaciones.')) {
			return;
		}

		const tagToDelete = availableTags.find(tag => tag.id === tagId);
		if (!tagToDelete) return;

		// Actualizar store
		chatState.update(state => {
			// Eliminar el tag de todas las conversaciones
			const updatedConversations = state.conversations.map(conv => ({
				...conv,
				tags: conv.tags.filter(tag => tag !== tagToDelete.name)
			}));

			return {
				...state,
				conversations: updatedConversations,
				availableTags: state.availableTags.filter(tag => tag.id !== tagId)
			};
		});
	}

	// Función para aplicar tags a la conversación seleccionada
	function applyTagsToConversation() {
		if (!conversationId) return;

		chatActions.updateConversationTags(conversationId, selectedTags);
		closeModal();
	}

	// Función para cerrar el modal
	function closeModal() {
		isOpen = false;
		editingTag = null;
		isAdding = false;
		onclose();
	}

	// Manejar tecla ESC para cerrar el modal
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<dialog open class="fixed inset-0 z-40 flex h-full w-full items-center justify-center bg-black/50 p-4"
		on:click|self={closeModal}
		transition:fade={{ duration: 200 }}
	>
		<div
			role="document"
			class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden"
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
				<h2 id="tag-manager-title" class="text-xl font-semibold text-gray-900 dark:text-white">
					{conversationId ? 'Gestionar etiquetas' : 'Administrar todas las etiquetas'}
				</h2>
				<button
					type="button"
					aria-label="Cerrar gestor de etiquetas"
					on:click={closeModal}
					class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
				>
					<svg class="w-5 h-5" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
				{#if conversationId}
					<!-- Selector de etiquetas para conversación -->
					<div>
						<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
							Etiquetas para esta conversación
						</h3>

						<fieldset class="mb-6">
							<legend class="sr-only">Etiquetas disponibles</legend>
							<div class="flex flex-wrap gap-2">
								{#each availableTags as tag (tag.id)}
									<label
										class="inline-flex items-center px-3 py-2 border rounded-md cursor-pointer transition-colors"
										style="border-color: {tag.color}; background-color: {selectedTags.includes(tag.name) ? `${tag.color}20` : 'transparent'}">
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

								{#if availableTags.length === 0}
									<div class="text-gray-500 dark:text-gray-400 text-sm">
										No hay etiquetas disponibles. Crea una nueva etiqueta abajo.
									</div>
								{/if}
							</div>
						</fieldset>

						<div class="flex justify-end">
							<button
								type="button"
								on:click={() => applyTagsToConversation()}
								class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
							>
								Aplicar cambios
							</button>
						</div>

						<div class="border-t border-gray-200 dark:border-gray-700 my-6"></div>
					</div>
				{/if}

				<!-- Administrar etiquetas -->
				<div>
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-lg font-medium text-gray-900 dark:text-white">
							{conversationId ? 'Crear nueva etiqueta' : 'Todas las etiquetas'}
						</h3>

						{#if !isAdding && !conversationId}
							<div class="relative">
								<input
									type="text"
									id="search-tag"
									placeholder="Buscar etiqueta..."
									bind:value={searchTag}
									class="w-60 pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
									aria-label="Buscar etiqueta"
								/>
								<span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-4 w-4 text-gray-400 dark:text-gray-500" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
							</div>
						{/if}
					</div>

					{#if isAdding}
						<!-- Formulario de nueva etiqueta -->
						<div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
							<div class="space-y-4">
								<div>
									<label for="tagName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Nombre de la etiqueta
									</label>
									<input
										id="tagName"
										type="text"
										bind:value={newTagName}
										class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
										placeholder="Ej: Importante, Trabajo, Personal..."
									/>
								</div>

								<div>
									<label for="tagColor" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Color
									</label>
									<div class="flex items-center space-x-2">
										<input
											id="tagColor"
											type="color"
											bind:value={newTagColor}
											class="h-8 w-8 rounded cursor-pointer"
										/>
										<div class="flex flex-wrap gap-2" role="listbox" aria-label="Colores predefinidos">
											{#each predefinedColors as color, index (color)}
												<button
													type="button" on:click={() => newTagColor = color}
													aria-label={`Seleccionar color ${index + 1}`}
													class="w-6 h-6 rounded-full border-2 p-0.5 transition-all"
													class:border-blue-500={newTagColor === color}
													class:border-transparent={newTagColor !== color}
												>
													<div class="w-full h-full rounded-full" style="background-color: {color};"></div>
												</button>
											{/each}
										</div>
									</div>
								</div>

								<div class="flex justify-end space-x-2">
									<button
										type="button"
										on:click={() => isAdding = false}
										class="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-md transition-colors"
									>
										Cancelar
									</button>
									<button
										type="button"
										on:click={() => addNewTag()}
										disabled={!newTagName.trim()}
										class="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
									>
										Crear etiqueta
									</button>
								</div>
							</div>
						</div>
					{:else if !conversationId}
						<!-- Botón para añadir nueva etiqueta -->
						<button
							type="button"
							on:click={() => isAdding = true}
							class="mb-4 w-full px-4 py-3 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
						>
							<svg class="w-5 h-5 mr-2" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
							Crear nueva etiqueta
						</button>
					{/if}

					{#if !conversationId || isAdding}
						<!-- Lista de etiquetas disponibles -->
						<ul class="space-y-2" role="list" aria-label="Etiquetas disponibles">
							{#each filteredTags as tag (tag.id)}
								<li class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
									<div class="flex items-center">
                    <span
											class="w-4 h-4 rounded-full mr-3"
											style="background-color: {tag.color};"
											aria-hidden="true"
										></span>

										{#if editingTag?.id === tag.id}
											<input
												type="text"
												id="edit-tag-name"
												bind:value={editingTag.name}
												class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
											/>

											<input
												type="color"
												id="edit-tag-color"
												bind:value={editingTag.color}
												class="ml-2 h-6 w-6 rounded cursor-pointer"
												aria-label="Cambiar color de etiqueta"
											/>

											<div class="flex space-x-1 ml-2">
												<button
													type="button"
													aria-label="Guardar cambios"
													on:click={() => updateTag()}
													class="p-1 text-green-600 hover:text-green-800 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
												>
													<svg class="w-4 h-4" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
													</svg>
												</button>
												<button
													type="button"
													aria-label="Cancelar edición"
													on:click={() => editingTag = null}
													class="p-1 text-red-600 hover:text-red-800 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
												>
													<svg class="w-4 h-4" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
													</svg>
												</button>
											</div>
										{:else}
											<div class="font-medium text-gray-900 dark:text-white">
												{tag.name}
											</div>

											<div class="ml-4 text-xs text-gray-500 dark:text-gray-400">
												Usado {tag.usageCount} veces
											</div>
										{/if}
									</div>

									{#if tag.isSystemTag}
                    <span class="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      Sistema
                    </span>
									{:else if editingTag?.id !== tag.id}
										<div class="flex space-x-1">
											<button
												type="button"
												aria-label="Editar etiqueta"
												on:click={() => editingTag = { ...tag }}
												class="p-1 text-gray-600 hover:text-blue-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
											>
												<svg class="w-4 h-4" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
												</svg>
											</button>
											<button
												type="button"
												aria-label="Eliminar etiqueta"
												on:click={() => deleteTag(tag.id)}
												class="p-1 text-gray-600 hover:text-red-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
											>
												<svg class="w-4 h-4" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											</button>
										</div>
									{/if}
								</li>
							{:else}
								<!-- Estado vacío cuando no hay etiquetas -->
								<li class="text-center py-6">
									<div class="text-gray-400 dark:text-gray-500 mb-4" aria-hidden="true">
										<svg class="w-12 h-12 mx-auto" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
										</svg>
									</div>
									<p class="text-gray-600 dark:text-gray-300 mb-4">
										{#if searchTag}
											No se encontraron etiquetas para "{searchTag}"
										{:else}
											No hay etiquetas disponibles
										{/if}
									</p>
									<button
										type="button"
										on:click={() => { isAdding = true; searchTag = ''; }}
										class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
									>
										Crear la primera etiqueta
									</button>
								</li>
							{/each} <!-- Fin del bucle de etiquetas -->
						</ul>
					{/if}

					{#if conversationId && !isAdding}
						<button
							type="button"
							on:click={() => isAdding = true}
							class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
						>
							<svg class="w-4 h-4 mr-2" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
							Crear nueva etiqueta
						</button>
					{/if}
				</div>
			</div>
		</div><!-- document -->
	</dialog>
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
</style>