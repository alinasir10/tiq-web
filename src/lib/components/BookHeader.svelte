<script>
    import {page} from '$app/stores'

    import {
        Navbar,
        NavBrand,
        Dropdown,
        DropdownItem,
        DropdownDivider,
        Button,
        ButtonGroup,
    } from 'flowbite-svelte';
    import {ChevronDownOutline, DownloadSolid, ShareNodesSolid} from 'flowbite-svelte-icons';
    import {ShareLink} from '$lib/components/ShareLinkAction'
    import { goto } from '$app/navigation';

    export let book
    export let lang
    export let topic

    console.log($page.url)

     const generateLangLink = (languageSlug) => {
        const url = $page.url.pathname
        const pageQuery = new URLSearchParams()
        pageQuery.set('lang', languageSlug)
        pageQuery.set('topic', topic)

        return url + '?' + pageQuery.toString()
    }

    const generateTopicLink = (topicSlug) => {
        const url = $page.url.pathname
        const pageQuery = new URLSearchParams()
        pageQuery.set('lang', lang)
        pageQuery.set('topic', topicSlug)

        return url + '?' + pageQuery.toString()
    }
</script>

<Navbar>
  <NavBrand href="/">
    <img src={book.image} class="me-3 h-8 sm:h-9" alt="The Secrets Of Divine Love" />
    <span class="self-center text-xs max-w-24 font-semibold dark:text-white">
        {book.name}
    </span>
  </NavBrand>

  <ButtonGroup>
    <Button size=sm class="!p-2 uppercase">
      {lang}
    </Button>
    <Dropdown>
        {#each book.languages as bookLang}
            <DropdownItem class="{bookLang.lang === lang && 'font-bold text-primary-600'}" on:click={() => goto(generateLangLink(bookLang.lang), {replaceState: true})}>
                {bookLang.name}
                <span class="text-xs text-gray-500">({bookLang.contentType})</span>
            </DropdownItem>
        {/each}
    </Dropdown>
    <Button size=sm class="!p-2">
      Introduction
      <ChevronDownOutline/>
    </Button>
    <Dropdown class="overflow-y-auto h-48">
        {#each book.topics as bookTopic}
            {#if bookTopic.type === "topic"}
                <DropdownItem class="{bookTopic.slug === topic && 'font-bold text-primary-600'}" on:click={() => goto(generateTopicLink(bookTopic.slug))}>{bookTopic.name}</DropdownItem>
            {:else}
                <DropdownDivider />
            {/if}
        {/each}
        <DropdownItem slot="footer" class="flex items-center px-3 py-2 -mb-1 text-sm font-medium text-primary-600 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-primary-500 hover:underline">
            Show Details
        </DropdownItem>
    </Dropdown>
  </ButtonGroup>

  <ButtonGroup>
    <Button class="!p-2">
      <DownloadSolid size="sm"/>
    </Button>
    <Button class="!p-2" on:click={() => ShareLink()}>
      <ShareNodesSolid size="sm"/>
    </Button>
  </ButtonGroup>
</Navbar>