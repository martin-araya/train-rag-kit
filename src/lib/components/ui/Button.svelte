<script lang="ts">
	// Las props se declaran con "export let"
	export let variant: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled: boolean = false;
	export let loading: boolean = false;
	export let onclick: (() => void) | undefined = undefined;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let fullWidth: boolean = false;
	export let icon: boolean = false; // Para botones solo de icono
	// Renombramos 'class' para evitar conflictos con la palabra reservada
	export { className as class };
	let className: string = '';

	const baseClasses = 'inline-flex justify-center items-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden';

	const variantClasses = {
		primary: 'text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 disabled:from-slate-400 disabled:to-slate-500 shadow-lg hover:shadow-xl',
		secondary: 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-900 shadow-md hover:shadow-lg',
		danger: 'text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-500 disabled:from-slate-400 disabled:to-slate-500 shadow-lg hover:shadow-xl',
		success: 'text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:ring-green-500 disabled:from-slate-400 disabled:to-slate-500 shadow-lg hover:shadow-xl',
		ghost: 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-500 disabled:text-slate-400'
	};

	const sizeClasses = {
		sm: icon ? 'p-2' : 'px-4 py-2 text-sm',
		md: icon ? 'p-2.5' : 'px-6 py-2.5 text-base',
		lg: icon ? 'p-3' : 'px-8 py-3 text-lg'
	};

	// Se usa una variable reactiva ($:) para que las clases se actualicen si las props cambian
	$: classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`;
</script>

<button
	{type}
	class={classes}
	disabled={disabled || loading}
	on:click={onclick}
>
	{#if loading}
		<div class="absolute inset-0 flex items-center justify-center">
			<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
		</div>
		<span class="opacity-0">
			<slot />
		</span>
	{:else}
		<slot />
	{/if}

	<!-- Efecto de brillo en hover -->
	{#if !disabled && !loading && variant !== 'ghost' && variant !== 'secondary'}
		<div class="absolute inset-0 opacity-0 hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full"></div>
	{/if}
</button>