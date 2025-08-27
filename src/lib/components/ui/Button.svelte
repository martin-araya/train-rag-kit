<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		disabled?: boolean;
		loading?: boolean;
		onclick?: (event: MouseEvent) => void;
		type?: 'button' | 'submit' | 'reset';
		fullWidth?: boolean;
		icon?: boolean; // Para botones solo de icono
		rounded?: boolean; // Para botones circulares
		pulse?: boolean; // Efecto de pulso para llamar atención
		tooltip?: string; // Tooltip integrado
		href?: string; // Para comportarse como link
		target?: string; // Target del link
		loadingText?: string; // Texto personalizado durante carga
		class?: string;
		children?: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		onclick,
		type = 'button',
		fullWidth = false,
		icon = false,
		rounded = false,
		pulse = false,
		tooltip,
		href,
		target,
		loadingText,
		class: className = '',
		children
	}: Props = $props();

	let buttonElement: HTMLElement;
	let showTooltip = $state(false);
	let ripples = $state<Array<{ id: number; x: number; y: number }>>([]);
	let rippleCounter = $state(0);

	const baseClasses = 'inline-flex justify-center items-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden select-none';

	const variantClasses = {
		primary: 'text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-600 focus:ring-sky-500 disabled:bg-stone-400 shadow-lg hover:shadow-xl',
		secondary: 'text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 hover:border-stone-300 dark:hover:border-stone-500 focus:ring-sky-500 disabled:bg-stone-100 dark:disabled:bg-stone-900 shadow-md hover:shadow-lg',
		outline: 'text-sky-600 dark:text-sky-400 bg-transparent border-2 border-sky-600 dark:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 focus:ring-sky-500 disabled:border-stone-300 disabled:text-stone-400',
		danger: 'text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-500 disabled:from-stone-400 disabled:to-stone-500 shadow-lg hover:shadow-xl',
		success: 'text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:ring-emerald-500 disabled:from-stone-400 disabled:to-stone-500 shadow-lg hover:shadow-xl',
		ghost: 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 focus:ring-stone-500 disabled:text-stone-400'
	};

	const sizeClasses = {
		xs: icon ? 'p-1' : 'px-2 py-1 text-xs',
		sm: icon ? 'p-2' : 'px-4 py-2 text-sm',
		md: icon ? 'p-2.5' : 'px-6 py-2.5 text-base',
		lg: icon ? 'p-3' : 'px-8 py-3 text-lg',
		xl: icon ? 'p-4' : 'px-10 py-4 text-xl'
	};

	const roundedClasses = $derived(() => {
		if (rounded || icon) return 'rounded-full';
		return 'rounded-xl';
	});

	const pulseClasses = pulse && !disabled && !loading ? 'animate-pulse' : '';

	const classes = $derived(`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${roundedClasses()} ${pulseClasses} ${fullWidth ? 'w-full' : ''} ${className}`);

	function handleClick(event: MouseEvent) {
		if (disabled || loading) return;

		// Efecto ripple
		createRipple(event);

		// Llamar al onclick si existe
		onclick?.(event);

		// Si es un link, navegarlo
		if (href) {
			if (target === '_blank') {
				window.open(href, '_blank');
			} else {
				window.location.href = href;
			}
		}
	}

	function createRipple(event: MouseEvent) {
		if (!buttonElement) return;

		const rect = buttonElement.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		const newRipple = { id: rippleCounter++, x, y };
		ripples = [...ripples, newRipple];

		// Remover el ripple después de la animación
		setTimeout(() => {
			ripples = ripples.filter(r => r.id !== newRipple.id);
		}, 600);
	}

	function handleKeyDown(event: KeyboardEvent) {
		// Activar con Enter o Space
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (!disabled && !loading) {
				const syntheticEvent = new MouseEvent('click', {
					bubbles: true,
					cancelable: true,
					clientX: buttonElement.offsetLeft + buttonElement.offsetWidth / 2,
					clientY: buttonElement.offsetTop + buttonElement.offsetHeight / 2
				});
				handleClick(syntheticEvent);
			}
		}
	}
</script>

{#if href && !disabled && !loading}
	<!-- Versión como enlace -->
	<a
		{href}
		{target}
		bind:this={buttonElement}
		class={classes}
		role="button"
		tabindex="0"
		onmouseenter={() => tooltip && (showTooltip = true)}
		onmouseleave={() => showTooltip = false}
		onclick={handleClick}
		onkeydown={handleKeyDown}
	>
		{@render children?.()}

		<!-- Tooltip -->
		{#if tooltip && showTooltip}
			<div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-stone-900 dark:bg-stone-700 rounded whitespace-nowrap z-50">
				{tooltip}
				<div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-stone-900 dark:border-t-stone-700"></div>
			</div>
		{/if}

		<!-- Ripple effects -->
		{#each ripples as ripple (ripple.id)}
      <span
				class="absolute animate-ping rounded-full bg-white/30 pointer-events-none"
				style="left: {ripple.x}px; top: {ripple.y}px; width: 4px; height: 4px; transform: translate(-50%, -50%);"
			></span>
		{/each}
	</a>
{:else}
	<!-- Versión como botón -->
	<button
		{type}
		bind:this={buttonElement}
		class={classes}
		disabled={disabled || loading}
		onmouseenter={() => tooltip && (showTooltip = true)}
		onmouseleave={() => showTooltip = false}
		onclick={handleClick}
		onkeydown={handleKeyDown}
	>
		{#if loading}
			<div class="absolute inset-0 flex items-center justify-center">
				<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
					<path class="opacity-75 fill-current" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
				</svg>
			</div>
			<span class="opacity-0">
      {loadingText || 'Cargando...'}
     </span>
		{:else}
			{@render children?.()}
		{/if}

		<!-- Tooltip -->
		{#if tooltip && showTooltip && !loading}
			<div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-stone-900 dark:bg-stone-700 rounded whitespace-nowrap z-50 animate-in fade-in duration-200">
				{tooltip}
				<div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-stone-900 dark:border-t-stone-700"></div>
			</div>
		{/if}

		<!-- Ripple effects -->
		{#each ripples as ripple (ripple.id)}
      <span
				class="absolute animate-ping rounded-full bg-white/30 pointer-events-none"
				style="left: {ripple.x}px; top: {ripple.y}px; width: 4px; height: 4px; transform: translate(-50%, -50%);"
			></span>
		{/each}

		<!-- Efecto de brillo en hover -->
		{#if !disabled && !loading && variant !== 'ghost' && variant !== 'secondary' && variant !== 'outline'}
			<div class="absolute inset-0 opacity-0 hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full"></div>
		{/if}
	</button>
{/if}