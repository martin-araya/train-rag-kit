<script lang="ts">
	interface Props {
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		color?: 'blue' | 'gray' | 'red' | 'green' | 'yellow' | 'purple' | 'pink' | 'white' | 'indigo';
		variant?: 'circle' | 'dots' | 'pulse' | 'bars' | 'orbit' | 'wave';
		class?: string;
		label?: string;
		speed?: 'slow' | 'normal' | 'fast';
	}

	let {
		size = 'md',
		color = 'blue',
		variant = 'circle',
		class: className = '',
		label = 'Cargando...',
		speed = 'normal'
	}: Props = $props();

	const sizeClasses = {
		xs: 'h-3 w-3',
		sm: 'h-4 w-4',
		md: 'h-5 w-5',
		lg: 'h-6 w-6',
		xl: 'h-8 w-8'
	};

	const colorClasses = {
		blue: 'text-blue-600',
		gray: 'text-gray-600',
		red: 'text-red-600',
		green: 'text-green-600',
		yellow: 'text-yellow-600',
		purple: 'text-purple-600',
		pink: 'text-pink-600',
		white: 'text-white',
		indigo: 'text-indigo-600'
	};

	const speedClasses = {
		slow: 'animate-[spin_2s_linear_infinite]',
		normal: 'animate-spin',
		fast: 'animate-[spin_0.5s_linear_infinite]'
	};

	const baseClasses = `${sizeClasses[size]} ${colorClasses[color]} ${className}`;
</script>

{#if variant === 'circle'}
	<svg
		class="{speedClasses[speed]} {baseClasses} drop-shadow-sm"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		aria-label={label}
		role="status"
	>
		<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
		<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
	</svg>

{:else if variant === 'dots'}
	<div class="flex space-x-1 {className}" aria-label={label} role="status">
		<div class="animate-bounce {sizeClasses[size]} {colorClasses[color]} bg-current rounded-full opacity-75 shadow-sm" style="animation-delay: 0ms; animation-duration: 1.4s;"></div>
		<div class="animate-bounce {sizeClasses[size]} {colorClasses[color]} bg-current rounded-full opacity-75 shadow-sm" style="animation-delay: 0.2s; animation-duration: 1.4s;"></div>
		<div class="animate-bounce {sizeClasses[size]} {colorClasses[color]} bg-current rounded-full opacity-75 shadow-sm" style="animation-delay: 0.4s; animation-duration: 1.4s;"></div>
	</div>

{:else if variant === 'pulse'}
	<div
		class="animate-pulse {sizeClasses[size]} {colorClasses[color]} bg-current rounded-full {className} shadow-lg opacity-75"
		style="animation-duration: 2s;"
		aria-label={label}
		role="status"
	></div>

{:else if variant === 'bars'}
	<div class="flex space-x-1 items-end {className}" aria-label={label} role="status">
		<div class="animate-pulse {colorClasses[color]} bg-current rounded-sm shadow-sm" style="animation-delay: 0ms; animation-duration: 1.2s; width: 3px; height: {size === 'xs' ? '8px' : size === 'sm' ? '12px' : size === 'md' ? '16px' : size === 'lg' ? '20px' : '24px'};"></div>
		<div class="animate-pulse {colorClasses[color]} bg-current rounded-sm shadow-sm" style="animation-delay: 0.15s; animation-duration: 1.2s; width: 3px; height: {size === 'xs' ? '12px' : size === 'sm' ? '16px' : size === 'md' ? '20px' : size === 'lg' ? '24px' : '28px'};"></div>
		<div class="animate-pulse {colorClasses[color]} bg-current rounded-sm shadow-sm" style="animation-delay: 0.3s; animation-duration: 1.2s; width: 3px; height: {size === 'xs' ? '10px' : size === 'sm' ? '14px' : size === 'md' ? '18px' : size === 'lg' ? '22px' : '26px'};"></div>
		<div class="animate-pulse {colorClasses[color]} bg-current rounded-sm shadow-sm" style="animation-delay: 0.45s; animation-duration: 1.2s; width: 3px; height: {size === 'xs' ? '6px' : size === 'sm' ? '10px' : size === 'md' ? '14px' : size === 'lg' ? '18px' : '22px'};"></div>
	</div>

{:else if variant === 'orbit'}
	<div class="relative {sizeClasses[size]} {className}" aria-label={label} role="status">
		<div class="absolute inset-0 rounded-full border-2 border-current opacity-25"></div>
		<div class="absolute inset-0 rounded-full border-2 border-transparent border-t-current {speedClasses[speed]} {colorClasses[color]}"></div>
		<div class="absolute inset-1 rounded-full border border-transparent border-t-current animate-spin {colorClasses[color]}" style="animation-direction: reverse; animation-duration: 1.5s;"></div>
	</div>

{:else if variant === 'wave'}
	<div class="flex space-x-1 items-center {className}" aria-label={label} role="status">
		{#each [0, 1, 2, 3, 4] as i (i)}
			<div
				class="w-1 {colorClasses[color]} bg-current rounded-full animate-pulse shadow-sm"
				style="height: {size === 'xs' ? '8px' : size === 'sm' ? '12px' : size === 'md' ? '16px' : size === 'lg' ? '20px' : '24px'}; animation-delay: {i * 0.1}s; animation-duration: 1s;"
			></div>
		{/each}
	</div>
{/if}

<span class="sr-only">{label}</span>