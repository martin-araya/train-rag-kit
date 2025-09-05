<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
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
	let activeTab: 'select' | 'preview' | 'templates' = 'select';
	let previewContent: string = '';
	let selectedTemplate: string = 'default';
	let customTemplateCode: string = '';

	// Templates predefinidos
	const exportTemplates = [
		{
			id: 'default',
			name: 'Estándar',
			description: 'Formato básico con toda la información'
		},
		{
			id: 'simple',
			name: 'Simple',
			description: 'Solo mensajes, sin metadatos ni fuentes'
		},
		{
			id: 'academic',
			name: 'Académico',
			description: 'Formato con citas y referencias'
		},
		{
			id: 'custom',
			name: 'Personalizado',
			description: 'Define tu propio formato'
		}
	];

	// Event dispatcher
	const dispatch = createEventDispatcher();

	// Stores reactivos
	$: conversations = $filteredConversations;
	$: conversationsToExport =
		selectedConversations.length > 0
			? conversations.filter((conv) => selectedConversations.includes(conv.id))
			: conversations;

	// Función para determinar si el formato PDF está disponible
	// Se calcula una sola vez, ya que 'window' no es reactivo.
	let pdfAvailable = typeof window !== 'undefined' && window.jspdf !== undefined;
	// Funciones
	function closeModal() {
		if (isExporting) return; // No cerrar durante exportación

		isOpen = false;
		exportError = '';
		exportResult = null;
		exportProgress = 0;
		activeTab = 'select';
		dispatch('close');
	}

	// Función para generar una vista previa
	async function generatePreview() {
		if (conversationsToExport.length === 0) {
			previewContent = 'No hay conversaciones seleccionadas para mostrar.';
			return;
		}

		try {
			// Limitar a solo una conversación para la vista previa
			const previewOptions = {
				...exportOptions,
				includeMetadata: true, // Siempre incluir metadatos en la vista previa
				conversations: [conversationsToExport[0].id]
			};

			// NOTA: Los métodos en 'chatService' deben ser públicos.
			// Revisa tu clase ChatService y cambia 'private' por 'public' en los siguientes métodos.
			if (exportOptions.format === 'markdown') {
				const result = chatService.exportToMarkdown([conversationsToExport[0]], previewOptions);
				previewContent = result;
			} else if (exportOptions.format === 'json') {
				const result = chatService.exportToJSON([conversationsToExport[0]], previewOptions);
				previewContent = result;
			} else if (exportOptions.format === 'txt') {
				// Asumiendo que existe un método 'exportToText'
				const result = chatService.exportToText([conversationsToExport[0]], previewOptions);
				previewContent = result;
			} else {
				previewContent = 'La vista previa no está disponible para este formato.';
			}
		} catch (error) {
			previewContent = `Error al generar vista previa: ${
				error instanceof Error ? error.message : 'Error desconocido'
			}`;
		}

		activeTab = 'preview';
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

			// Configurar opciones de exportación incluyendo el template
			const options = {
				...exportOptions,
				template: selectedTemplate === 'custom' ? customTemplateCode : selectedTemplate
			};

			const result = await chatService.exportConversations(conversationsToExport, options);

			clearInterval(progressInterval);
			exportProgress = 100;
			exportResult = result;

			// Iniciar descarga automática
			downloadFile(result);
		} catch (error) {
			exportError =
				error instanceof Error ? error.message : 'Error desconocido durante la exportación';
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
		return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
	}

	const availableFormats: ExportFormat[] = pdfAvailable
		? ['markdown', 'json', 'txt', 'pdf']
		: ['markdown', 'json', 'txt'];

	// Función para cargar la biblioteca jsPDF dinámicamente si se selecciona PDF
	$: if (isOpen && exportOptions.format === 'pdf' && typeof window !== 'undefined' && !window.jspdf) {
		const script = document.createElement('script');
		script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
		script.async = true;
		script.onload = () => {
			console.log('jsPDF cargado correctamente');
			pdfAvailable = true; // Actualizamos el estado
		};
		document.head.appendChild(script);
	}

	// Cerrar modal con Escape
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && !isExporting) {
			closeModal();
		}
	}

	// Establecer template personalizado si se selecciona custom
	$: if (selectedTemplate === 'custom' && !customTemplateCode) {
		customTemplateCode = `# {{conversation.name}}

Fecha: {{conversation.createdAt}}
Mensajes: {{conversation.messages.length}}
Tags: {{conversation.tags.join(', ')}}

{{#each messages}}
## {{role}} ({{timestamp}})
{{content}}
{{/each}}`;
	}

	// Cargar y configurar la exportación cuando se abre el modal
	onMount(() => {
		// Verificar si jsPDF está disponible
		if (typeof window !== 'undefined' && !window.jspdf) {
			// Cargar jsPDF si no está disponible
			const script = document.createElement('script');
			script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
			script.async = true;
			document.head.appendChild(script);
		}
	});
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div role="dialog"
		aria-labelledby="export-modal-title"
		aria-modal="true"
		tabindex="-1"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
		on:click|self={() => !isExporting && closeModal()} on:keydown={(e) => e.key === 'Escape' && !isExporting && closeModal()}
		transition:fade={{ duration: 200 }}
	>
		<div
			class="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800"
			transition:slide={{ duration: 300 }}
		>
			<div
				class="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700"
			>
				<h2
					id="export-modal-title"
					class="flex items-center text-xl font-semibold text-gray-900 dark:text-white"
				>
					<svg
						class="mr-2 h-6 w-6 text-blue-600 dark:text-blue-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
						/>
					</svg>
					Exportar Conversaciones
					{#if exportResult}
						<span
							class="ml-2 rounded-full bg-green-100 px-2 py-1 text-sm text-green-800 dark:bg-green-900 dark:text-green-200"
						>
							Completado
						</span>
					{/if}
				</h2>
				{#if !isExporting}
					<button
						type="button"
						on:click={() => closeModal()}
						aria-label="Cerrar modal de exportación"
						class="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						<svg
							class="h-5 w-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				{/if}
			</div>

			{#if !exportResult && !isExporting}
				<div class="flex border-b border-gray-200 dark:border-gray-700">
					<button
						type="button"
						class="flex items-center px-4 py-3 text-sm font-medium transition-colors"
						class:border-b-2={activeTab === 'select'}
						class:border-blue-600={activeTab === 'select'}
						class:text-blue-600={activeTab === 'select'}
						class:dark:border-blue-400={activeTab === 'select'}
						class:dark:text-blue-400={activeTab === 'select'}
						class:text-gray-600={activeTab !== 'select'}
						class:hover:text-gray-900={activeTab !== 'select'}
						class:dark:text-gray-400={activeTab !== 'select'}
						class:dark:hover:text-gray-200={activeTab !== 'select'}
						on:click={() => (activeTab = 'select')}
						aria-label="Seleccionar formato y conversaciones"
					>
						<svg
							class="mr-2 h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 10h16M4 14h16M4 18h16"
							/>
						</svg>
						Seleccionar
					</button>

					<button
						type="button"
						class="flex items-center px-4 py-3 text-sm font-medium transition-colors"
						class:border-b-2={activeTab === 'templates'}
						class:border-blue-600={activeTab === 'templates'}
						class:text-blue-600={activeTab === 'templates'}
						class:dark:border-blue-400={activeTab === 'templates'}
						class:dark:text-blue-400={activeTab === 'templates'}
						class:text-gray-600={activeTab !== 'templates'}
						class:hover:text-gray-900={activeTab !== 'templates'}
						class:dark:text-gray-400={activeTab !== 'templates'}
						class:dark:hover:text-gray-200={activeTab !== 'templates'}
						on:click={() => (activeTab = 'templates')}
						aria-label="Seleccionar plantilla"
					>
						<svg
							class="mr-2 h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
							/>
						</svg>
						Plantillas
					</button>

					<button
						type="button"
						class="flex items-center px-4 py-3 text-sm font-medium transition-colors"
						class:border-b-2={activeTab === 'preview'}
						class:border-blue-600={activeTab === 'preview'}
						class:text-blue-600={activeTab === 'preview'}
						class:dark:border-blue-400={activeTab === 'preview'}
						class:dark:text-blue-400={activeTab === 'preview'}
						class:text-gray-600={activeTab !== 'preview'}
						class:hover:text-gray-900={activeTab !== 'preview'}
						class:dark:text-gray-400={activeTab !== 'preview'}
						class:dark:hover:text-gray-200={activeTab !== 'preview'}
						disabled={conversationsToExport.length === 0}
						on:click={() => generatePreview()}
						aria-label="Ver vista previa"
					>
						<svg
							class="mr-2 h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
							/>
						</svg>
						Vista Previa
					</button>
				</div>
			{/if}

			<div class="max-h-[calc(90vh-200px)] overflow-y-auto">
				<div class="space-y-6 p-6">
					{#if exportResult}
						<div class="space-y-4 text-center">
							<div
								class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900"
							>
								<svg
									class="h-8 w-8 text-green-600 dark:text-green-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>

							<h3 class="text-lg font-medium text-gray-900 dark:text-white">
								Exportación completada
							</h3>

							<div class="rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-700">
								<div class="grid grid-cols-2 gap-4">
									<div>
										<span class="text-gray-500 dark:text-gray-400">Archivo:</span>
										<span class="block font-medium">{exportResult.filename}</span>
									</div>
									<div>
										<span class="text-gray-500 dark:text-gray-400">Tamaño:</span>
										<span class="block font-medium">{formatFileSize(exportResult.size)}</span>
									</div>
									<div>
										<span class="text-gray-500 dark:text-gray-400">Formato:</span>
										<span class="block font-medium uppercase">{exportResult.format}</span>
									</div>
									<div>
										<span class="text-gray-500 dark:text-gray-400">Conversaciones:</span>
										<span class="block font-medium">{conversationsToExport.length}</span>
									</div>
								</div>
							</div>

							<div class="flex space-x-3">
								<button
									type="button"
									on:click={() => exportResult && downloadFile(exportResult)}
									class="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
									aria-label="Descargar archivo nuevamente"
								>
									<svg
										class="mr-2 h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
										/>
									</svg>
									Descargar nuevamente
								</button>
								<button
									type="button"
									on:click={() => closeModal()}
									class="rounded-lg bg-gray-100 px-4 py-2 text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
									aria-label="Cerrar modal"
								>
									Cerrar
								</button>
							</div>
						</div>
					{:else if isExporting}
						<div class="space-y-4 text-center">
							<div
								class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900"
							>
								<div
									class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
								></div>
							</div>

							<h3 class="text-lg font-medium text-gray-900 dark:text-white">
								Exportando conversaciones...
							</h3>

							<div class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
								<div
									class="h-2 rounded-full bg-blue-600 transition-all duration-300"
									style="width: {exportProgress}%"
								></div>
							</div>

							<p class="text-sm text-gray-600 dark:text-gray-400">
								{exportProgress}% completado - Procesando {conversationsToExport.length} conversaciones
							</p>
						</div>
					{:else if activeTab === 'select'}
						<div>
							<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">
								1. Formato de exportación
							</h3>

							<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
								{#each availableFormats as format (format)}
									<label
										class="flex cursor-pointer items-start rounded-xl border-2 border-gray-200 p-4 transition-all duration-200 hover:border-blue-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-blue-400 dark:hover:bg-gray-700/50"
									>
										<input
											type="radio"
											id="format-{format}"
											bind:group={exportOptions.format}
											value={format}
											class="mr-3 mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
										/>
										<div>
											<div class="font-medium uppercase text-gray-900 dark:text-white">
												{format}
											</div>
										</div>
									</label>
								{/each}
							</div>
						</div>

						{#if exportError}
							<div
								class="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20"
							>
								<div class="flex items-center">
									<svg
										class="mr-2 h-5 w-5 text-red-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									<span class="text-sm text-red-800 dark:text-red-200">
										{exportError}
									</span>
								</div>
							</div>
						{/if}
					{:else if activeTab === 'templates'}
						<div transition:slide>
							<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">
								Seleccionar plantilla
							</h3>

							<div class="space-y-3">
								{#each exportTemplates as template (template.id)}
									<label
										class="flex cursor-pointer items-start rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
									>
										<input
											type="radio"
											id="template-{template.id}"
											bind:group={selectedTemplate}
											value={template.id}
											class="mr-3 mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
										/>
										<div>
											<div class="font-medium text-gray-900 dark:text-white">
												{template.name}
											</div>
											<div class="text-sm text-gray-600 dark:text-gray-400">
												{template.description}
											</div>
										</div>
									</label>
								{/each}
							</div>

							{#if selectedTemplate === 'custom'}
								<div class="mt-4">
									<h4 class="mb-2 font-medium text-gray-900 dark:text-white">
										Código de plantilla personalizada
									</h4>
									<textarea
										id="template-code"
										bind:value={customTemplateCode}
										rows="8"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 font-mono text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
										placeholder="Ingresa tu plantilla personalizada aquí..."
									></textarea>
									<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
										Utiliza variables como {'{{conversation.name}}'}, {'{{conversation.createdAt}}'}, etc.
									</p>
								</div>
							{/if}
						</div>
					{:else if activeTab === 'preview'}
						<div transition:slide>
							<h3
								class="mb-4 flex items-center justify-between text-lg font-medium text-gray-900 dark:text-white"
							>
								<span>Vista previa ({exportOptions.format.toUpperCase()})</span>
								<button
									type="button"
									on:click={() => generatePreview()}
									class="flex items-center text-sm text-blue-600 hover:underline dark:text-blue-400"
									aria-label="Actualizar vista previa"
								>
									<svg
										class="mr-1 h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
										/>
									</svg>
									Actualizar vista previa
								</button>
							</h3>

							{#if previewContent}
								<div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
									<div
										class="h-96 overflow-y-auto whitespace-pre-wrap bg-white p-4 font-mono text-sm dark:bg-gray-800"
									>
										{previewContent}
									</div>
								</div>
							{:else}
								<div
									class="flex h-40 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700"
								>
									<p class="text-gray-500 dark:text-gray-400">
										Selecciona una conversación y genera una vista previa
									</p>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
			{#if !exportResult && !isExporting}
				<div
					class="flex items-center justify-between border-t border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-700/50"
				>
					<div class="text-sm text-gray-600 dark:text-gray-400">
						{conversationsToExport.length} conversacion{#if conversationsToExport.length !== 1}es{/if}
						seleccionada{#if conversationsToExport.length !== 1}s{/if}
					</div>

					<div class="flex space-x-3">
						<button
							type="button"
							on:click={() => closeModal()}
							class="rounded-lg bg-gray-100 px-4 py-2 text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
							aria-label="Cancelar exportación"
						>
							Cancelar
						</button>
						<button
							type="button"
							on:click={() => startExport()}
							disabled={conversationsToExport.length === 0}
							class="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
							aria-label="Exportar conversaciones seleccionadas"
						>
							<svg
								class="mr-2 h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
								/>
							</svg>
							Exportar
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
    /* Estilos para scrollbars */
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

    /* Estilos para spinner de carga */
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .animate-spin {
        animation: spin 1s linear infinite;
    }
</style>