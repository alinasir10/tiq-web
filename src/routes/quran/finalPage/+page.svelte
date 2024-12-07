<script>
    import {api} from '$lib/quranApi.js'
    import '$lib/styles/quranTajweed.css'
    import {onMount} from 'svelte'

    let pageNumber = 10
    let hoveredVerse = null
    let verses = []
    let scale = 1
    let showTajweed = true

    let fontUrl = `https://quran.com/fonts/quran/hafs/v4/colrv1/woff2/p${pageNumber}.woff2`;
    const loadFont = () => {
        const fontFace = new FontFace(`Digital Khatt2`, `url('/fonts/Digital_Khatt_V2.otf')`, {
            weight: 'normal',
            style: 'normal'
          });
          fontFace.load().then((loadedFont) => {
            document.fonts.add(loadedFont);
          });
    }

    const loadFont2 = () => {
        const fontFace = new FontFace("Digital Khatt", "url('/fonts/digitalkhatt.otf')", {
          weight: "normal",
          style: "normal",
        });
        fontFace.load().then((loadedFont) => {
          document.fonts.add(loadedFont);
        });
      };

    $ : if (typeof window !== 'undefined' && 'FontFace' in window) {
        fontUrl = `https://quran.com/fonts/quran/hafs/v4/colrv1/woff2/p${pageNumber}.woff2`;
        loadFont()
//        loadFont2()
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

        <label>
            <span>Tajweed</span>
            <input
              type="checkbox"
              class="toggle border-blue-500 bg-blue-500 [--tglbg:yellow] hover:bg-blue-700"
              bind:checked={showTajweed} />
        </label>
    </div>

    <div bind:this={wrapper} class="relative flex flex-1 w-full items-start justify-{justifyContent} p-8" class:tajweed={showTajweed} style="font-family: 'Digital Khatt2';">
        <div class="flex flex-col px-16 py-8 leading-loose bg-white text-black w-[148mm] h-[210mm] origin-top transition-all text-2xl border" style="transform: scale({scale}); transform-origin: {transformOrigin};" dir=rtl>
                {#each Array.from({ length: 15 }) as _, lineIndex}
                    <div id="line" class="flex w-full justify-stretch text-justify items-center line-{lineIndex} border-b border-yellow-50">
                        {#each verses as verse}
                            {#each verse.words as word, index}
                                {#if word.line_number === lineIndex + 1}
                                    <div id="word-wrapper" class="flex-grow flex rounded justify-center {hoveredVerse === verse.verse_key ? 'bg-neutral-100' : ''}">
                                        <span id="word" role=none class=" hover:bg-neutral-200 rounded"
                                            on:mouseover={() => handleVerseHovered(verse.verse_key)}
                                            on:focus={() => handleVerseHovered(verse.verse_key)}
                                            on:mouseout={() => handleVerseHovered(null)}
                                            on:blur={() => handleVerseHovered(null)}
                                        >
                                             {@html word.text_uthmani_tajweed}
                                        </span>
                                    </div>
                                {/if}
                            {/each}
                        {/each}
                    </div>
                {/each}
                <div class="flex w-full justify-center font-bold text-xs mt-2 font-mono">
                    {pageNumber}
                </div>
            </div>

        </div>
</div>