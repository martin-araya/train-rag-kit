<!-- src/lib/components/chat/ExportModal.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { filteredConversations } from '$lib/stores/chat';
	import { chatService } from '$lib/services/chat';
	import type { ExportOptions, ExportFormat, ExportResult } from '$lib/types/chat';

	// Props
	export let isOpen = false;
	export let selectedConversations: string[] = [];

	// Estado local
	let exportOptions: ExportOptions = {
		format: 'markdown',
		includeMetadata: true,
		includeSources: true,
		includeTimestamps: true
	};

	let isExporting = false;
	let exportProgress = 0;
	let exportError = '';
	let exportResult: ExportResult | null = null;

	// Dispatcher para eventos
	const dispatch = createEventDispatcher();

	// Reactive statements
	$: conversations = $filteredConversations;
	$: conversationsToExport = selectedConversations.length > 0
		? conversations.filter(conv => selectedConversations.includes(conv.id))
		: conversations;

	// Funciones
	function closeModal() {
		isOpen = false;
		exportError = '';
		exportResult = null;
		exportProgress = 0;
		dispatch('close');
	}

	function selectAllConversations() {
		selectedConversations = conversations.map(conv => conv.id);
	}

	function deselectAllConversations() {
		selectedConversations = [];
	}

	function toggleConversation(conversationId: string) {
		if (selectedConversations.includes(conversationId)) {
			selectedConversations = selectedConversations.filter(id => id !== conversationId);
		} else {
			selectedConversations = [...selectedConversations, conversationId];
		}
	}

	async function startExport() {
		if (conversationsToExport.length === 0) {
			exportError = 'No hay conversaciones seleccionadas para exportar';
			return;
		}

		isExporting = true;
		exportError = '';
		exportProgress = 0;

		try {
			// Simular progreso
			const progressInterval = setInterval(() => {
				exportProgress += 10;
				if (exportProgress >= 90) {
					clearInterval(progressInterval);
				}
			}, 100);

			const result = await chatService.exportConversations(conversationsToExport, exportOptions);

			clearInterval(progressInterval);
			exportProgress = 100;
			exportResult = result;

			// Iniciar descarga automática
			downloadFile(result);

		} catch (error) {
			exportError = error instanceof Error ? error.message : 'Error desconocido durante la exportación';
		} finally {
			isExporting = false;
		}
	}

	function downloadFile(result: ExportResult) {
		// Crear elemento de descarga
		const link = document.createElement('a');
		link.href = result.downloadUrl;
		link.download = result.filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		// Limpiar URL después de un tiempo
		setTimeout(() => {
			URL.revokeObjectURL(result.downloadUrl);
		}, 1000);
	}

	function formatFileSize(bytes: number): string {
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		if (bytes === 0) return '0 Bytes';
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
	}

	function getFormatDescription(format: ExportFormat): string {
		switch (format) {
			case 'markdown':
				return 'Formato Markdown (.md) - Compatible con editores de texto y GitHub';
			case 'json':
				return 'Formato JSON (.json) - Datos estructurados para desarrolladores';
			case 'txt':
				return 'Texto plano (.txt) - Compatible con cualquier editor de texto';
			case 'pdf':
				return 'Documento PDF (.pdf) - Formato profesional para compartir';
			default:
				return '';
		}
	}

	const availableFormats: ExportFormat[] = ['markdown', 'json', 'txt'];

	// Cerrar modal con Escape
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && !isExporting) {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
		on:click={(e) => e.target === e.currentTarget && !isExporting && closeModal()}
	>
		<!-- Modal -->
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
				<h2 class="text-xl font-semibold text-gray-900 dark:text-white">
					Exportar Conversaciones
				</h2>
				{#if !isExporting}
					<button
						on:click={closeModal}
						class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</div>

			<div class="overflow-y-auto max-h-[calc(90vh-200px)]">
				<!-- Content -->
				<div class="p-6 space-y-6">
					{#if exportResult}
						<!-- Export Success -->
						<div class="text-center space-y-4">
							<div class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
								<svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							</div>

							<h3 class="text-lg font-medium text-gray-900 dark:text-white">
								Exportación completada
							</h3>

							<div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm">
								<div class="grid grid-cols-2 gap-4">
									<div>
										<span class="text-gray-500 dark:text-gray-400">Archivo:</span>
										<span class="font-medium block">{exportResult.filename}</span>
									</div>
									<div>
										<span class="text-gray-500 dark:text-gray-400">Tamaño:</span>
										<span class="font-medium block">{formatFileSize(exportResult.size)}</span>
									</div>
									<div>
										<span class="text-gray-500 dark:text-gray-400">Formato:</span>
										<span class="font-medium block uppercase">{exportResult.format}</span>
									</div>
									<div>
										<span class="text-gray-500 dark:text-gray-400">Conversaciones:</span>
										<span class="font-medium block">{conversationsToExport.length}</span>
									</div>
								</div>
							</div>

							<div class="flex space-x-3">
								<button
									on:click={() => exportResult && downloadFile(exportResult)}
									class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
								>
									Descargar nuevamente
								</button>
								<button
									on:click={closeModal}
									class="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
								>
									Cerrar
								</button>
							</div>
						</div>
					{:else if isExporting}
						<!-- Export Progress -->
						<div class="text-center space-y-4">
							<div class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
								<div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
							</div>

							<h3 class="text-lg font-medium text-gray-900 dark:text-white">
								Exportando conversaciones...
							</h3>

							<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
								<div
									class="bg-blue-600 h-2 rounded-full transition-all duration-300"
									style="width: {exportProgress}%"
								></div>
							</div>

							<p class="text-sm text-gray-600 dark:text-gray-400">
								{exportProgress}% completado - Procesando {conversationsToExport.length} conversaciones
							</p>
						</div>
					{:else}
						<!-- Export Configuration -->
						<div class="space-y-6">
							<!-- Format Selection -->
							<div>
								<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
									Formato de exportación
								</h3>

								<div class="space-y-2">
									{#each availableFormats as format (format)}
										<label class="flex items-start p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
											<input
												type="radio"
												bind:group={exportOptions.format}
												value={format}
												class="mt-1 mr-3"
											/>
											<div>
												<div class="font-medium text-gray-900 dark:text-white uppercase">
													{format}
												</div>
												<div class="text-sm text-gray-600 dark:text-gray-400">
													{getFormatDescription(format)}
												</div>
											</div>
										</label>
									{/each}

									<!-- PDF option (disabled) -->
									<label class="flex items-start p-3 border border-gray-200 dark:border-gray-700 rounded-lg opacity-50 cursor-not-allowed">
										<input
											type="radio"
											value="pdf"
											disabled
											class="mt-1 mr-3"
										/>
										<div>
											<div class="font-medium text-gray-900 dark:text-white uppercase">
												PDF <span class="text-xs text-orange-500">(Próximamente)</span>
											</div>
											<div class="text-sm text-gray-600 dark:text-gray-400">
												Documento PDF (.pdf) - Formato profesional para compartir
											</div>
										</div>
									</label>
								</div>
							</div>

							<!-- Export Options -->
							<div>
								<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
									Opciones de exportación
								</h3>

								<div class="space-y-3">
									<label class="flex items-center">
										<input
											type="checkbox"
											bind:checked={exportOptions.includeMetadata}
											class="mr-3"
										/>
										<span class="text-sm text-gray-900 dark:text-white">
											Incluir metadatos (fechas, estadísticas, tags)
										</span>
									</label>

									<label class="flex items-center">
										<input
											type="checkbox"
											bind:checked={exportOptions.includeSources}
											class="mr-3"
										/>
										<span class="text-sm text-gray-900 dark:text-white">
											Incluir fuentes y referencias de documentos
										</span>
									</label>

									<label class="flex items-center">
										<input
											type="checkbox"
											bind:checked={exportOptions.includeTimestamps}
											class="mr-3"
										/>
										<span class="text-sm text-gray-900 dark:text-white">
											Incluir marcas de tiempo en mensajes
										</span>
									</label>
								</div>
							</div>

							<!-- Conversation Selection -->
							<div>
								<div class="flex items-center justify-between mb-3">
									<h3 class="text-lg font-medium text-gray-900 dark:text-white">
										Conversaciones a exportar ({conversationsToExport.length})
									</h3>

									<div class="flex space-x-2">
										<button
											on:click={selectAllConversations}
											class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
										>
											Seleccionar todas
										</button>
										<button
											on:click={deselectAllConversations}
											class="text-sm text-gray-600 dark:text-gray-400 hover:underline"
										>
											Deseleccionar
										</button>
									</div>
								</div>

								<div class="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
									{#each conversations as conversation (conversation.id)}
										<label class="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0">
											<input
												type="checkbox"
												checked={selectedConversations.includes(conversation.id)}
												on:change={() => toggleConversation(conversation.id)}
												class="mr-3"
											/>
											<div class="flex-1 min-w-0">
												<div class="font-medium text-gray-900 dark:text-white truncate">
													{conversation.name}
												</div>
												<div class="text-sm text-gray-500 dark:text-gray-400">
													{conversation.metadata.messageCount} mensajes •
													{new Date(conversation.lastActivity).toLocaleDateString()}
													{#if conversation.tags.length > 0}
														• {conversation.tags.join(', ')}
													{/if}
												</div>
											</div>
										</label>
									{/each}
								</div>
							</div>

							<!-- Error Display -->
							{#if exportError}
								<div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
									<div class="flex items-center">
										<svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<span class="text-red-800 dark:text-red-200 text-sm">
											{exportError}
										</span>
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<!-- Footer -->
			{#if !exportResult && !isExporting}
				<div class="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
					<div class="text-sm text-gray-600 dark:text-gray-400">
						{conversationsToExport.length} conversaciones seleccionadas
					</div>

					<div class="flex space-x-3">
						<button
							on:click={closeModal}
							class="px-4 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg transition-colors"
						>
							Cancelar
						</button>
						<button
							on:click={startExport}
							disabled={conversationsToExport.length === 0}
							class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
						>
							Exportar
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
    /* Estilos para el modal */
    .overflow-y-auto::-webkit-scrollbar {
        width: 4px;
    }

    .overflow-y-auto::-webkit-scrollbar-track {
        background: transparent;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 2px;
    }

    .dark .overflow-y-auto::-webkit-scrollbar-thumb {
        background: #475569;
    }
</style>