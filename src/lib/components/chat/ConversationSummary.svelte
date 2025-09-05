<script lang="ts">
	import { chatActions, activeConversation } from '$lib/stores/chat';
	import { slide, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	// Props
	export let isOpen = false;
	export let conversationId: string | null = null;
	export let onclose: () => void = () => {};

	// Estado local
	let isGenerating = false;
	let generationProgress = 0;
	let generationError = '';
	let progressInterval: ReturnType<typeof setInterval>;

	// Stores reactivos
	$: conversation = conversationId
		? $activeConversation
		: null;

	$: summary = conversation?.summary;

	// Verificar si hay suficientes mensajes para generar un resumen
	$: canGenerateSummary = conversation && conversation.messages.length >= 5;

	// Función para generar un resumen
	async function generateSummary() {
		if (!conversation) return;

		isGenerating = true;
		generationProgress = 0;
		generationError = '';

		// Simular progreso
		progressInterval = setInterval(() => {
			generationProgress += Math.floor(Math.random() * 5) + 3;
			if (generationProgress >= 90) {
				clearInterval(progressInterval);
				generationProgress = 90;
			}
		}, 200);

		try {
			await chatActions.generateSummary(conversation.id);
			generationProgress = 100;
		} catch (error) {
			generationError = error instanceof Error ? error.message : 'Error desconocido';
		} finally {
			isGenerating = false;
			clearInterval(progressInterval);
		}
	}

	// Función para cerrar el modal
	function closeModal() {
		if (isGenerating) return;

		isOpen = false;
		onclose();
	}

	// Formatea fecha
	function formatDate(date: Date): string {
		return new Date(date).toLocaleString();
	}

	// Limpia al desmontar
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		if (progressInterval) clearInterval(progressInterval);
	});
</script>

