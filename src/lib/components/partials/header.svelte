<script lang="ts">
	import { page } from '$app/state';

	let { dashboards, message }: { dashboards: { slug: string; label: string }[]; message: string } =
		$props();
</script>

<header>
	{#if dashboards.length > 1}
		<div class="flex items-center gap-4 px-4 py-4">
			{#each dashboards as dashboard}
				<a
					href="/{dashboard.slug}"
					class="rounded-sm px-3 py-2 text-xs font-bold tracking-wide text-neutral-100 uppercase hover:bg-neutral-500"
					class:bg-neutral-600={page.url.pathname === `/${dashboard.slug}`}>{dashboard.label}</a
				>
			{/each}
		</div>
	{/if}

	{#if message}
		<div class="px-4 pt-2">
			<p class="bg-primary-850 text-primary-400 rounded-md p-4 text-sm leading-7">
				{@html message}
			</p>
		</div>
	{/if}
</header>
