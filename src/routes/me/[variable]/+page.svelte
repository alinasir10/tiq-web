<script>
    /** @type {{ data: import('./$types').PageData }} */
    let {data} = $props()

    console.log(data)
</script>

<h1>
    The param/prop from [variable] (user defined in url) is {data.value}
</h1>
