<script lang="ts">
	import '@fontsource/open-sans/300.css';
	import '@fontsource/open-sans/400.css';
	import '@fontsource/open-sans/500.css';
	import '@fontsource/open-sans/600.css';
	import '@fontsource/open-sans/700.css';
	import '@fontsource/open-sans/800.css';
	import 'remixicon/fonts/remixicon.css';

	import '../app.css';
	import { onMount } from 'svelte';
	import Header from '$lib/components/partials/header.svelte';
	let { children } = $props();

	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let config$ = $state<{
		dashboards: { slug: string; label: string }[];
		message: string;
		custom_stript: string;
		custom_css: string;
	}>({
		dashboards: [],
		message: '',
		custom_stript: '',
		custom_css: ''
	});

	onMount(async () => {
		const res = await fetch('/api/dashboards');
		const json = await res.json();

		config$ = json ?? {};

		if (!page.params.dashboardId && config$.dashboards.length > 0) {
			goto(`/${config$.dashboards[0].slug}`);
		}
	});
</script>

<div class="body min-h-screen bg-neutral-800">
	<Header dashboards={config$.dashboards} message={config$.message} />
	{@render children()}
</div>
