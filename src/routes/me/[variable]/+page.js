import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
    let {variable} = params

    let acceptedValues = ['4564', 'er546', 'hfdjsfh']

    // Not Found
	if (! acceptedValues.includes(variable)) error(404, 'Not found')

    return {
        value: variable,
    }
}