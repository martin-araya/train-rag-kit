<script lang="ts">
	import Spinner from './Spinner.svelte';

	interface Props {
		type?: 'uploading' | 'processing' | 'thinking' | 'searching' | 'analyzing';
		message?: string;
		showSpinner?: boolean;
		fullscreen?: boolean;
		variant?: 'default' | 'minimal' | 'card' | 'inline';
		progress?: number; // 0-100 para barra de progreso
	}

	let {
		type = 'processing',
		message,
		showSpinner = true,
		fullscreen = false,
		variant = 'default',
		progress
	}: Props = $props();

	const messages = {
		uploading: 'Subiendo archivo...',
		processing: 'Procesando documento...',
		thinking: 'Generando respuesta...',
		searching: 'Buscando en documentos...',
		analyzing: 'Analizando contenido...'
	};

	const displayMessage = message || messages[type];

	const spinnerConfigs = {
		uploading: { variant: 'circle' as const, color: 'blue' as const },
		processing: { variant: 'dots' as const, color: 'green' as const },
		thinking: { variant: 'orbit' as const, color: 'purple' as const },
		searching: { variant: 'wave' as const, color: 'yellow' as const },
		analyzing: { variant: 'bars' as const, color: 'indigo' as const }
	};

	const config = spinnerConfigs[type];

	const iconMap = {
		uploading: '↗',
		processing: '⚙',
		thinking: '🧠',
		searching: '🔍',
		analyzing: '📊'
	};
</script>

{#if fullscreen}
	<!-- Fullscreen overlay -->
	<div class="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
		<div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-slate-200 dark:border-slate-700">
			<div class="text-center space-y-4">
				{#if showSpinner}
					<div class="flex justify-center">
						<Spinner
							size="lg"
							color={config.color}
							variant={config.variant}
							label={displayMessage}
						/>
					</div>
				{/if}
				<div class="space-y-2">
					<h3 class="text-lg font-semibold text-slate-900 dark:text-white">
						{displayMessage}
					</h3>
					{#if progress !== undefined}
						<div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
							<div
								class="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
								style="width: {progress}%"
							></div>
						</div>
						<p class="text-sm text-slate-500 dark:text-slate-400">{progress}% completado</p>
					{/if}
				</div>
			</div>
		</div>
	</div>

{:else if variant === 'minimal'}
	<!-- Minimal inline -->
	<div class="flex items-center space-x-2">
		{#if showSpinner}
			<Spinner
				size="sm"
				color={config.color}
				variant={config.variant}
				label={displayMessage}
			/>
		{/if}
		<span class="text-sm text-slate-600 dark:text-slate-400">
			{displayMessage}
		</span>
	</div>

{:else if variant === 'card'}
	<!-- Card style -->
	<div class="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-slate-200 dark:border-slate-600 shadow-lg">
		<div class="flex items-center space-x-4">
			<div class="flex-shrink-0">
				{#if showSpinner}
					<div class="relative">
						<Spinner
							size="lg"
							color={config.color}
							variant={config.variant}
							label={displayMessage}
						/>
						<!-- Decorative background circle -->
						<div class="absolute inset-0 bg-gradient-to-r from-{config.color}-100 to-{config.color}-200 dark:from-{config.color}-900/20 dark:to-{config.color}-800/20 rounded-full -z-10 scale-150 opacity-50"></div>
					</div>
				{:else}
					<div class="w-8 h-8 bg-gradient-to-r from-{config.color}-500 to-{config.color}-600 rounded-full flex items-center justify-center text-white text-lg">
						{iconMap[type]}
					</div>
				{/if}
			</div>
			<div class="flex-1 space-y-2">
				<h3 class="text-lg font-semibold text-slate-900 dark:text-white">
					{displayMessage}
				</h3>
				{#if progress !== undefined}
					<div class="space-y-1">
						<div class="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 overflow-hidden">
							<div
								class="h-full bg-gradient-to-r from-{config.color}-500 to-{config.color}-600 rounded-full transition-all duration-500 ease-out shadow-sm"
								style="width: {progress}%"
							></div>
						</div>
						<p class="text-xs text-slate-500 dark:text-slate-400 text-right">{progress}%</p>
					</div>
				{:else}
					<p class="text-sm text-slate-600 dark:text-slate-400">
						Por favor espera mientras procesamos tu solicitud...
					</p>
				{/if}
			</div>
		</div>
	</div>

{:else if variant === 'inline'}
	<!-- Inline with chat bubble style -->
	<div class="flex items-start space-x-3 max-w-xl">
		<div class="w-8 h-8 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center flex-shrink-0">
			{#if showSpinner}
				<Spinner
					size="sm"
					color="white"
					variant={config.variant}
					label={displayMessage}
				/>
			{:else}
				<span class="text-white text-sm">{iconMap[type]}</span>
			{/if}
		</div>
		<div class="bg-slate-200 dark:bg-slate-700 rounded-2xl px-4 py-3 max-w-sm">
			<p class="text-sm text-slate-800 dark:text-slate-200">
				{displayMessage}
			</p>
			{#if progress !== undefined}
				<div class="mt-2 w-full bg-slate-300 dark:bg-slate-600 rounded-full h-1.5 overflow-hidden">
					<div
						class="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
						style="width: {progress}%"
					></div>
				</div>
			{/if}
		</div>
	</div>

{:else}
	<!-- Default style -->
	<div class="flex items-center space-x-3 p-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm backdrop-blur-sm">
		{#if showSpinner}
			<Spinner
				size="md"
				color={config.color}
				variant={config.variant}
				label={displayMessage}
			/>
		{/if}
		<div class="flex-1">
			<span class="text-slate-700 dark:text-slate-300 font-medium">
				{displayMessage}
			</span>
			{#if progress !== undefined}
				<div class="mt-2 w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 overflow-hidden">
					<div
						class="h-full bg-gradient-to-r from-{config.color}-500 to-{config.color}-600 rounded-full transition-all duration-300 ease-out"
						style="width: {progress}%"
					></div>
				</div>
			{/if}
		</div>
	</div>
{/if}