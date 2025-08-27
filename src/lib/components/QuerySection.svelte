<script lang="ts">
	import LoadingSvelte from '$lib/components/ui/LoadingSvelte.svelte';
	import { tick } from 'svelte';
	import ChatMessage from './ChatMessage.svelte';
	import FileUpload from './FileUpload.svelte';
	import {
		appStore,
		activeConversation,
		setQuerying,
		setError,
		addMessage,
		setSelectedFile,
		setUploading,
		setUploadStatus
	} from '$lib/stores/app';
	import { logger } from '$lib/stores/logger';
	import { uploadPDF, queryDocuments } from '$lib/services/api';

	const { question, isQuerying, isUploading, selectedFile, uploadStatus } = $derived($appStore);
	const messages = $derived($activeConversation?.messages ?? []);
	let textareaElement: HTMLTextAreaElement;
	let chatContainer: HTMLDivElement;
	let isAtBottom = $state(true);
	let showScrollButton = $state(false);

	$effect(() => {
		// Auto-scroll y detección de posición
		if (messages.length && chatContainer) {
			tick().then(() => {
				const { scrollTop, scrollHeight, clientHeight } = chatContainer;
				const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;

				if (isAtBottom || isNearBottom) {
					chatContainer.scrollTop = scrollHeight;
					showScrollButton = false;
				} else {
					showScrollButton = true;
				}
			});
		}
	});

	$effect(() => {
		// Auto-ajusta la altura del textarea cuando el texto cambia
		if (textareaElement && question) {
			textareaElement.style.height = 'auto';
			const newHeight = Math.min(textareaElement.scrollHeight, 120); // Max 120px
			textareaElement.style.height = `${newHeight}px`;
		}
	});

	function handleScroll() {
		if (!chatContainer) return;

		const { scrollTop, scrollHeight, clientHeight } = chatContainer;
		const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

		isAtBottom = distanceFromBottom < 10;
		showScrollButton = !isAtBottom && messages.length > 0;
	}

	function scrollToBottom() {
		if (chatContainer) {
			chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
			showScrollButton = false;
			isAtBottom = true;
		}
	}

	async function uploadFileIfNeeded(): Promise<boolean> {
		if (!selectedFile) return true;

		setUploading(true);
		setUploadStatus('Subiendo archivo adjunto...');
		try {
			await uploadPDF(selectedFile);
			setUploadStatus('Archivo procesado. Generando respuesta...');
			setSelectedFile(null);
			return true;
		} catch (uploadError) {
			logger.error('Error durante la subida del archivo', { error: uploadError }, 'QuerySection');
			const uploadErrorMsg = uploadError instanceof Error ? uploadError.message : 'Error al subir el archivo';
			setError(uploadErrorMsg);
			addMessage({ role: 'assistant', content: `Error al subir archivo: ${uploadErrorMsg}` });
			return false;
		} finally {
			setUploading(false);
		}
	}

	async function handleQuery() {
		if (!question.trim() || isQuerying) return;

		const currentQuestion = question.trim();
		addMessage({ role: 'user', content: currentQuestion });

		// Clear the input field immediately
		appStore.update((s) => ({ ...s, question: '' }));

		const uploadSuccessful = await uploadFileIfNeeded();
		if (!uploadSuccessful) return;

		setQuerying(true);
		setError('');

		try {
			const startTime = Date.now();
			const result = await queryDocuments(currentQuestion);
			const requestDuration = Date.now() - startTime;

			addMessage({
				role: 'assistant',
				content: result.answer
			});

			logger.info('Respuesta generada exitosamente', {
				question: currentQuestion,
				duration: `${requestDuration}ms`
			}, 'QuerySection');

		} catch (e) {
			logger.error('Error durante la consulta', { error: e }, 'QuerySection');

			const errorMsg = e instanceof Error ? e.message : 'Ocurrió un error inesperado al consultar.';
			setError(errorMsg);
			addMessage({
				role: 'assistant',
				content: `Error: ${errorMsg}`,
			});

		} finally {
			setQuerying(false);
			setUploadStatus('');
			// Auto-focus the textarea after a brief delay
			setTimeout(() => textareaElement?.focus(), 100);
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleQuery();
		}
	}

	// Calcular el número de caracteres
	const characterCount = $derived(question.length);
	const maxCharacters = 2000;
	const isOverLimit = $derived(characterCount > maxCharacters);
