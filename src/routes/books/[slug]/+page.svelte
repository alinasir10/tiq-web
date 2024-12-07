<script>
    import { onMount } from 'svelte';

    /** @type {{ data: import('./$types').PageData }} */
    let {data} = $props()

    const {book, topic, lang} = data

    let iframeElm
    let sourceType
    let sourceLink


   book.topics.map(t => {
            if (t.slug === topic) {
                t.sources.map(s => {
                    if (s.lang === lang) {
                        sourceType = s.type
                        sourceLink = s.url
                        console.log('updating', s.type, s.url)
//                        iframeElm.reload()
                    }
                })
            }
        })


    console.log(data.book)
</script>

{sourceLink}
{#if sourceType === 'canva'}
    <div class="flex flex-grow overflow-hidden">
        <iframe bind:this={iframeElm}
                title="PageContent"
                class="w-full min-h-full border-0"
                src={sourceLink}
        >
        </iframe>
    </div>
{/if}