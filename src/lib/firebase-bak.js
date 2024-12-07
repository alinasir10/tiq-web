/** @type {import('firebase/app').FirebaseApp} */
export let firebaseApp

/** @type {import('firebase/auth').Auth} */
export let firebaseAuth

/** @type {import('firebase/analytics').Analytics} */
export let firebaseAnalytics

// Initialize Firebase only if running in the browser
if (typeof window !== 'undefined') {
    (async () => {
        const { initializeApp } = await import('firebase/app')
        const { getAuth } = await import('firebase/auth')
        const { getAnalytics } = await import('firebase/analytics')

        const firebaseConfig = {
            apiKey: "AIzaSyDsWjMn2wjPGAMB3ADDaLJSWLqH3p-6gx4",
            authDomain: "tiq-web-20438.firebaseapp.com",
            projectId: "tiq-web-20438",
            storageBucket: "tiq-web-20438.firebasestorage.app",
            messagingSenderId: "591181212982",
            appId: "1:591181212982:web:50bc220f44549a3e3c1797",
            measurementId: "G-WFZQ1PE354"
        }

        firebaseApp = initializeApp(firebaseConfig)
        firebaseAuth = getAuth(firebaseApp)
        firebaseAnalytics = getAnalytics(firebaseApp)
    })()
}
