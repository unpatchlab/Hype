<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import type { WidgetView } from '../../server/widget.modele';
	import Widget from '$lib/components/Widget/widget.svelte';
	import Masonry from 'svelte-masonry';

	let widgets$ = $state<
		{
			dashboardId: string;
			widgetId: string;
			id: string;
			view: WidgetView;
		}[]
	>([]);

	const getUpdate = async () => {
		const res = await fetch(`/api/dashboard/${page.params.dashboardId}`);
		const json = await res.json();

		widgets$ = json?.widgets ?? [];
	};

	onMount(async () => {
		getUpdate();

		setInterval(getUpdate, 5000);
	});
</script>

<!-- <div class="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
	{#each widgets$ as widget}
		<Widget view={widget.view} />
	{/each}
</div> -->

<div class="p-4">
	<Masonry
		stretchFirst={false}
		gridGap={'0.75rem'}
		colWidth={'minmax(Min(22em, 100%), 1fr)'}
		items={widgets$}
	>
		{#each widgets$ as widget}
			<Widget view={widget.view} />
		{/each}
	</Masonry>
</div>