{#if isOpen}
	<!-- Not Enough Messages section -->
	<div class="text-yellow-500 mb-4" role="img" aria-label="Advertencia">
	  <svg class="w-12 h-12 mx-auto" stroke="currentColor" viewBox="0 0 24 24">
	    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
	  </svg>
	</div>

	<!-- Error State section -->
	<div class="text-red-500 dark:text-red-400 mb-4" role="img" aria-label="Error">
	  <svg class="w-12 h-12 mx-auto" stroke="currentColor" viewBox="0 0 24 24">
	    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
	  </svg>
	</div>

	<!-- Generate Initial Summary section -->
	<div class="text-blue-500 dark:text-blue-400 mb-4" role="img" aria-label="Información">
	  <svg class="w-12 h-12 mx-auto" stroke="currentColor" viewBox="0 0 24 24">
	    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
	  </svg>
	<div
	  role="dialog"
	  aria-modal="true"
	  aria-labelledby="summary-title"
	  tabindex="-1"
	  class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
	  on:click|self={closeModal}
	  on:keydown={(e) => e.key === 'Escape' && closeModal()}
	  transition:fade={{ duration: 200 }}
	><div
		role="dialog"
		aria-modal="true"
		aria-labelledby="summary-title"
		tabindex="-1"
		class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
		on:click|self={closeModal}
		on:keydown={(e) => e.key === 'Escape' && closeModal()}
		transition:fade={{ duration: 200 }}
	>
		<div role="document" class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden" transition:slide={{ duration: 300, easing: quintOut }}>
			<div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
				<h2 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
					<svg class="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					Resumen de conversación
				</h2>
				<button
					on:click={closeModal} aria-label="Cerrar resumen"
					class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
					disabled={isGenerating}
				>
					<svg class="w-5 h-5" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="p-6 space-y-6">
				{#if !conversation}
					<div class="text-center py-6">
						<div class="text-gray-400 dark:text-gray-500 mb-4" role="img" aria-label="Información">
							<svg class="w-12 h-12 mx-auto" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<p class="text-gray-600 dark:text-gray-300 mb-4">
							No se ha seleccionado ninguna conversación
						</p>
					</div>
				{:else if isGenerating}
					<!-- Generating Summary -->
					<div class="text-center space-y-4 py-4">
						<div class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
							<div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
						</div>

						<h3 class="text-lg font-medium text-gray-900 dark:text-white">
							Generando resumen con IA...
						</h3>

						<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
							<div
								class="bg-blue-600 h-2 rounded-full transition-all duration-300"
								style="width: {generationProgress}%"
							></div>
						</div>

						<p class="text-sm text-gray-600 dark:text-gray-400">
							{generationProgress}% completado - Analizando {conversation.messages.length} mensajes
						</p>
					</div>
				{:else if summary}
					<!-- Summary Display -->
					<div>
						<div class="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
							<h3 class="text-md font-medium text-gray-900 dark:text-white mb-2">
								{conversation.name}
							</h3>

							<div class="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm">
								{summary.content}
							</div>

							<div class="mt-4 text-xs text-gray-500 dark:text-gray-400">
								Generado el {formatDate(summary.createdAt)} • Confianza: {Math.round(summary.confidence * 100)}%
							</div>
						</div>

						<!-- Key Topics -->
						<div>
							<h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Temas principales
							</h4>
							<div class="flex flex-wrap gap-2 mb-4">
								{#each summary.keyTopics as topic (topic)}
                  <span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs font-medium">
                    {topic}
                  </span>
								{/each}
							</div>
						</div>

						<!-- Main Questions -->
						<div>
							<h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Principales preguntas
							</h4>
							<ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside mb-4">
								{#each summary.mainQuestions.slice(0, 5) as question (question)}
									<li class="truncate">{question}</li>
								{/each}
							</ul>
						</div>

						<!-- Documents Used -->
						{#if summary.documentsUsed.length > 0}
							<div>
								<h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Documentos referenciados
								</h4>
								<ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
									{#each summary.documentsUsed as document (document)}
										<li class="truncate">{document}</li>
									{/each}
								</ul>
							</div>
						{/if}

						<!-- Regenerate Button -->
						<div class="flex justify-end mt-6">
							<button
								on:click={generateSummary}
								class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
							>
								<svg class="w-4 h-4 mr-2" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
								Regenerar resumen
							</button>
						</div>
					</div>
				{:else if generationError}
					<!-- Error State -->
					<div class="text-center py-6">
						<div class="text-red-500 dark:text-red-400 mb-4" role="img" aria-label="Error" >
							<svg class="w-12 h-12 mx-auto" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
							Error al generar el resumen
						</h3>
						<p class="text-gray-600 dark:text-gray-300 mb-4">
							{generationError}
						</p>
						<button
							on:click={generateSummary}
							class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
						>
							Intentar nuevamente
						</button>
					</div>
				{:else if !canGenerateSummary}
					<!-- Not Enough Messages -->
					<div class="text-center py-6">
						<div class="text-yellow-500 mb-4" role="img" aria-label="Advertencia" >
							<svg class="w-12 h-12 mx-auto" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
							Conversación muy corta
						</h3>
						<p class="text-gray-600 dark:text-gray-300 mb-4">
							Esta conversación tiene muy pocos mensajes para generar un resumen útil.
							Se recomiendan al menos 5 mensajes.
						</p>
						<div class="text-sm text-gray-500 dark:text-gray-400">
							Actualmente: {conversation.messages.length} mensajes
						</div>
					</div>
				{:else}
					<!-- Generate Initial Summary -->
					<div class="text-center py-6">
						<div class="text-blue-500 dark:text-blue-400 mb-4" role="img" aria-label="Información" >
							<svg class="w-12 h-12 mx-auto" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
						<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
							No hay resumen disponible
						</h3>
						<p class="text-gray-600 dark:text-gray-300 mb-6">
							Genera un resumen automático de esta conversación usando IA para identificar los temas clave,
							principales preguntas y documentos referenciados.
						</p>
						<button
							on:click={generateSummary}
							class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
						>
							Generar resumen
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
	</div>
	</div>
{/if}

<style></style>