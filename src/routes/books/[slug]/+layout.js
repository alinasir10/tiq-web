import { error, redirect } from '@sveltejs/kit';
import {data} from '$lib/data.js'


/** @type {import('./$types').PageLoad} */
export function load({ params, url }) {
    const {slug} = params

    // Checking if book exists
    const book = data.books.filter((b) => b.slug.toLowerCase() === slug.toLowerCase())[0] || null

    // Not Found
    if (!book) error(404, 'Not found')


    let lang = url.searchParams.get('lang')
    if (lang) {
        // Checking if book is available in requested language
        if (! book.languages.filter(l => l.lang === lang).length) lang = null
    }
    let topic = url.searchParams.get('topic')
    if (topic) {
        // Checking if requested topic is available
        if (! book.topics.filter(t => t.slug === topic).length) topic = null
    }


    // Creating new proper url with default values if not provided
    if (!lang || !topic) {
        // Selecting book's original language
        lang = lang || book.languages.filter(l => l.contentType === 'Original')[0].lang

        // Selecting book's original language
        topic = topic || book.topics[0].slug

        const newSearchParams = new URLSearchParams();
        newSearchParams.set('lang', lang);
        newSearchParams.set('topic', topic);

        const newUrl = `${url.pathname}?${newSearchParams.toString()}`;
        redirect(302, newUrl)
    }

    return {
        book,
        lang,
        topic,
    }
}