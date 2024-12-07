<script>
	import BookHeader from '$lib/components/BookHeader.svelte'
    /** @type {{ data: import('../$types').PageData }} */
	let { data, children } = $props()
    console.log(data)
</script>

<BookHeader book={data.book} lang={data.lang} topic={data.topic}/>
{@render children()}
