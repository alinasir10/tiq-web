import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

// Keep both Firebase configurations for reference
// const firebaseConfig = {
//     apiKey: "AIzaSyDsWjMn2wjPGAMB3ADDaLJSWLqH3p-6gx4",
//     authDomain: "tiq-web-20438.firebaseapp.com",
//     projectId: "tiq-web-20438",
//     storageBucket: "tiq-web-20438.firebasestorage.app",
//     messagingSenderId: "591181212982",
//     appId: "1:591181212982:web:50bc220f44549a3e3c1797",
//     measurementId: "G-WFZQ1PE354"
// }

const firebaseConfig = {
	apiKey: 'AIzaSyDI6z9uCUQh3-Ca0Q2vwR1wzQUptD2HWao',
	authDomain: 'sunnah-project.firebaseapp.com',
	projectId: 'sunnah-project',
	storageBucket: 'sunnah-project.firebasestorage.app',
	messagingSenderId: '885482210090',
	appId: '1:885482210090:web:19c5a3a6080f8e4310d453',
	measurementId: 'G-1RBCZJPY27'
};

class FirebaseService {
	auth;
	db;
	analytics;

	constructor() {
		const apps = getApps();
		const app = apps.length ? apps[0] : initializeApp(firebaseConfig);

		this.auth = getAuth(app);
		this.db = getFirestore(app);

		if (typeof window !== 'undefined') {
			this.analytics = getAnalytics(app);
		}
	}
}

// Create and export a singleton instance
const firebase = new FirebaseService();
export { firebase };
