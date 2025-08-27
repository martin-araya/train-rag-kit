<script lang="ts">
	import { appStore, setSelectedFile, setError } from '$lib/stores/app';
	import { logger } from '$lib/stores/logger';

	const { selectedFile, isUploading } = $derived($appStore);
	let fileInputElement: HTMLInputElement;

	function handleFileChange(event: Event) {
		setError(''); // Clear previous errors on new selection
		logger.debug('Iniciando selección de archivo', null, 'FileUpload');

		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			const file = target.files[0];

			// Validate file type
			if (file.type !== 'application/pdf') {
				logger.error('Tipo de archivo inválido', {
					fileName: file.name,
					fileType: file.type
				}, 'FileUpload');
				setError('Por favor selecciona un archivo PDF válido');
				target.value = ''; // Clear the input
				return;
			}

			// Validate file size (10MB max)
			const maxSize = 10 * 1024 * 1024; // 10MB in bytes
			if (file.size > maxSize) {
				logger.error('Archivo demasiado grande', {
					fileName: file.name,
					fileSize: file.size,
					maxSize
				}, 'FileUpload');
				setError('El archivo es demasiado grande. Máximo 10MB permitido');
				target.value = ''; // Clear the input
				return;
			}

			setSelectedFile(file);
			setError(''); // Clear any previous errors

			logger.info('Archivo seleccionado correctamente', {
				fileName: file.name,
				fileSize: file.size,
				fileType: file.type
			}, 'FileUpload');
		} else {
			logger.warn('No se seleccionó ningún archivo', null, 'FileUpload');
			setSelectedFile(null);
		}
	}

	function clearFile() {
		setSelectedFile(null);
		setError('');
		if (fileInputElement) {
			fileInputElement.value = '';
		}
		logger.debug('Archivo deseleccionado', null, 'FileUpload');
	}
</script>

<div class="mb-2">
	<label
		for="file-upload"
		class="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95"
		class:cursor-not-allowed={isUploading}
		class:opacity-50={isUploading}
		class:hover:bg-sky-600={isUploading}
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 fill-current" viewBox="0 0 20 20">
			<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
		</svg>
		Adjuntar PDF
	</label>
	<input
		bind:this={fileInputElement}
		id="file-upload"
		name="upload_file"
		type="file"
		class="hidden"
		accept=".pdf"
		onchange={handleFileChange}
		disabled={isUploading}
	/>

	{#if selectedFile}
		<div class="mt-2 flex items-center gap-3 px-3 py-3 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-lg text-sm transition-colors hover:bg-stone-100 dark:hover:bg-stone-800/70">
			<div class="flex-shrink-0">
				<svg class="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
				</svg>
			</div>
			<div class="flex-1 min-w-0">
				<div class="text-stone-900 dark:text-stone-100 font-medium truncate">{selectedFile.name}</div>
				<div class="text-stone-500 dark:text-stone-400 text-xs mt-1">
					{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • PDF
				</div>
			</div>
			{#if !isUploading}
				<button
					type="button"
					onclick={clearFile}
					class="flex-shrink-0 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
					aria-label="Remover archivo"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			{:else}
				<div class="flex-shrink-0">
					<svg class="w-4 h-4 text-sky-600 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
				</div>
			{/if}
		</div>
	{/if}
</div>