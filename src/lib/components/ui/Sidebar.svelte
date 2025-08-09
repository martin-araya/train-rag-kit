<script lang="ts">
	import { appStore, clearMessages, startNewSession } from '$lib/stores/app';
	import { getOllamaModels, setActiveModel, checkOllamaHealth } from '$lib/services/api';
	import { onMount } from 'svelte';

	interface OllamaModel {
		name: string;
		size: number;
		digest: string;
		modified_at: string;
		details?: {
			family?: string;
			parameter_size?: string;
			format?: string;
			quantization_level?: string;
		};
	}

	const { messages, sessionId, isConnected } = $derived($appStore);

	let isCollapsed = $state(false);
	let availableModels = $state<OllamaModel[]>([]);
	let selectedEmbeddingModel = $state('granite-embedding:278m');
	let selectedGenerationModel = $state('llama3.2:3b-instruct-q6_K');
	let loadingModels = $state(false);
	let showModelConfig = $state(false);
	let ollamaHealthy = $state(false);
	let updatingModels = $state(false);

	onMount(async () => {
		await loadModels();
		await checkOllama();
	});

	async function loadModels() {
		loadingModels = true;
		try {
			const models = await getOllamaModels();
			availableModels = models;
		} catch (error) {
			console.error('Error loading models:', error);
		} finally {
			loadingModels = false;
		}
	}

	async function checkOllama() {
		try {
			ollamaHealthy = await checkOllamaHealth();
		} catch (error) {
			console.error('Error checking Ollama health:', error);
			ollamaHealthy = false;
		}
	}

	async function updateModels() {
		updatingModels = true;
		try {
			await setActiveModel(selectedGenerationModel);
			showModelConfig = false;
		} catch (error) {
			console.error('Error updating models:', error);
		} finally {
			updatingModels = false;
		}
	}

	function handleNewChat() {
		clearMessages();
		startNewSession();
	}

	function formatModelName(name: string) {
		return name.replace(/[:-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
	}

	function getModelType(name: string) {
		if (name.includes('embedding')) return 'embedding';
		if (name.includes('instruct') || name.includes('chat')) return 'generation';
		return 'general';
	}

	function formatModelSize(bytes: number): string {
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		if (bytes === 0) return '0 B';
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
	}

	const embeddingModels = $derived(availableModels.filter(m => getModelType(m.name) === 'embedding'));
	const generationModels = $derived(availableModels.filter(m => getModelType(m.name) === 'generation' || getModelType(m.name) === 'general'));
</script>

<!-- Sidebar -->
<aside class="flex flex-col h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 {isCollapsed ? 'w-16' : 'w-80'}">
	<!-- Header del Sidebar -->
	<header class="p-4 border-b border-slate-200 dark:border-slate-700">
		<div class="flex items-center justify-between">
			{#if !isCollapsed}
				<h2 class="text-lg font-semibold text-slate-900 dark:text-white">Panel de Control</h2>
			{/if}
			<button
				onclick={() => isCollapsed = !isCollapsed}
				class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
				aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
			>
				<svg class="w-5 h-5 text-slate-600 dark:text-slate-400 transform transition-transform {isCollapsed ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>
		</div>
	</header>

	<!-- Contenido del Sidebar -->
	<div class="flex-1 overflow-y-auto p-4 space-y-4">
		{#if !isCollapsed}
			<!-- Estado de Conexión -->
			<div class="rounded-xl p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
				<h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">Estado del Sistema</h3>
				<div class="space-y-3">
					<div class="flex items-center gap-3">
						<div class="w-3 h-3 rounded-full {isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}"></div>
						<div>
							<p class="text-sm font-medium text-slate-900 dark:text-white">
								{isConnected ? 'API Conectada' : 'API Desconectada'}
							</p>
							<p class="text-xs text-slate-500 dark:text-slate-400">
								Backend RAG
							</p>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<div class="w-3 h-3 rounded-full {ollamaHealthy ? 'bg-green-500' : 'bg-orange-500'}"></div>
						<div>
							<p class="text-sm font-medium text-slate-900 dark:text-white">
								{ollamaHealthy ? 'Ollama Activo' : 'Ollama Inactivo'}
							</p>
							<p class="text-xs text-slate-500 dark:text-slate-400">
								{availableModels.length} modelos
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Estadísticas de la Sesión -->
			<div class="rounded-xl p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
				<h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-2">Sesión Actual</h3>
				<div class="space-y-2 text-xs text-slate-600 dark:text-slate-400">
					<div class="flex justify-between">
						<span>Mensajes:</span>
						<span class="font-medium">{messages.length}</span>
					</div>
					<div class="flex justify-between">
						<span>ID:</span>
						<span class="font-mono text-xs">{sessionId.slice(-8)}</span>
					</div>
				</div>
			</div>

			<!-- Acciones Rápidas -->
			<div class="rounded-xl p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
				<h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">Acciones</h3>
				<div class="space-y-2">
					<button
						class="w-full inline-flex justify-center items-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:transform-none text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-900 shadow-md hover:shadow-lg px-4 py-2 text-sm"
						onclick={handleNewChat}
						disabled={messages.length === 0}
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
						Nuevo Chat
					</button>

					<button
						class="w-full inline-flex justify-center items-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-500 disabled:text-slate-400 px-4 py-2 text-sm"
						onclick={() => showModelConfig = !showModelConfig}
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						Configurar Modelos
					</button>

					<button
						class="w-full inline-flex justify-center items-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-500 disabled:text-slate-400 px-4 py-2 text-sm"
						onclick={loadModels}
						disabled={loadingModels}
					>
						<svg class="w-4 h-4 mr-2 {loadingModels ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						{loadingModels ? 'Cargando...' : 'Actualizar Modelos'}
					</button>
				</div>
			</div>

			<!-- Configuración de Modelos -->
			{#if showModelConfig}
				<div class="rounded-xl p-4 bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700">
					<h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">Modelos de Ollama</h3>

					{#if availableModels.length === 0 && !loadingModels}
						<p class="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
							No se encontraron modelos. Asegúrate de que Ollama esté ejecutándose.
						</p>
					{:else}
						<div class="space-y-4">
							<!-- Modelo de Embeddings -->
							<div>
								<label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
									Modelo de Embeddings
								</label>
								<select
									bind:value={selectedEmbeddingModel}
									class="w-full text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
								>
									{#each embeddingModels as model (model.digest)}
									<option value={model.name}>{formatModelName(model.name)} ({formatModelSize(model.size)})</option>
									{/each}
									{#if embeddingModels.length === 0}
										<option value={selectedEmbeddingModel}>{formatModelName(selectedEmbeddingModel)} (actual)</option>
									{/if}
								</select>
							</div>

							<!-- Modelo de Generación -->
							<div>
								<label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
									Modelo de Generación
								</label>
								<select
									bind:value={selectedGenerationModel}
									class="w-full text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
								>
									{#each generationModels as model (model.digest)}
										<option value={model.name}>{formatModelName(model.name)} ({formatModelSize(model.size)})</option>
									{/each}
									{#if generationModels.length === 0}
										<option value={selectedGenerationModel}>{formatModelName(selectedGenerationModel)} (actual)</option>
									{/if}
								</select>
							</div>

							<button
								class="w-full inline-flex justify-center items-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:transform-none text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 disabled:from-slate-400 disabled:to-slate-500 shadow-lg hover:shadow-xl px-4 py-2 text-sm"
								onclick={updateModels}
								disabled={updatingModels}
							>
								{#if updatingModels}
									<svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Aplicando...
								{:else}
									Aplicar Cambios
								{/if}
							</button>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Lista de Modelos Disponibles -->
			{#if availableModels.length > 0 && !showModelConfig}
				<div class="rounded-xl p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
					<h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-2">Modelos Detectados</h3>
					<div class="space-y-1 max-h-32 overflow-y-auto">
						{#each availableModels.slice(0, 5) as model (model.digest)}
							<div class="flex items-center gap-2 text-xs">
								<div class="w-2 h-2 rounded-full {getModelType(model.name) === 'embedding' ? 'bg-blue-400' : getModelType(model.name) === 'generation' ? 'bg-green-400' : 'bg-gray-400'}"></div>
								<span class="text-slate-600 dark:text-slate-400 truncate flex-1">{formatModelName(model.name)}</span>
								<span class="text-slate-500 dark:text-slate-500 text-xs">{formatModelSize(model.size)}</span>
							</div>
						{/each}
						{#if availableModels.length > 5}
							<p class="text-xs text-slate-500 dark:text-slate-400 text-center pt-1">
								+{availableModels.length - 5} más...
							</p>
						{/if}
					</div>
				</div>
			{/if}

		{:else}
			<!-- Versión colapsada -->
			<div class="space-y-3">
				<button
					onclick={handleNewChat}
					class="w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
					title="Nuevo Chat"
				>
					<svg class="w-5 h-5 mx-auto text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
					</svg>
				</button>

				<button
					onclick={() => showModelConfig = !showModelConfig}
					class="w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
					title="Configurar Modelos"
				>
					<svg class="w-5 h-5 mx-auto text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				</button>

				<div class="w-full h-px bg-slate-200 dark:bg-slate-700"></div>

				<div class="flex flex-col items-center gap-1">
					<div class="w-3 h-3 rounded-full {isConnected ? 'bg-green-500' : 'bg-red-500'}"></div>
					<div class="w-2 h-2 rounded-full {ollamaHealthy ? 'bg-green-400' : 'bg-orange-400'}"></div>
					<span class="text-xs text-slate-500 dark:text-slate-400">{messages.length}</span>
				</div>
			</div>
		{/if}
	</div>
</aside>