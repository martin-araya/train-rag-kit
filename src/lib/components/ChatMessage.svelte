<script lang="ts">
	import type { Message } from '$lib/types';
	import { tick } from 'svelte';

	let { message }: { message: Message } = $props();

	const isUser = message.role === 'user';
	let isMessageVisible = $state(false);
	let messageElement: HTMLDivElement;
	let showCopyButton = $state(false);
	let copied = $state(false);

	// Animación de entrada
	$effect(() => {
		if (messageElement) {
			tick().then(() => {
				isMessageVisible = true;
			});
		}
	});

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(message.content);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (err) {
			console.error('Error al copiar:', err);
		}
	}

	interface TextSegment {
		type: 'text' | 'bold' | 'italic' | 'code';
		content: string;
	}

	function parseContent(content: string): TextSegment[] {
		const segments: TextSegment[] = [];
		let currentIndex = 0;

		// Regex patterns for different markdown elements
		const patterns = [
			{ type: 'bold' as const, regex: /\*\*(.*?)\*\*/g },
			{ type: 'italic' as const, regex: /\*(.*?)\*/g },
			{ type: 'code' as const, regex: /`(.*?)`/g }
		];

		// Find all matches
		const matches: Array<{ type: TextSegment['type']; start: number; end: number; content: string; fullMatch: string }> = [];

		patterns.forEach(pattern => {
			let match;
			const regex = new RegExp(pattern.regex);
			while ((match = regex.exec(content)) !== null) {
				matches.push({
					type: pattern.type,
					start: match.index,
					end: match.index + match[0].length,
					content: match[1],
					fullMatch: match[0]
				});
			}
		});

		// Sort matches by position
		matches.sort((a, b) => a.start - b.start);

		// Process segments
		matches.forEach(match => {
			// Add text before match
			if (match.start > currentIndex) {
				const textBefore = content.slice(currentIndex, match.start);
				if (textBefore) {
					segments.push({ type: 'text', content: textBefore });
				}
			}

			// Add the formatted match
			segments.push({ type: match.type, content: match.content });
			currentIndex = match.end;
		});

		// Add remaining text
		if (currentIndex < content.length) {
			segments.push({ type: 'text', content: content.slice(currentIndex) });
		}

		// If no matches found, return the whole content as text
		if (segments.length === 0) {
			segments.push({ type: 'text', content });
		}

		return segments;
	}

	const contentSegments = $derived(parseContent(message.content));
</script>

<div
	bind:this={messageElement}
	class="flex items-start gap-4 opacity-0 transform translate-y-2 transition-all duration-500 ease-out"
	class:opacity-100={isMessageVisible}
	class:translate-y-0={isMessageVisible}
	class:flex-row-reverse={isUser}
	onmouseenter={() => showCopyButton = true}
	onmouseleave={() => showCopyButton = false}
>
	<!-- Avatar mejorado -->
	<div
		class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md transition-all duration-200"
		class:bg-gradient-to-br={true}
		class:from-sky-500={isUser}
		class:to-sky-600={isUser}
		class:from-stone-600={!isUser}
		class:to-stone-700={!isUser}
		class:hover:scale-105={true}
	>
		{#if isUser}
			<!-- User Icon -->
			<svg class="w-5 h-5 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
			</svg>
		{:else}
			<!-- Assistant Icon - Robot/AI -->
			<svg class="w-5 h-5 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
			</svg>
		{/if}
	</div>

	<!-- Message bubble mejorado -->
	<div class="group relative max-w-3xl">
		<div
			class="px-5 py-4 rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md relative"
			class:bg-sky-600={isUser}
			class:text-white={isUser}
			class:border-sky-700={isUser}
			class:bg-white={!isUser}
			class:dark:bg-stone-800={!isUser}
			class:text-stone-900={!isUser}
			class:dark:text-stone-100={!isUser}
			class:border-stone-200={!isUser}
			class:dark:border-stone-700={!isUser}
			class:hover:border-stone-300={!isUser}
			class:dark:hover:border-stone-600={!isUser}
		>
			<!-- Contenido del mensaje con formateo seguro -->
			<div class="text-sm leading-relaxed whitespace-pre-wrap break-words">
				{#each contentSegments as segment, i (i)}
					{#if segment.type === 'bold'}
						<strong class="font-semibold">{segment.content}</strong>
					{:else if segment.type === 'italic'}
						<em class="italic">{segment.content}</em>
					{:else if segment.type === 'code'}
						<code class="bg-stone-100 dark:bg-stone-700 px-1 py-0.5 rounded text-xs font-mono text-stone-900 dark:text-stone-100">
							{segment.content}
						</code>
					{:else}
						{segment.content}
					{/if}
				{/each}
			</div>

			<!-- Timestamp y metadatos -->
			{#if message.timestamp}
				<div class="flex items-center justify-between mt-3 pt-2 border-t border-current/10">
					<div class="text-xs opacity-70" class:text-right={isUser}>
						{new Date(message.timestamp).toLocaleTimeString([], {
							hour: '2-digit',
							minute: '2-digit',
							hour12: false
						})}
					</div>

					<!-- Indicador de estado para mensajes del usuario -->
					{#if isUser}
						<div class="flex items-center gap-1">
							<div class="w-1 h-1 bg-current rounded-full opacity-70"></div>
							<div class="w-1 h-1 bg-current rounded-full opacity-50"></div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Botón de copiar -->
		{#if !isUser && (showCopyButton || copied)}
			<div class="absolute top-2 right-2 transition-all duration-200"
					 class:opacity-0={!showCopyButton && !copied}
					 class:opacity-100={showCopyButton || copied}>
				<button
					onclick={copyToClipboard}
					class="p-2 rounded-lg bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-all duration-200 shadow-sm hover:shadow-md"
					aria-label="Copiar mensaje"
					title={copied ? "¡Copiado!" : "Copiar mensaje"}
				>
					{#if copied}
						<svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					{:else}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
						</svg>
					{/if}
				</button>
			</div>
		{/if}

		<!-- Efecto de brillo sutil -->
		<div class="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
	</div>
</div>

<style>
    /* Estilos ya aplicados directamente en las clases de Tailwind */
</style>