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
		class="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
		class:cursor-not-allowed={isUploading}
		class:opacity-50={isUploading}
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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
		<div class="mt-2 flex items-center gap-2 pl-3 pr-2 py-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-sm">
			<svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clip-rule="evenodd"></path>
			</svg>
			<div class="flex-1">
				<div class="text-blue-800 dark:text-blue-200 font-medium">{selectedFile.name}</div>
				<div class="text-blue-600 dark:text-blue-300 text-xs">
					{(selectedFile.size / 1024 / 1024).toFixed(2)} MB
				</div>
			</div>
			{#if !isUploading}
				<button
					type="button"
					onclick={clearFile}
					class="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
					aria-label="Remover archivo"
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
					</svg>
				</button>
			{/if}
		</div>
	{/if}
</div>