</script>

<div class="flex flex-col h-full bg-gradient-to-b from-stone-50/50 to-white dark:from-stone-900/50 dark:to-stone-900">
	<!-- Chat messages area -->
	<div
		bind:this={chatContainer}
		class="flex-grow overflow-y-auto p-4 space-y-6 scroll-smooth"
		onscroll={handleScroll}
	>
		{#if messages.length === 0}
			<!-- Estado vacío mejorado -->
			<div class="flex flex-col items-center justify-center h-full text-center space-y-6">
				<div class="relative">
					<div class="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-2xl flex items-center justify-center shadow-lg">
						<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
					</div>
					<!-- Efecto de pulso decorativo -->
					<div class="absolute inset-0 bg-sky-400 rounded-2xl animate-ping opacity-20"></div>
				</div>
				<div class="max-w-md space-y-2">
					<h3 class="text-xl font-semibold text-stone-900 dark:text-stone-100">
						¡Comencemos a chatear!
					</h3>
					<p class="text-stone-600 dark:text-stone-400 leading-relaxed">
						Sube un documento PDF y hazme cualquier pregunta sobre su contenido. Estoy aquí para ayudarte a entenderlo mejor.
					</p>
				</div>
			</div>
		{:else}
			{#each messages as message, i (i)}
				<ChatMessage {message} />
			{/each}
		{/if}

		<!-- Loading state mejorado -->
		{#if isQuerying}
			<div class="flex">
				<div class="max-w-xl lg:max-w-2xl">
					<LoadingSvelte
						type="thinking"
						variant="inline"
						message="Analizando tu pregunta..."
					/>
				</div>
			</div>
		{/if}

		<!-- Upload status -->
		{#if isUploading && uploadStatus}
			<div class="flex">
				<div class="max-w-xl lg:max-w-2xl">
					<LoadingSvelte
						type="uploading"
						variant="inline"
						message={uploadStatus}
					/>
				</div>
			</div>
		{/if}
	</div>

	<!-- Botón de scroll hacia abajo -->
	{#if showScrollButton}
		<div class="absolute bottom-24 right-6 z-10">
			<button
				onclick={scrollToBottom}
				class="p-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
				aria-label="Ir al final de la conversación"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
				</svg>
			</button>
		</div>
	{/if}

	<!-- Input area mejorada -->
	<div class="border-t border-stone-200 dark:border-stone-700 bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm">
		<div class="p-4 max-w-4xl mx-auto">
			<FileUpload />

			<form onsubmit={(e) => { e.preventDefault(); handleQuery(); }} class="relative">
				<div class="relative">
					<textarea
						bind:this={textareaElement}
						bind:value={$appStore.question}
						placeholder="Escribe tu pregunta aquí... (Shift + Enter para nueva línea)"
						disabled={isQuerying || isUploading}
						maxlength={maxCharacters}
						class="w-full p-4 pr-16 border-2 border-stone-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none overflow-y-auto transition-all duration-200 hover:border-stone-400 dark:hover:border-stone-500"
						rows="1"
						style="min-height: 56px;"
						onkeydown={handleKeyDown}
					></textarea>

					<!-- Botón de envío -->
					<div class="absolute right-3 bottom-3 flex items-center gap-2">
						<button
							type="submit"
							disabled={!question.trim() || isQuerying || isUploading || isOverLimit}
							class="p-2 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
						>
							{#if isQuerying || isUploading}
								<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							{:else}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
								</svg>
							{/if}
						</button>
					</div>
				</div>
			</form>

			<!-- Contador de caracteres -->
			{#if characterCount > 0}
				<div class="mt-2 text-right">
					<span class="text-xs px-2 py-1 rounded-md {isOverLimit ? 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400' : 'text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-700'}">
						{characterCount}/{maxCharacters}
					</span>
				</div>
			{/if}

			<!-- Ayuda contextual -->
			{#if !selectedFile && messages.length === 0}
				<div class="mt-2 flex items-center justify-center text-xs text-stone-500 dark:text-stone-400">
					<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					Sube un PDF primero para hacer preguntas sobre su contenido
				</div>
			{/if}
		</div>
	</div>
</div>