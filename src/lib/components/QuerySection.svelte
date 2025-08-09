<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { tick } from 'svelte';
	import ChatMessage from './ChatMessage.svelte';
	import FileUpload from './FileUpload.svelte';
	import {
		appStore,
		setQuerying,
		setError,
		addMessage,
		setSelectedFile,
		setUploading,
		setUploadStatus
	} from '$lib/stores/app';
	import { logger } from '$lib/stores/logger';
	import { uploadPDF, queryDocuments } from '$lib/services/api';

	const { messages, question, isQuerying, isUploading, selectedFile } = $derived($appStore);
	let textareaElement: HTMLTextAreaElement;
	let chatContainer: HTMLDivElement;

	$effect(() => {
		// Este efecto se ejecuta cada vez que `messages` cambia.
		// Usamos `tick()` para esperar a que el DOM se actualice antes de hacer scroll.
		if (messages.length && chatContainer) {
			tick().then(() => {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			});
		}
	});

	$effect(() => {
		// Auto-ajusta la altura del textarea cuando el texto cambia
		if (textareaElement) {
			textareaElement.style.height = 'auto'; // Resetea para que pueda encogerse
			textareaElement.style.height = `${textareaElement.scrollHeight}px`;
		}
	});

	async function uploadFileIfNeeded(): Promise<boolean> {
		if (!selectedFile) return true; // No hay archivo para subir, proceder.

		setUploading(true);
		setUploadStatus('Subiendo archivo adjunto...');
		try {
			await uploadPDF(selectedFile);
			setUploadStatus('Archivo procesado. Ahora generando respuesta...');
			setSelectedFile(null); // Limpiar después de subir
			return true;
		} catch (uploadError) {
			logger.error('Error durante la subida del archivo', { error: uploadError }, 'QuerySection');
			const uploadErrorMsg = uploadError instanceof Error ? uploadError.message : 'Error al subir el archivo';
			setError(uploadErrorMsg);
			addMessage({ role: 'assistant', content: `Error al subir archivo: ${uploadErrorMsg}` });
			return false; // Indicar que la subida falló
		} finally {
			setUploading(false);
		}
	}

	async function handleQuery() {
		if (!question.trim() || isQuerying) return;

		const currentQuestion = question;
		addMessage({ role: 'user', content: currentQuestion });

		// Clear the input field immediately
		appStore.update((s) => ({ ...s, question: '' }));

		const uploadSuccessful = await uploadFileIfNeeded();
		if (!uploadSuccessful) return; // Detener si la subida del archivo falló

		setQuerying(true);
		setError('');

		try {
			const startTime = Date.now();
			const result = await queryDocuments(currentQuestion);
			const requestDuration = Date.now() - startTime;

			addMessage({ role: 'assistant', content: result.answer });

			logger.info('Respuesta generada exitosamente', {
				question: currentQuestion,
				duration: `${requestDuration}ms`
			}, 'QuerySection');

		} catch (e) {
			logger.error('Error durante la consulta', { error: e }, 'QuerySection');

			const errorMsg = e instanceof Error ? e.message : 'Ocurrió un error inesperado al consultar.';
			setError(errorMsg);
			addMessage({ role: 'assistant', content: `Error: ${errorMsg}` });

		} finally {
			setQuerying(false);
			setUploadStatus(''); // Clear upload status when done
			// Refocus the textarea
			textareaElement?.focus();
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleQuery();
		}
	}
</script>

<div class="flex flex-col h-full">
	<!-- Chat messages area -->
	<div bind:this={chatContainer} class="flex-grow overflow-y-auto p-4 space-y-4">
		{#each messages as message, i (i)}
			<ChatMessage {message} />
		{/each}
		{#if isQuerying}
			<div class="flex">
				<div class="max-w-xl lg:max-w-2xl px-4 py-3 rounded-2xl bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200">
					<div class="flex items-center space-x-2">
						<div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
						<div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style="animation-delay: 0.2s;"></div>
						<div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style="animation-delay: 0.4s;"></div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Input area -->
	<div class="p-4 border-t border-slate-200 dark:border-slate-700">
		<FileUpload />
		<form onsubmit={(e) => { e.preventDefault(); handleQuery(); }} class="relative">
			<textarea
				bind:this={textareaElement}
				bind:value={$appStore.question}
				placeholder="Haz una pregunta sobre tus documentos..."
				disabled={isQuerying || isUploading}
				class="w-full p-3 pr-28 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-y-hidden"
				rows="1"
				onkeydown={handleKeyDown}
			></textarea>
			<div class="absolute right-2 bottom-2 flex items-center">
				<Button type="submit" disabled={!question.trim() || isQuerying || isUploading}>
					Enviar
				</Button>
			</div>
		</form>
	</div>
</div>