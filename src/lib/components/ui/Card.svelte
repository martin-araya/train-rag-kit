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

	const baseClasses = 'rounded-2xl transition-all duration-300';

	const variantClasses = {
		default: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm',
		elevated: 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700',
		outlined: 'bg-transparent border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500',
		glass: 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl'
	};

	const paddingClasses = {
		none: '',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8'
	};

	const hoverClasses = hoverable ? 'hover:shadow-2xl hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60 hover:-translate-y-1 cursor-pointer' : '';

	const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`;
</script>

<section class={classes}>
	{#if title || subtitle}
		<header class="mb-6 {padding === 'none' ? 'px-6 pt-6' : ''}">
			{#if title}
				<h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
					{title}
				</h2>
			{/if}
			{#if subtitle}
				<p class="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
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