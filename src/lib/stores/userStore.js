// @ts-nocheck
import { writable } from 'svelte/store';
import { firebase } from '$lib/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

const createUserStore = () => {
	const { subscribe, set } = writable({
		isAuthenticated: false,
		user: null,
		loading: true,
		error: null
	});

	return {
		subscribe,
		initialize: () => {
			if (typeof window === 'undefined' || !firebase?.auth) return;

			onAuthStateChanged(
				firebase.auth,
				(user) => {
					set({
						isAuthenticated: !!user,
						user: user
							? {
									displayName: user.displayName || 'User',
									email: user.email,
									uid: user.uid
								}
							: null,
						loading: false,
						error: null
					});
				},
				(error) =>
					set({
						isAuthenticated: false,
						user: null,
						loading: false,
						error: error.message
					})
			);
		},
		refresh: (user) => {
			set({
				isAuthenticated: !!user,
				user: user
					? {
							displayName: user.displayName || 'User',
							email: user.email,
							uid: user.uid
						}
					: null,
				loading: false,
				error: null
			});
		},
		reset: () =>
			set({
				isAuthenticated: false,
				user: null,
				loading: false,
				error: null
			})
	};
};

export const userStore = createUserStore();
