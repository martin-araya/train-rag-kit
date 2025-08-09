<script lang="ts">
	import type { Message } from '$lib/types';

	let { message }: { message: Message } = $props();

	const isUser = message.role === 'user';
</script>

<div class="flex items-start gap-3" class:flex-row-reverse={isUser}>
	<!-- Avatar -->
	<div
		class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
		class:bg-blue-500={isUser}
		class:bg-green-500={!isUser}
	>
		{#if isUser}
			<!-- User Icon -->
			<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
			</svg>
		{:else}
			<!-- Assistant Icon -->
			<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
			</svg>
		{/if}
	</div>

	<!-- Bubble -->
	<div
		class="max-w-xl lg:max-w-2xl px-4 py-3 rounded-2xl"
		class:bg-blue-600={isUser}
		class:text-white={isUser}
		class:bg-gray-200={!isUser}
		class:dark:bg-slate-700={!isUser}
		class:text-gray-800={!isUser}
		class:dark:text-slate-200={!isUser}
	>
		<p class="text-sm whitespace-pre-wrap">{message.content}</p>
		{#if message.timestamp}
			<div class="text-xs opacity-70 mt-1" class:text-right={isUser}>
				{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
			</div>
		{/if}
	</div>
</div>