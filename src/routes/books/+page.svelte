<script>
    import { Badge, Button } from 'flowbite-svelte';
    import { ChevronRightOutline } from 'flowbite-svelte-icons';
    import BookImage from '$lib/components/BookImage.svelte';
    import { data } from '$lib/data.js';

    let infoExpanded = false;
</script>

<div class="flex flex-col p-8">
    <h1 class="mb-4 text-5xl font-extrabold text-gray-900 dark:text-white md:text-7xl lg:text-8xl">
        <span class="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">Books</span>
    </h1>

    {#each data.books as book}
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div class="flex flex-col w-full border p-4 rounded-lg gap-4">
                <div class="flex w-full gap-4">
                    <div class="flex flex-col gap-2 w-48">
                        <BookImage src="/images/TheSecretsOfDivineLove.jpg"></BookImage>
                        <div class="flex flex-wrap gap-1">
                            {#each book.languages as lang}
                                <Badge color="dark">{lang.name}</Badge>
                            {/each}
                        </div>
                        <div class="flex flex-wrap gap-1">
                            <Badge>{book.topics.filter((t) => t.type !== 'divider').length} Topics</Badge>
                        </div>
                    </div>

                    <div class="flex flex-col w-full gap-1">
                        <h2 class="font-bold text-2xl text-gray-900 dark:text-white md:text-3xl lg:text-4xl">
                            {book.name}
                        </h2>
                        <cite class="text text-gray-500 dark:text-gray-400">{book.author}</cite>

                        <p class="text-sm md:text-base {infoExpanded ? '' : 'line-clamp-[10]'}" on:click={() => infoExpanded = !infoExpanded}>
                            {book.about}
                        </p>
                    </div>
                </div>

                <Button size="xl" class="w-full" href="/books/{book.slug}">
                    Read Now
                    <ChevronRightOutline />
                </Button>
            </div>
        </div>
    {/each}
</div>
