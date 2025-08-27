<script lang="ts">
	import { tick } from 'svelte';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

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
		variant?: 'default' | 'error' | 'success' | 'ghost' | 'minimal';
		class?: string;
		id?: string;
		name?: string;
		label?: string;
		helperText?: string;
		errorText?: string;
		maxLength?: number;
		minLength?: number;
		autoResize?: boolean;
		autoFocus?: boolean;
		showWordCount?: boolean;
		allowTab?: boolean; // Permitir tabs en lugar de navegación
		spellcheck?: boolean;
		autocomplete?: HTMLTextareaAttributes['autocomplete'];
		oninput?: (event: Event) => void;
		onchange?: (event: Event) => void;
		onfocus?: (event: Event) => void;
		onblur?: (event: Event) => void;
		onkeydown?: (event: KeyboardEvent) => void;
		onpaste?: (event: ClipboardEvent) => void;
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
		minLength,
		autoResize = false,
		autoFocus = false,
		showWordCount = false,
		allowTab = false,
		spellcheck = true,
		autocomplete = 'off',
		oninput,
		onchange,
		onfocus,
		onblur,
		onkeydown,
		onpaste
	}: Props = $props();

	let focused = $state(false);
	let textareaElement: HTMLTextAreaElement;
	let initialHeight = $state(0);

	const hasValue = $derived(!!value);
	const currentLength = $derived(value.length);
	const wordCount = $derived(value.trim().split(/\s+/).filter(word => word.length > 0).length);
	const isOverLimit = $derived(maxLength ? currentLength > maxLength : false);
	const isUnderMin = $derived(minLength ? currentLength < minLength && currentLength > 0 : false);

	const baseClasses = 'block w-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 bg-white dark:bg-stone-800 border-2 placeholder:text-stone-400 dark:placeholder:text-stone-500';

	const sizeClasses = {
		sm: 'px-3 py-2 text-sm rounded-lg',
		md: 'px-4 py-3 text-base rounded-xl',
		lg: 'px-5 py-4 text-lg rounded-xl'
	};

	const variantClasses = $derived(() => {
		const base = {
			default: `border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100 focus:ring-sky-500 focus:border-sky-500`,
			minimal: `border-transparent bg-transparent dark:bg-transparent text-stone-900 dark:text-stone-100 focus:ring-sky-500 focus:border-stone-300 dark:focus:border-stone-600 hover:border-stone-200 dark:hover:border-stone-700`,
			error: 'border-red-300 dark:border-red-500 text-stone-900 dark:text-stone-100 focus:ring-red-500 focus:border-red-500 bg-red-50/50 dark:bg-red-900/10',
			success: 'border-emerald-300 dark:border-emerald-500 text-stone-900 dark:text-stone-100 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10',
			ghost: 'border-transparent bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:ring-sky-500 focus:border-sky-500 focus:bg-white dark:focus:bg-stone-800'
		};

		// Auto-detectar variante según estado
		if (isOverLimit || errorText) return base.error;
		if (variant === 'success' || (minLength && currentLength >= minLength)) return base.success;

		// Si está enfocado o tiene valor y es default, cambiar el color del borde
		if (variant === 'default' && (focused || hasValue)) {
			return base.default + ' border-sky-300 dark:border-sky-500';
		}

		return base[variant];
	});

	const disabledClasses = 'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-stone-100 dark:disabled:bg-stone-900';

	const resizeClasses = {
		none: 'resize-none',
		both: 'resize',
		horizontal: 'resize-x',
		vertical: 'resize-y'
	};

	const classes = $derived(`${baseClasses} ${sizeClasses[size]} ${variantClasses()} ${disabledClasses} ${resizeClasses[resize]} ${className}`);

	// Auto-focus effect
	$effect(() => {
		if (autoFocus && textareaElement && !disabled) {
			tick().then(() => {
				textareaElement.focus();
			});
		}
	});

	// Auto resize effect
	$effect(() => {
		if (autoResize && textareaElement) {
			if (initialHeight === 0) {
				initialHeight = textareaElement.scrollHeight;
			}

			textareaElement.style.height = 'auto';
			const newHeight = Math.max(textareaElement.scrollHeight, initialHeight);
			textareaElement.style.height = `${newHeight}px`;
		}
	});

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
			const newHeight = Math.max(textareaElement.scrollHeight, initialHeight);
			textareaElement.style.height = `${newHeight}px`;
		}
		oninput?.(event);
	}

	function handleKeyDown(event: KeyboardEvent) {
		// Manejar tab si está habilitado
		if (allowTab && event.key === 'Tab') {
			event.preventDefault();
			const start = textareaElement.selectionStart;
			const end = textareaElement.selectionEnd;
			const newValue = value.substring(0, start) + '\t' + value.substring(end);

			// Actualizar valor y posición del cursor
			value = newValue;

			// Restaurar posición del cursor después del próximo tick
			tick().then(() => {
				textareaElement.selectionStart = textareaElement.selectionEnd = start + 1;
			});
		}

		onkeydown?.(event);
	}

	function handlePaste(event: ClipboardEvent) {
		// Verificar límites al pegar
		if (maxLength) {
			const pasteData = event.clipboardData?.getData('text') || '';
			const newLength = currentLength + pasteData.length;

			if (newLength > maxLength) {
				event.preventDefault();
				// Recortar el texto pegado para que quepa
				const availableSpace = maxLength - currentLength;
				const trimmedPaste = pasteData.substring(0, availableSpace);

				if (trimmedPaste) {
					const start = textareaElement.selectionStart;
					const end = textareaElement.selectionEnd;
					const newValue = value.substring(0, start) + trimmedPaste + value.substring(end);
					value = newValue;
				}
			}
		}

		onpaste?.(event);
	}
