// Import the necessary Firebase modules
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getAnalytics } from 'firebase/analytics'
import { Firestore, getFirestore } from 'firebase/firestore';


// Your Firebase configuration object (from Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyDsWjMn2wjPGAMB3ADDaLJSWLqH3p-6gx4",
    authDomain: "tiq-web-20438.firebaseapp.com",
    projectId: "tiq-web-20438",
    storageBucket: "tiq-web-20438.firebasestorage.app",
    messagingSenderId: "591181212982",
    appId: "1:591181212982:web:50bc220f44549a3e3c1797",
    measurementId: "G-WFZQ1PE354"
}

// Declare variables to hold the initialized Firebase services
let firebaseApp = null
let firebaseAuth = null
let firebaseAnalytics = null
let db = Firestore;
// Function to initialize Firebase App if it's not already initialized
export function initializeIfNotAlready() {
    if (typeof window !== 'undefined' && getApps().length === 0) {
        firebaseApp = initializeApp(firebaseConfig)
        firebaseAuth = getAuth(firebaseApp)
        firebaseAnalytics = getAnalytics(firebaseApp)
        db=getFirestore(firebaseApp)
    }
}
   

// Export the initialized Firebase services
export { firebaseApp, firebaseAuth, firebaseAnalytics }
export{db}