// @ts-nocheck
import { writable } from 'svelte/store';
import { firebase } from '$lib/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';

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
				async (user) => {
					if (user) {
						// Get additional user data from Firestore
						const userDoc = await getDoc(doc(firebase.db, 'users', user.uid));
						const userData = userDoc.data();

						set({
							isAuthenticated: true,
							user: {
								displayName: userData?.name || user.displayName || 'User',
								email: user.email,
								uid: user.uid,
								level: userData?.level || 1
							},
							loading: false,
							error: null
						});
					} else {
						set({
							isAuthenticated: false,
							user: null,
							loading: false,
							error: null
						});
					}
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
