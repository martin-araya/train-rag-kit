<script lang="ts">
	interface Props {
		type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'file';
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		required?: boolean;
		readonly?: boolean;
		accept?: string; // Para inputs de tipo file
		multiple?: boolean; // Para inputs de tipo file
		size?: 'sm' | 'md' | 'lg';
		variant?: 'default' | 'error' | 'success' | 'ghost';
		class?: string;
		id?: string;
		name?: string;
		label?: string;
		helperText?: string;
		errorText?: string;
		icon?: boolean; // Para mostrar icono
		oninput?: (event: Event) => void;
		onchange?: (event: Event) => void;
		onfocus?: (event: Event) => void;
		onblur?: (event: Event) => void;
		onkeydown?: (event: KeyboardEvent) => void;
	}

	let {
		type = 'text',
		value = '',
		placeholder,
		disabled = false,
		required = false,
		readonly = false,
		accept,
		multiple = false,
		size = 'md',
		variant = 'default',
		class: className = '',
		id,
		name,
		label,
		helperText,
		errorText,
		icon = false,
		oninput,
		onchange,
		onfocus,
		onblur,
		onkeydown
	}: Props = $props();

	let focused = $state(false);

	// Usar $derived para calcular hasValue
	const hasValue = $derived(!!value);

	const baseClasses = 'block w-full rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 bg-white dark:bg-slate-800 border-2';

	const sizeClasses = {
		sm: 'px-3 py-2 text-sm',
		md: 'px-4 py-3 text-base',
		lg: 'px-5 py-4 text-lg'
	};

	// Usar $derived para las clases del variant
	const variantClasses = $derived(() => {
		const base = {
			default: `border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500`,
			error: 'border-red-300 dark:border-red-500 text-slate-900 dark:text-slate-100 focus:ring-red-500 focus:border-red-500 bg-red-50/50 dark:bg-red-900/10',
			success: 'border-green-300 dark:border-green-500 text-slate-900 dark:text-slate-100 focus:ring-green-500 focus:border-green-500 bg-green-50/50 dark:bg-green-900/10',
			ghost: 'border-transparent bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800'
		};

		if (variant === 'default' && (focused || hasValue)) {
			return base.default + ' border-blue-300 dark:border-blue-500';
		}

		return base[variant];
	});

	const disabledClasses = 'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-900';

	// Usar $derived para las clases finales
	const classes = $derived(`${baseClasses} ${sizeClasses[size]} ${variantClasses()} ${disabledClasses} ${className}`);

	// Clases específicas para input file con diseño moderno
	const fileClasses = 'file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:transition-all file:duration-200 file:shadow-md';

	function handleFocus(event: Event) {
		focused = true;
		onfocus?.(event);
	}

	function handleBlur(event: Event) {
		focused = false;
		onblur?.(event);
	}

	function handleInput(event: Event) {
		oninput?.(event);
	}
</script>

<div class="space-y-2">
	{#if label}
		<label
			for={id}
			class="block text-sm font-semibold text-slate-700 dark:text-slate-300 {required ? 'after:content-[\'*\'] after:text-red-500 after:ml-1' : ''}"
		>
			{label}
		</label>
	{/if}

	<div class="relative group">
		{#if type === 'file'}
			<input
				{type}
				{id}
				{name}
				{disabled}
				{required}
				{accept}
				{multiple}
				class="{classes} {fileClasses} text-slate-500 cursor-pointer hover:shadow-md"
				onchange={onchange}
				onfocus={handleFocus}
				onblur={handleBlur}
			/>
		{:else}
			<input
				{type}
				{id}
				{name}
				{value}
				{placeholder}
				{disabled}
				{required}
				{readonly}
				class="{classes} {icon ? 'pl-12' : ''} hover:shadow-md placeholder:text-slate-400 dark:placeholder:text-slate-500"
				oninput={handleInput}
				onchange={onchange}
				onfocus={handleFocus}
				onblur={handleBlur}
				onkeydown={onkeydown}
			/>
		{/if}

		<!-- Icono decorativo -->
		{#if icon && type !== 'file'}
			<div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
				{#if type === 'email'}
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
					</svg>
				{:else if type === 'password'}
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
					</svg>
				{:else if type === 'search'}
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				{:else}
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
				{/if}
			</div>
		{/if}

		<!-- Indicador de estado -->
		{#if variant === 'success'}
			<div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 pointer-events-none">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
			</div>
		{:else if variant === 'error'}
			<div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 pointer-events-none">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</div>
		{/if}

		<!-- Efecto de foco -->
		<div class="absolute inset-0 rounded-xl pointer-events-none transition-all duration-200 {focused ? 'ring-2 ring-blue-500/20 ring-offset-2' : ''}"></div>
	</div>

	<!-- Texto de ayuda o error -->
	{#if errorText}
		<p class="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
			<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			{errorText}
		</p>
	{:else if helperText}
		<p class="text-sm text-slate-500 dark:text-slate-400">
			{helperText}
		</p>
	{/if}
</div>