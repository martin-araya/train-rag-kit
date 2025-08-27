<script lang="ts">
	interface Props {
		error: string;
		onClose?: () => void;
		variant?: 'error' | 'warning' | 'info' | 'success';
		dismissible?: boolean;
		autoClose?: number; // Milisegundos para auto-cerrar
		showIcon?: boolean;
		actions?: Array<{ label: string; action: () => void; variant?: 'primary' | 'secondary' }>;
	}

	let {
		error,
		onClose,
		variant = 'error',
		dismissible = true,
		autoClose,
		showIcon = true,
		actions = []
	}: Props = $props();

	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let progressWidth = $state(100);
	let isClosing = $state(false);

	const visible = $derived(!!error && !isClosing);

	// Auto-close functionality y animación de progreso
	$effect(() => {
		// Reset states
		isClosing = false;
		progressWidth = 100;

		// Limpiar timeout anterior si existe
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}

		// Si hay error y auto-close está habilitado
		if (error && autoClose) {
			// Animación de la barra de progreso
			const startTime = Date.now();
			const updateProgress = () => {
				const elapsed = Date.now() - startTime;
				const remaining = Math.max(0, (autoClose - elapsed) / autoClose);
				progressWidth = remaining * 100;

				if (remaining > 0) {
					requestAnimationFrame(updateProgress);
				}
			};
			updateProgress();

			// Timer para cerrar
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
		isClosing = true;

		// Limpiar timeout si existe
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}

		// Delay para permitir la animación de salida
		setTimeout(() => {
			onClose?.();
		}, 200);
	}

	function pauseAutoClose() {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	}

	function resumeAutoClose() {
		if (error && autoClose && !timeoutId) {
			const remainingTime = (progressWidth / 100) * autoClose;
			if (remainingTime > 0) {
				timeoutId = setTimeout(() => {
					handleClose();
					timeoutId = null;
				}, remainingTime);
			}
		}
	}

	const variants = {
		error: {
			container: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800/50',
			text: 'text-red-900 dark:text-red-100',
			icon: 'text-red-500 dark:text-red-400',
			button: 'text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/30',
			progress: 'bg-red-500/60'
		},
		warning: {
			container: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/50',
			text: 'text-amber-900 dark:text-amber-100',
			icon: 'text-amber-500 dark:text-amber-400',
			button: 'text-amber-500 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30',
			progress: 'bg-amber-500/60'
		},
		info: {
			container: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800/50',
			text: 'text-sky-900 dark:text-sky-100',
			icon: 'text-sky-500 dark:text-sky-400',
			button: 'text-sky-500 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-900/30',
			progress: 'bg-sky-500/60'
		},
		success: {
			container: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/50',
			text: 'text-emerald-900 dark:text-emerald-100',
			icon: 'text-emerald-500 dark:text-emerald-400',
			button: 'text-emerald-500 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
			progress: 'bg-emerald-500/60'
		}
	};

	const currentVariant = variants[variant];
</script>

{#if visible && error}
	<div
		class="mb-4 rounded-xl border-2 {currentVariant.container} shadow-lg backdrop-blur-sm transition-all duration-200 ease-out transform"
		class:animate-in={!isClosing}
		class:slide-in-from-top-2={!isClosing}
		class:fade-in={!isClosing}
		class:animate-out={isClosing}
		class:slide-out-to-top-2={isClosing}
		class:fade-out={isClosing}
		role="alert"
		aria-live="assertive"
		onmouseenter={pauseAutoClose}
		onmouseleave={resumeAutoClose}
	>
		<div class="p-4">
			<div class="flex items-start space-x-3">
				{#if showIcon}
					<div class="flex-shrink-0 {currentVariant.icon}">
						{#if variant === 'error'}
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
							</svg>
						{:else if variant === 'warning'}
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
							</svg>
						{:else if variant === 'info'}
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						{:else if variant === 'success'}
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						{/if}
					</div>
				{/if}

				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium {currentVariant.text} leading-relaxed">
						{error}
					</p>

					<!-- Botones de acción -->
					{#if actions.length > 0}
						<div class="mt-3 flex gap-2 flex-wrap">
							{#each actions as actionButton (actionButton.label)}
							<button
									type="button"
									class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
									class:bg-current={actionButton.variant === 'primary'}
									class:text-white={actionButton.variant === 'primary'}
									class:border={actionButton.variant === 'secondary'}
									class:border-current={actionButton.variant === 'secondary'}
									onclick={actionButton.action}
								>
									{actionButton.label}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				{#if dismissible && onClose}
					<div class="flex-shrink-0">
						<button
							type="button"
							class="inline-flex rounded-lg p-2 {currentVariant.button} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current hover:scale-105"
							onclick={handleClose}
							aria-label="Cerrar alerta"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Barra de progreso para auto-close -->
		{#if autoClose && progressWidth > 0}
			<div class="h-1 bg-stone-200 dark:bg-stone-700 overflow-hidden">
				<div
					class="h-full {currentVariant.progress} transition-all duration-100 ease-linear"
					style="width: {progressWidth}%"
				></div>
			</div>
		{/if}
	</div>
{/if}