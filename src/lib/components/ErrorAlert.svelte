<script lang="ts">
	interface Props {
		error: string;
		onClose?: () => void;
		variant?: 'error' | 'warning' | 'info' | 'success';
		dismissible?: boolean;
		autoClose?: number; // Milisegundos para auto-cerrar
		showIcon?: boolean;
	}

	let {
		error,
		onClose,
		variant = 'error',
		dismissible = true,
		autoClose,
		showIcon = true
	}: Props = $props();

	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	const visible = $derived(!!error);

	// Auto-close functionality usando $effect
	$effect(() => {
		// Limpiar timeout anterior si existe
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}

		// Si hay error y auto-close está habilitado
		if (error && autoClose) {
			timeoutId = setTimeout(() => {
				handleClose();
				timeoutId = null;
			}, autoClose);
		}

		// Cleanup function
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
		};
	});

	function handleClose() {
		// Limpiar timeout si existe
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}

		setTimeout(() => {
			onClose?.();
		}, 150); // Wait for animation to complete
	}

	const variants = {
		error: {
			container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
			text: 'text-red-800 dark:text-red-200',
			icon: 'text-red-400 dark:text-red-300',
			button: 'text-red-400 dark:text-red-300 hover:text-red-600 dark:hover:text-red-100'
		},
		warning: {
			container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
			text: 'text-yellow-800 dark:text-yellow-200',
			icon: 'text-yellow-400 dark:text-yellow-300',
			button: 'text-yellow-400 dark:text-yellow-300 hover:text-yellow-600 dark:hover:text-yellow-100'
		},
		info: {
			container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
			text: 'text-blue-800 dark:text-blue-200',
			icon: 'text-blue-400 dark:text-blue-300',
			button: 'text-blue-400 dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-100'
		},
		success: {
			container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
			text: 'text-green-800 dark:text-green-200',
			icon: 'text-green-400 dark:text-green-300',
			button: 'text-green-400 dark:text-green-300 hover:text-green-600 dark:hover:text-green-100'
		}
	};

	const currentVariant = variants[variant];
</script>

{#if visible && error}
	<div
		class="mb-4 p-4 rounded-xl border-2 {currentVariant.container} transition-all duration-150 ease-out transform animate-in slide-in-from-top-2 fade-in shadow-sm"
		role="alert"
		aria-live="polite"
	>
		<div class="flex items-start space-x-3">
			{#if showIcon}
				<div class="flex-shrink-0 {currentVariant.icon}">
					{#if variant === 'error'}
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
						</svg>
					{:else if variant === 'warning'}
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
						</svg>
					{:else if variant === 'info'}
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
						</svg>
					{:else if variant === 'success'}
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
						</svg>
					{/if}
				</div>
			{/if}

			<div class="flex-1 min-w-0">
				<p class="text-sm font-medium {currentVariant.text} leading-relaxed">
					{error}
				</p>
			</div>

			{#if dismissible && onClose}
				<div class="flex-shrink-0">
					<button
						type="button"
						class="inline-flex rounded-lg p-1.5 {currentVariant.button} transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current"
						onclick={handleClose}
						aria-label="Cerrar alerta"
					>
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
						</svg>
					</button>
				</div>
			{/if}
		</div>

		<!-- Progress bar para auto-close -->
		{#if autoClose}
			<div class="mt-3 w-full bg-black/10 rounded-full h-1 overflow-hidden">
				<div
					class="h-full bg-current opacity-50 rounded-full animate-[shrink_{autoClose}ms_linear_forwards]"
				></div>
			</div>
		{/if}
	</div>
{/if}

<style>
    @keyframes shrink {
        from { width: 100%; }
        to { width: 0%; }
    }
</style>