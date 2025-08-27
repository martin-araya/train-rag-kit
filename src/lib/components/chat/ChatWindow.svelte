<!-- src/lib/components/chat/ChatWindow.svelte -->
<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import { chatActions, activeConversation } from '$lib/stores/chat';
	import { queryDocuments } from '$lib/services/api';
	import { formatDistanceToNow } from 'date-fns';
	import { es } from 'date-fns/locale';

	// Props
	export let selectedModel = 'llama2';

	// Estado local
	let messageInput = '';
	let isLoading = false;
	let messagesContainer: HTMLElement;
	let textArea: HTMLTextAreaElement;
	let showTimestamps = false;
	let showSources = true;

	// Stores reactivos
	$: conversation = $activeConversation;
	$: messages = conversation?.messages || [];

	// Funciones
	async function sendMessage() {
		if (!messageInput.trim() || isLoading) return;

		const userMessage = messageInput.trim();
		messageInput = '';

		// Si no hay conversación activa, crear una nueva
		if (!conversation) {
			const name = userMessage.length > 50
				? userMessage.substring(0, 47) + '...'
				: userMessage;
			chatActions.createConversation(name);
		}

		// Agregar mensaje del usuario
		chatActions.addMessage({
			role: 'user',
			content: userMessage
		});

		// Mostrar indicador de carga
		isLoading = true;

		try {
			// Consultar documentos
			const response = await queryDocuments(userMessage, selectedModel);

			// Preparar fuentes si existen
			const sources = response.sources?.map(source => ({
				id: source.chunk_id,
				filename: source.chunk_id.split('_')[0] || 'documento',
				page: source.page,
				chunk: source.content,
				relevance: source.relevance_score
			})) || [];

			// Agregar respuesta del asistente
			chatActions.addMessage({
				role: 'assistant',
				content: response.answer,
				model: selectedModel,
				processingTime: response.metadata?.processing_time || 0,
				confidence: response.confidence_score,
				sources: sources,
				tokens: response.metadata?.tokens_used
			});

		} catch (error) {
			// Agregar mensaje de error
			chatActions.addMessage({
				role: 'assistant',
				content: `Lo siento, ha ocurrido un error al procesar tu consulta: ${error instanceof Error ? error.message : 'Error desconocido'}`,
				model: selectedModel,
				confidence: 0
			});
		} finally {
			isLoading = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function adjustTextAreaHeight() {
		if (textArea) {
			textArea.style.height = 'auto';
			textArea.style.height = Math.min(textArea.scrollHeight, 150) + 'px';
		}
	}

	function copyMessage(content: string) {
		navigator.clipboard.writeText(content);
		// Aquí podrías agregar una notificación
	}

	function toggleMessageBookmark(messageId: string) {
		// Implementar funcionalidad de bookmark para mensajes
		console.log('Toggle bookmark for message:', messageId);
	}

	function regenerateResponse(messageIndex: number) {
		if (messageIndex > 0 && messages[messageIndex - 1]?.role === 'user') {
			const userMessage = messages[messageIndex - 1].content;

			// Remover el mensaje anterior del asistente
			// Nota: Necesitarías implementar esta funcionalidad en el store

			// Regenerar respuesta
			messageInput = userMessage;
			sendMessage();
		}
	}

	function formatTimestamp(date: Date): string {
		return formatDistanceToNow(date, {
			addSuffix: true,
			locale: es
		});
	}

	function scrollToBottom() {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	// Auto-scroll cuando se agregan nuevos mensajes
	afterUpdate(() => {
		scrollToBottom();
	});

	onMount(() => {
		adjustTextAreaHeight();
	});
</script>

<div class="flex flex-col h-full bg-white dark:bg-gray-900">
	<!-- Header -->
	<header class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
		<div class="flex items-center space-x-3">
			{#if conversation}
				<div>
					<h1 class="text-lg font-semibold text-gray-900 dark:text-white">
						{conversation.name}
					</h1>
					<div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
						<span>{conversation.messages.length} mensajes</span>
						<span>Modelo: {selectedModel}</span>
						{#if conversation.metadata.totalTokens > 0}
							<span>{conversation.metadata.totalTokens.toLocaleString()} tokens</span>
						{/if}
					</div>
				</div>
			{:else}
				<div>
					<h1 class="text-lg font-semibold text-gray-900 dark:text-white">
						Nueva conversación
					</h1>
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Escribe tu primera pregunta para comenzar
					</p>
				</div>
			{/if}
		</div>

		<div class="flex items-center space-x-2">
			<button
				on:click={() => showTimestamps = !showTimestamps}
				class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
				class:bg-blue-100={showTimestamps}
				class:dark:bg-blue-900={showTimestamps}
				title="Mostrar/ocultar timestamps"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</button>

			<button
				on:click={() => showSources = !showSources}
				class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
				class:bg-blue-100={showSources}
				class:dark:bg-blue-900={showSources}
				title="Mostrar/ocultar fuentes"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
			</button>

			{#if conversation}
				<button
					class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					title="Generar resumen"
					on:click={() => conversation && chatActions.generateSummary(conversation.id)}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
					</svg>
				</button>
			{/if}
		</div>
	</header>

	<!-- Messages Area -->
	<div
		bind:this={messagesContainer}
		class="flex-1 overflow-y-auto p-6 space-y-6"
	>
		{#if messages.length === 0}
			<!-- Empty state -->
			<div class="flex flex-col items-center justify-center h-full text-center">
				<div class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
					<svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
				</div>
				<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
					¡Comienza una nueva conversación!
				</h3>
				<p class="text-gray-500 dark:text-gray-400 max-w-md">
					Haz una pregunta sobre los documentos que has subido y el asistente te ayudará a encontrar la información que necesitas.
				</p>
			</div>
		{:else}
			<!-- Messages -->
			{#each messages as message, index (message.id)}
				<div
					class="flex space-x-3"
					class:flex-row-reverse={message.role === 'user'}
				>
					<!-- Avatar -->
					<div class="flex-shrink-0">
						<div
							class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
							class:bg-blue-600={message.role === 'user'}
							class:bg-gray-600={message.role === 'assistant'}
						>
							{#if message.role === 'user'}
								👤
							{:else}
								🤖
							{/if}
						</div>
					</div>

					<!-- Message Content -->
					<div class="flex-1 min-w-0">
						<div
							class="inline-block px-4 py-2 rounded-lg max-w-3xl"
							class:bg-blue-600={message.role === 'user'}
							class:text-white={message.role === 'user'}
							class:bg-gray-100={message.role === 'assistant'}
							class:dark:bg-gray-800={message.role === 'assistant'}
							class:text-gray-900={message.role === 'assistant'}
							class:dark:text-white={message.role === 'assistant'}
						>
							<!-- Message text -->
							<div class="whitespace-pre-wrap break-words">
								{message.content}
							</div>

							<!-- Confidence indicator for assistant -->
							{#if message.role === 'assistant' && message.confidence !== undefined}
								<div class="mt-2 flex items-center space-x-2 text-xs">
									<span class="opacity-75">Confianza:</span>
									<div class="flex-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden max-w-20">
										<div
											class="h-full bg-green-500 rounded-full transition-all duration-300"
											style="width: {(message.confidence || 0) * 100}%"
										></div>
									</div>
									<span class="opacity-75">{Math.round((message.confidence || 0) * 100)}%</span>
								</div>
							{/if}
						</div>

						<!-- Message metadata -->
						<div class="flex items-center justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
							<div class="flex items-center space-x-4">
								{#if showTimestamps}
									<span>{formatTimestamp(message.timestamp)}</span>
								{/if}

								{#if message.processingTime}
									<span>{message.processingTime.toFixed(2)}s</span>
								{/if}

								{#if message.tokens}
									<span>{message.tokens} tokens</span>
								{/if}

								{#if message.model}
									<span>{message.model}</span>
								{/if}
							</div>

							<!-- Message actions -->
							<div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
								<button
									on:click={() => copyMessage(message.content)}
									class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
									title="Copiar mensaje"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
									</svg>
								</button>

								<button
									on:click={() => toggleMessageBookmark(message.id)}
									class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
									class:text-yellow-500={message.isBookmarked}
									title="Marcar mensaje"
								>
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
										<path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
									</svg>
								</button>

								{#if message.role === 'assistant'}
									<button
										on:click={() => regenerateResponse(index)}
										class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
										title="Regenerar respuesta"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
										</svg>
									</button>
								{/if}
							</div>
						</div>

						<!-- Sources -->
						{#if showSources && message.sources && message.sources.length > 0}
							<div class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
								<h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
									Fuentes ({message.sources.length})
								</h4>
								<div class="space-y-2">
									{#each message.sources.slice(0, 3) as source (source.id)}
										<div class="text-sm">
											<div class="flex items-center justify-between">
												<span class="font-medium text-blue-700 dark:text-blue-400">
													{source.filename}
													{#if source.page}
														- Página {source.page}
													{/if}
												</span>
												<span class="text-xs text-gray-500">
													{Math.round(source.relevance * 100)}% relevancia
												</span>
											</div>
											<p class="text-gray-600 dark:text-gray-300 text-xs mt-1 line-clamp-2">
												{source.chunk.substring(0, 100)}...
											</p>
										</div>
									{/each}
									{#if message.sources.length > 3}
										<button class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
											Ver {message.sources.length - 3} fuentes más
										</button>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}

			<!-- Loading indicator -->
			{#if isLoading}
				<div class="flex space-x-3">
					<div class="flex-shrink-0">
						<div class="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium">
							🤖
						</div>
					</div>
					<div class="flex-1">
						<div class="inline-block px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
							<div class="flex items-center space-x-2">
								<div class="flex space-x-1">
									<div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
									<div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
									<div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
								</div>
								<span class="text-sm text-gray-600 dark:text-gray-400">El asistente está pensando...</span>
							</div>
						</div>
					</div>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Input Area -->
	<div class="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
		<div class="flex space-x-3">
			<div class="flex-1">
				<textarea
					bind:this={textArea}
					bind:value={messageInput}
					on:keydown={handleKeyDown}
					on:input={adjustTextAreaHeight}
					placeholder="Escribe tu pregunta aquí..."
					disabled={isLoading}
					rows="1"
					class="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
				></textarea>
			</div>

			<button
				on:click={sendMessage}
				disabled={!messageInput.trim() || isLoading}
				class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
			>
				{#if isLoading}
					<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
					<span>Enviando...</span>
				{:else}
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
					</svg>
					<span>Enviar</span>
				{/if}
			</button>
		</div>

		<!-- Input hints -->
		<div class="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
			<div class="flex items-center space-x-4">
				<span>Presiona Enter para enviar, Shift+Enter para nueva línea</span>
				{#if messageInput.length > 0}
					<span>{messageInput.length}/1000 caracteres</span>
				{/if}
			</div>

			{#if conversation && conversation.metadata.messageCount > 0}
				<span>
					{conversation.metadata.messageCount} mensajes en esta conversación
				</span>
			{/if}
		</div>
	</div>
</div>

<style>
    /* Estilos personalizados */
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    /* Grupo hover para acciones de mensaje */
    .group:hover .group-hover\:opacity-100 {
        opacity: 1;
    }

    /* Animación suave para el textarea */
    textarea {
        transition: height 0.1s ease;
        max-height: 150px;
    }

    /* Scrollbar personalizado para el área de mensajes */
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

    .dark .overflow-y-auto::-webkit-scrollbar-thumb {
        background: #475569;
    }

    /* Animación para los puntos de carga */
    @keyframes bounce {
        0%, 80%, 100% {
            transform: scale(0);
        }
        40% {
            transform: scale(1);
        }
    }

    .animate-bounce {
        animation: bounce 1.4s infinite ease-in-out both;
    }
</style>