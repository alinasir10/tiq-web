<script>
    import {api} from '$lib/quranApi.js'
    import {onMount} from 'svelte'

    let pageNumber = 10
    let hoveredVerse = null
    let verses = []
    let scale = 1

    let fontUrl = `https://quran.com/fonts/quran/hafs/v4/colrv1/woff2/p${pageNumber}.woff2`;
    const loadFont = () => {
        const fontFace = new FontFace(`Majidi`, `url('/fonts/Majidi_v5.ttf')`, {
            weight: 'normal',
            style: 'normal'
          });
          fontFace.load().then((loadedFont) => {
            document.fonts.add(loadedFont);
          });
    }

    $ : if (typeof window !== 'undefined' && 'FontFace' in window) {
        fontUrl = `https://quran.com/fonts/quran/hafs/v4/colrv1/woff2/p${pageNumber}.woff2`;
        loadFont()
    }

    let wrapperWidth = 0;
    let wrapperPadding = 0;

    // Adjust transform origin and centering based on available width of the wrapper
    let wrapper;
    onMount(() => {
        if (wrapper) {
          const observer = new ResizeObserver(() => {
            const styles = getComputedStyle(wrapper);
            wrapperWidth = wrapper.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
          });
          observer.observe(wrapper);
          const styles = getComputedStyle(wrapper);
          wrapperWidth = wrapper.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
        }
    });

    $: transformOrigin = (scale * (148 * 3.78)) > wrapperWidth ? 'top left' : 'top center';
    $: justifyContent = (scale * (148 * 3.78)) > wrapperWidth ? 'start' : 'center';

    const getVerses = () => {
        api.get(`/verses/by_page/${pageNumber}`, {
            params: {
                words: true,
                per_page: 'all',
                filter_page_words: true,
                text_uthmani_tajweed: true,
                word_fields: ["code_v2",
                    "text_uthmani_tajweed",
                    "text_uthmani_simple",
                    "text_imlaei",
                    "text_indopak",
                    "text_indopak_nastaleeq",
                    "text_qpc_hafs",
                    "text_qpc_nastaleeq"
                ].join(', '),
                fields: ["text_uthmani_tajweed"].join(', '),
            }
        }).then((res) => {
            console.log(res)
            verses = res.data.verses
        }).catch((err) => console.log(err))
    }

    onMount(() => getVerses())

    const handleNextPage = () => {
        pageNumber ++
        getVerses()
    }

    const handlePreviousPage = () => {
        pageNumber --
        getVerses()
    }

    const handleVerseHovered = (verseKey) => {
        hoveredVerse = verseKey
    }

</script>

<div class="flex flex-col w-full min-h-dvh max-h-dvh overflow-auto items-center">
    <div class="flex gap-4 justify-center w-full p-4">
        <div class="join">
          <button class="join-item btn btn-sm" on:click={() => handlePreviousPage()}>«</button>
          <button class="join-item btn btn-sm">Page {pageNumber}</button>
          <button class="join-item btn btn-sm" on:click={() => handleNextPage()}>»</button>
        </div>

        <div class="join">
            <button class="join-item btn btn-sm" on:click={() => scale = scale - 0.1}>-</button>
            <input type=text bind:value={scale} class="join-item input input-sm w-16"/>
            <button class="join-item btn btn-sm" on:click={() => scale = scale + 0.1}>+</button>
        </div>
    </div>

    <div bind:this={wrapper} class="relative flex flex-1 w-full items-start justify-{justifyContent} p-8 tajweed" style="font-family: 'Majidi';">
        <div class="flex flex-col p-16 leading-relaxed bg-yellow-50 text-red-800 w-[148mm] h-[210mm] origin-top text-black transition-all text-2xl" style="transform: scale({scale}); transform-origin: {transformOrigin};" dir=rtl>
                {#each Array.from({ length: 15 }) as _, lineIndex}
                    <div class="flex justify-between items-center line-{lineIndex} border">
                        {#each verses as verse}
                            {#each verse.words as word, index}
                                {#if word.line_number === lineIndex + 1}
                                    <div class="flex rounded items-center {hoveredVerse === verse.verse_key ? 'bg-neutral-700' : ''}">

                                        <span role=none class=" hover:bg-primary-content rounded"
                                            data-font="tajweed_v4"
                                            on:mouseover={() => handleVerseHovered(verse.verse_key)}
                                            on:focus={() => handleVerseHovered(verse.verse_key)}
                                            on:mouseout={() => handleVerseHovered(null)}
                                            on:blur={() => handleVerseHovered(null)}
                                        >
                                            {word.text_imlaei}
                                        </span>
                                    </div>
                                {/if}
                            {/each}
                        {/each}
                    </div>
                {/each}
            </div>

        </div>
    </div>