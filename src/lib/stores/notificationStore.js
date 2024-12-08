import { writable } from 'svelte/store';

export const notificationStore = writable({
	show: false,
	message: '',
	type: 'info' // 'info', 'success', 'warning', 'error'
});
