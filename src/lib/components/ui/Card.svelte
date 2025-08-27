<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		subtitle?: string;
		class?: string;
		variant?: 'default' | 'elevated' | 'outlined' | 'glass';
		padding?: 'none' | 'sm' | 'md' | 'lg';
		hoverable?: boolean;
		children?: Snippet;
	}

	let {
		title,
		subtitle,
		class: className = '',
		variant = 'default',
		padding = 'md',
		hoverable = false,
		children
	}: Props = $props();

	const baseClasses = 'rounded-2xl transition-all duration-300 relative';

	const variantClasses = {
		default: 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm',
		elevated: 'bg-white dark:bg-stone-800 shadow-xl shadow-stone-200/50 dark:shadow-stone-900/50 border border-stone-100 dark:border-stone-700',
		outlined: 'bg-transparent border-2 border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500',
		glass: 'bg-white/80 dark:bg-stone-800/80 backdrop-blur-xl border border-white/20 dark:border-stone-700/50 shadow-2xl'
	};

	const paddingClasses = {
		none: '',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8'
	};

	const hoverClasses = hoverable ? 'hover:shadow-2xl hover:shadow-stone-200/60 dark:hover:shadow-stone-900/60 hover:-translate-y-1 cursor-pointer' : '';

	const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`;
</script>

<section class={classes}>
	{#if title || subtitle}
		<header class="mb-6 {padding === 'none' ? 'px-6 pt-6' : ''}">
			{#if title}
				<h2 class="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2 bg-gradient-to-r from-stone-900 to-stone-700 dark:from-stone-100 dark:to-stone-200 bg-clip-text text-transparent">
					{title}
				</h2>
			{/if}
			{#if subtitle}
				<p class="text-stone-600 dark:text-stone-400 text-base leading-relaxed">
					{subtitle}
				</p>
			{/if}
		</header>
	{/if}

	<div class="{padding === 'none' && (title || subtitle) ? 'px-6 pb-6' : ''}">
		{@render children?.()}
	</div>

	<!-- Efecto de brillo decorativo -->
	{#if variant === 'glass' || variant === 'elevated'}
		<div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
	{/if}
</section>