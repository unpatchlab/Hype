<script lang="ts">
	import type {
		ButtonWidgetComplication,
		HeaderWidgetComplication,
		ListWidgetComplication,
		WidgetMetricComplication,
		WidgetView
	} from '$lib/models/WidgetView';

	let { view }: { view?: WidgetView } = $props();

	const onAction = (action: string) => {
		if (action.startsWith('open_href::')) {
			window.open(action.replace('open_href::', ''), '_blank');
		}
	};
</script>

{#snippet header(config: HeaderWidgetComplication)}
	<div class="flex items-center gap-3">
		{#if config.icon}
			{@const [ic, bg] = config.icon.split('::')}
			<div class={['h-12 w-12 shrink-0 grow-0 rounded-md bg-white', bg]}>
				<img src="/api/static/icons/{ic}" class="h-full w-full rounded-md" alt={config.title} />
			</div>
		{/if}

		<div class="flex min-h-12 grow flex-col justify-center">
			<p class="text-md font-medium tracking-wide text-neutral-50">{config.title}</p>

			{#if config.subtitle}
				<p class="text-neutral-150 line-clamp-1 pt-0.5 text-sm tracking-wide">{config.subtitle}</p>
			{/if}
		</div>

		{#if config.sideContent}
			{#if config.sideContent.type === 'button'}
				<button class="bg-primary-500 shrink-0 grow-0 rounded-md text-neutral-950">
					{config.sideContent.label}
				</button>
			{:else if config.sideContent.type === 'label'}
				<div class="flex items-center gap-2">
					<div
						class={[
							'h-2 w-2 shrink-0 grow-0 rounded-full bg-green-500',
							config.sideContent.indicatorClass
						]}
					></div>
					<p
						class="shrink-0 grow-0 rounded-md text-xs font-bold tracking-wider text-neutral-50 uppercase"
					>
						{config.sideContent.label}
					</p>
				</div>
			{:else if config.sideContent.type === 'text'}
				{#each config.sideContent.content as content}
					<div class="shrink-0">
						<p class="text-md text-right font-medium tracking-wide text-neutral-50">
							{content.title}
						</p>

						{#if content.subtitle}
							<p class="text-neutral-150 line-clamp-1 pt-0.5 text-right text-sm tracking-wide">
								{content.subtitle}
							</p>
						{/if}
					</div>
				{/each}
			{/if}
		{/if}
	</div>
{/snippet}

{#snippet list(config: ListWidgetComplication)}
	<!-- <div class="flex justify-between gap-2">
		<div class="flex items-center gap-2">
			<i class="ri-cpu-line text-2xl text-neutral-50"></i>
			<span class="text-sm text-neutral-50">24%</span>
		</div>
		<div class="flex items-center gap-2">
			<i class="ri-cpu-line text-2xl text-neutral-50"></i>
			<span class="text-sm text-neutral-50">24%</span>
		</div>
		<div class="flex items-center gap-2">
			<i class="ri-cpu-line text-2xl text-neutral-50"></i>
			<span class="text-sm text-neutral-50">24%</span>
		</div>
	</div> -->

	<div class="flex flex-col items-center gap-3 pt-6">
		{#if config.title}
			<p class="text-md w-full truncate font-medium text-neutral-100">{config.title}</p>
		{/if}
		{#each config.rows as row}
			<a class="flex w-full items-center gap-2" href={row.href || '#'} target="_blank">
				{#each row.content as content}
					<span class={content.classes}>{content.text}</span>
				{/each}
			</a>
		{/each}
	</div>
{/snippet}

{#snippet button(config: ButtonWidgetComplication)}
	<button class="bg-primary-500 shrink-0 grow-0 rounded-md px-5 text-neutral-950">
		{config.label}</button
	>
{/snippet}

{#snippet metric(config: WidgetMetricComplication)}
	<div class="flex flex-col items-center gap-3 pt-6">
		{#if config.title}
			<p class="text-md w-full truncate font-medium text-neutral-100">{config.title}</p>
		{/if}
		{#each config.rows as row}
			<div class="flex w-full items-center gap-2">
				{#if row.icon}
					<i class={['shrink-0 text-2xl text-neutral-100', row.icon]}></i>
				{/if}

				{#if row.label}
					<span class="shrink=0 text-sm text-neutral-100">{row.label}</span>
				{/if}

				{#if row.progress !== -1}
					<div
						class="bg-neutral-450 relative mx-2 flex h-2 grow items-center gap-2 overflow-clip rounded-md"
					>
						<div
							class="bg-primary-450 absolute left-0 flex h-2 grow items-center gap-2 rounded-md"
							style="width: {row.progress}%"
						></div>
					</div>
				{/if}

				{#if row.progress === -1}
					<div class="grow"></div>
				{/if}

				{#if row.value}
					<span class="shrink=0 truncate text-sm font-semibold text-neutral-100">{row.value}</span>
				{/if}
			</div>
		{/each}
	</div>

	<!-- <div class="flex justify-between gap-2 px-5">
		<div class="flex items-center gap-2">
			<i class="ri-cpu-line text-2xl text-neutral-50"></i>
			<span class="text-sm text-neutral-50">24%</span>
		</div>
		<div class="flex items-center gap-2">
			<i class="ri-cpu-line text-2xl text-neutral-50"></i>
			<span class="text-sm text-neutral-50">24%</span>
		</div>
		<div class="flex items-center gap-2">
			<i class="ri-cpu-line text-2xl text-neutral-50"></i>
			<span class="text-sm text-neutral-50">24%</span>
		</div>
	</div> -->
{/snippet}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div>
	<div
		class="bg-neutral-550 flex flex-col rounded-lg p-4 pr-5"
		role="button"
		tabindex="0"
		onclick={() => onAction(view?.action ?? '')}
		class:cursor-pointer={view?.action}
	>
		{#each view?.complication ?? [] as complication}
			{#if complication.type === 'header'}
				{@render header(complication)}
			{/if}

			{#if complication.type === 'list'}
				{@render list(complication)}
			{/if}

			{#if complication.type === 'button'}
				{@render button(complication)}
			{/if}

			{#if complication.type === 'metric'}
				{@render metric(complication)}
			{/if}
		{/each}
	</div>
</div>