</script>

<div class="space-y-2">
	{#if label}
		<div class="flex justify-between items-center">
			<label
				for={id}
				class="block text-sm font-semibold text-stone-700 dark:text-stone-300 {required ? 'after:content-[\'*\'] after:text-red-500 after:ml-1' : ''}"
			>
				{label}
			</label>
			{#if maxLength || showWordCount}
				<div class="flex items-center gap-3 text-xs">
					{#if showWordCount}
						<span class="text-stone-500 dark:text-stone-400">
							{wordCount} palabra{wordCount !== 1 ? 's' : ''}
						</span>
					{/if}
					{#if maxLength}
						<span class="{isOverLimit ? 'text-red-500' : isUnderMin ? 'text-amber-500' : 'text-stone-500 dark:text-stone-400'}">
							{currentLength}/{maxLength}
						</span>
					{/if}
				</div>
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
			{spellcheck}
			{autocomplete}
			maxlength={maxLength}
			minlength={minLength}
			class="{classes} hover:shadow-md {autoResize ? 'overflow-y-hidden' : ''} {variant === 'minimal' ? 'shadow-none hover:shadow-sm' : ''}"
			oninput={handleInput}
			onchange={onchange}
			onfocus={handleFocus}
			onblur={handleBlur}
			onkeydown={handleKeyDown}
			onpaste={handlePaste}
		></textarea>

		<!-- Indicador de estado en la esquina -->
		{#if variant === 'success' || (minLength && currentLength >= minLength && !isOverLimit)}
			<div class="absolute top-3 right-3 text-emerald-500 pointer-events-none">
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
		{:else if isUnderMin}
			<div class="absolute top-3 right-3 text-amber-500 pointer-events-none">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
			</div>
		{/if}

		<!-- Efecto de foco mejorado -->
		<div class="absolute inset-0 rounded-xl pointer-events-none transition-all duration-200 {focused ? 'ring-2 ring-sky-500/20 ring-offset-2' : ''}"></div>

		<!-- Indicador de resize en la esquina inferior derecha -->
		{#if resize !== 'none'}
			<div class="absolute bottom-2 right-2 text-stone-400 dark:text-stone-500 pointer-events-none">
				<svg class="w-3 h-3 fill-current" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
				</svg>
			</div>
		{/if}

		<!-- Indicador de caracteres flotante para textos largos -->
		{#if focused && maxLength && currentLength > maxLength * 0.8}
			<div class="absolute -top-8 right-0 bg-stone-900 dark:bg-stone-700 text-white text-xs px-2 py-1 rounded shadow-lg animate-in fade-in duration-200">
				{maxLength - currentLength} restantes
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
	{:else if isUnderMin}
		<p class="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
			<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
			</svg>
			Mínimo {minLength} caracteres requeridos
		</p>
	{:else if helperText}
		<p class="text-sm text-stone-500 dark:text-stone-400">
			{helperText}
		</p>
	{:else if allowTab}
		<p class="text-xs text-stone-400 dark:text-stone-500">
			Presiona Tab para insertar tabulación
		</p>
	{/if}

	<!-- Barra de progreso para límite de caracteres -->
	{#if maxLength && currentLength > 0}
		<div class="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-1 overflow-hidden">
			<div
				class="h-full transition-all duration-300 rounded-full {isOverLimit ? 'bg-red-500' : currentLength > maxLength * 0.8 ? 'bg-amber-500' : 'bg-sky-500'}"
				style="width: {Math.min((currentLength / maxLength) * 100, 100)}%"
			></div>
		</div>
	{/if}
</div>