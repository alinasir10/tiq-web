<script>
	import '$lib/styles/app.css'
	import AppHeader from '$lib/components/AppHeader.svelte'

	let { children } = $props()
</script>

<div class="flex flex-col min-h-screen w-full">
	<AppHeader></AppHeader>
	{@render children()}
</div>
