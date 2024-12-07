import { writable } from 'svelte/store'
import { firebaseAuth } from '$lib/firebase.js'
import { onAuthStateChanged } from 'firebase/auth'

// Writable store to manage user authentication state
export const userStore = writable({
    isAuthenticated: false,
    user: null,
})

// Function to initialize the authentication listener
export const initializeAuth = () => {
    if (typeof window !== 'undefined' && firebaseAuth) {
        // Set up the authentication state listener
        onAuthStateChanged(firebaseAuth, (authUser) => {
            if (authUser) {
                // Update the store with user details if logged in
                userStore.set({
                    isAuthenticated: true,
                    user: {
                        displayName: authUser.displayName || 'User Name',
                        email: authUser.email,
                    },
                })
            } else {
                // Update the store to indicate no user is logged in
                userStore.set({
                    isAuthenticated: false,
                    user: null,
                })
            }
        })
    }
}
