<script lang="ts">
	interface Props {
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		required?: boolean;
		readonly?: boolean;
		rows?: number;
		cols?: number;
		resize?: 'none' | 'both' | 'horizontal' | 'vertical';
		size?: 'sm' | 'md' | 'lg';
		variant?: 'default' | 'error' | 'success' | 'ghost';
		class?: string;
		id?: string;
		name?: string;
		label?: string;
		helperText?: string;
		errorText?: string;
		maxLength?: number;
		autoResize?: boolean;
		oninput?: (event: Event) => void;
		onchange?: (event: Event) => void;
		onfocus?: (event: Event) => void;
		onblur?: (event: Event) => void;
		onkeydown?: (event: KeyboardEvent) => void;
	}

	let {
		value = '',
		placeholder,
		disabled = false,
		required = false,
		readonly = false,
		rows = 3,
		cols,
		resize = 'none',
		size = 'md',
		variant = 'default',
		class: className = '',
		id,
		name,
		label,
		helperText,
		errorText,
		maxLength,
		autoResize = false,
		oninput,
		onchange,
		onfocus,
		onblur,
		onkeydown
	}: Props = $props();

	let focused = $state(false);
	let textareaElement: HTMLTextAreaElement;

	const hasValue = $derived(!!value);
	const currentLength = $derived(value.length);
	const isOverLimit = $derived(maxLength ? currentLength > maxLength : false);

	const baseClasses = 'block w-full rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 bg-white dark:bg-slate-800 border-2 placeholder:text-slate-400 dark:placeholder:text-slate-500';

	const sizeClasses = {
		sm: 'px-3 py-2 text-sm',
		md: 'px-4 py-3 text-base',
		lg: 'px-5 py-4 text-lg'
	};

	const variantClasses = $derived(() => {
		const base = {
			default: `border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500`,
			error: 'border-red-300 dark:border-red-500 text-slate-900 dark:text-slate-100 focus:ring-red-500 focus:border-red-500 bg-red-50/50 dark:bg-red-900/10',
			success: 'border-green-300 dark:border-green-500 text-slate-900 dark:text-slate-100 focus:ring-green-500 focus:border-green-500 bg-green-50/50 dark:bg-green-900/10',
			ghost: 'border-transparent bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800'
		};

		// Si está enfocado o tiene valor y es default, cambiar el color del borde
		if (variant === 'default' && (focused || hasValue)) {
			return base.default + ' border-blue-300 dark:border-blue-500';
		}

		return base[variant];
	});

	const disabledClasses = 'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-900';

	const resizeClasses = {
		none: 'resize-none',
		both: 'resize',
		horizontal: 'resize-x',
		vertical: 'resize-y'
	};

	const classes = $derived(`${baseClasses} ${sizeClasses[size]} ${variantClasses()} ${disabledClasses} ${resizeClasses[resize]} ${className}`);

	function handleFocus(event: Event) {
		focused = true;
		onfocus?.(event);
	}

	function handleBlur(event: Event) {
		focused = false;
		onblur?.(event);
	}

	function handleInput(event: Event) {
		if (autoResize && textareaElement) {
			textareaElement.style.height = 'auto';
			textareaElement.style.height = `${textareaElement.scrollHeight}px`;
		}
		oninput?.(event);
	}

	// Auto resize effect
	$effect(() => {
		if (autoResize && textareaElement && value) {
			textareaElement.style.height = 'auto';
			textareaElement.style.height = `${textareaElement.scrollHeight}px`;
		}
	});
</script>

<div class="space-y-2">
	{#if label}
		<div class="flex justify-between items-center">
			<label
				for={id}
				class="block text-sm font-semibold text-slate-700 dark:text-slate-300 {required ? 'after:content-[\'*\'] after:text-red-500 after:ml-1' : ''}"
			>
				{label}
			</label>
			{#if maxLength}
				<span class="text-xs {isOverLimit ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}">
					{currentLength}/{maxLength}
				</span>
			{/if}
		</div>
	{/if}

	<div class="relative group">
		<textarea
			bind:this={textareaElement}
			{id}
			{name}
			{value}
			{placeholder}
			{disabled}
			{required}
			{readonly}
			{rows}
			{cols}
			maxlength={maxLength}
			class="{classes} hover:shadow-md {autoResize ? 'overflow-y-hidden' : ''}"
			oninput={handleInput}
			onchange={onchange}
			onfocus={handleFocus}
			onblur={handleBlur}
			onkeydown={onkeydown}
		></textarea>

		<!-- Indicador de estado en la esquina -->
		{#if variant === 'success'}
			<div class="absolute top-3 right-3 text-green-500 pointer-events-none">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
			</div>
		{:else if variant === 'error' || isOverLimit}
			<div class="absolute top-3 right-3 text-red-500 pointer-events-none">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</div>
		{/if}

		<!-- Efecto de foco -->
		<div class="absolute inset-0 rounded-xl pointer-events-none transition-all duration-200 {focused ? 'ring-2 ring-blue-500/20 ring-offset-2' : ''}"></div>

		<!-- Indicador de resize en la esquina inferior derecha -->
		{#if resize !== 'none'}
			<div class="absolute bottom-2 right-2 text-slate-400 dark:text-slate-500 pointer-events-none">
				<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
				</svg>
			</div>
		{/if}
	</div>

	<!-- Texto de ayuda, error o contador -->
	{#if errorText || isOverLimit}
		<p class="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
			<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			{errorText || (isOverLimit ? `Has excedido el límite de ${maxLength} caracteres` : '')}
		</p>
	{:else if helperText}
		<p class="text-sm text-slate-500 dark:text-slate-400">
			{helperText}
		</p>
	{/if}
</div>