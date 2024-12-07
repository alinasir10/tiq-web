// @ts-nocheck
import { writable, get } from 'svelte/store';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firebase } from '$lib/firebase';

const createDailyProgressStore = () => {
	const { subscribe, set, update } = writable({
		data: null,
		loading: true,
		error: null,
		initialized: false,
		streak: 0,
		userLevel: 1,
		hasTodayProgress: false
	});

	const getFormattedDate = (date = new Date()) => {
		return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }))
			.toISOString()
			.split('T')[0];
	};

	const getPakistanTimestamp = () => {
		return new Date(
			new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' })
		).toISOString();
	};

	// Cache date calculations
	const TODAY = getFormattedDate();
	const YESTERDAY = getFormattedDate(new Date(Date.now() - 86400000));

	// Remove the space from sanitizeDocId
	const sanitizeDocId = (id) => id.trim();

	const getDocRef = (userId, date) =>
		doc(firebase.db, 'dailyProgress', sanitizeDocId(`${userId}_${date}`));
	const getStreakRef = (userId) => doc(firebase.db, 'streaks', userId);
	const getUserDoc = (userId) => doc(firebase.db, 'users', userId);

	const getFirestoreDoc = async (docRef) => {
		try {
			const docSnap = await getDoc(docRef);
			return { exists: docSnap.exists(), data: docSnap.exists() ? docSnap.data() : null };
		} catch (error) {
			return { exists: false, data: null, error };
		}
	};

	const handleStreak = async (userId, hasCompletedToday) => {
		const userDoc = await getDoc(getUserDoc(userId));
		if (!userDoc.exists()) return { streak: 0, level: 1 };

		const userData = userDoc.data();
		const [{ data: yesterdayData }, { data: streakData }, { data: todayData }] =
			await Promise.all([
				getFirestoreDoc(getDocRef(userId, YESTERDAY)),
				getFirestoreDoc(getStreakRef(userId)),
				getFirestoreDoc(getDocRef(userId, TODAY))
			]);

		const yesterdayComplete = yesterdayData?.progress === 100;
		const currentStreak = streakData?.currentStreak || 0;
		const wasComplete = todayData?.progress === 100;
		let newStreak = currentStreak;

		// Calculate streak
		if (!yesterdayComplete && currentStreak === 0) {
			newStreak = hasCompletedToday ? 1 : 0;
		} else if (yesterdayComplete) {
			if (hasCompletedToday && !wasComplete) {
				newStreak = currentStreak + 1;
			} else if (!hasCompletedToday && wasComplete) {
				newStreak = currentStreak - 1;
			} else {
				newStreak = currentStreak;
			}
		}

		// Determine new level based on streak
		let newLevel = 1;
		if (newStreak >= 30) {
			newLevel = 3;
		} else if (newStreak >= 20) {
			newLevel = 3;
		} else if (newStreak >= 10) {
			newLevel = 2;
		}

		// Update user level and streak
		await Promise.all([
			setDoc(
				getUserDoc(userId),
				{
					...userData,
					level: newLevel,
					lastUpdated: getPakistanTimestamp()
				},
				{ merge: true }
			),
			setDoc(getStreakRef(userId), {
				currentStreak: Math.max(0, newStreak),
				lastUpdated: getPakistanTimestamp()
			})
		]);

		return { streak: Math.max(0, newStreak), level: newLevel };
	};

	const initialize = async (userId) => {
		set({ ...get({ subscribe }), loading: true });

		try {
			const userDoc = await getDoc(getUserDoc(userId));
			if (!userDoc.exists()) {
				throw new Error('User document not found');
			}

			const [todayDoc, streakDoc, yesterdayDoc] = await Promise.all([
				getFirestoreDoc(getDocRef(userId, TODAY)),
				getFirestoreDoc(getStreakRef(userId)),
				getFirestoreDoc(getDocRef(userId, YESTERDAY))
			]);

			const streak = streakDoc.data?.currentStreak || 0;
			const hasTodayProgress = !!todayDoc.data;

			// Determine correct level based on streak
			let newLevel = 1;
			if (streak >= 30) newLevel = 3;
			else if (streak >= 20) newLevel = 3;
			else if (streak >= 10) newLevel = 2;

			// Force update user level
			await setDoc(
				getUserDoc(userId),
				{
					...userDoc.data(),
					level: newLevel,
					lastUpdated: getPakistanTimestamp()
				},
				{ merge: true }
			);

			set({
				data: todayDoc.data,
				loading: false,
				error: null,
				initialized: true,
				streak,
				userLevel: newLevel,
				hasTodayProgress
			});

			return todayDoc.data;
		} catch (error) {
			console.error('Initialize error:', error);
			set({
				data: null,
				loading: false,
				error: error.message,
				initialized: true,
				streak: 0,
				userLevel: 1
			});
			return null;
		}
	};

	const saveProgress = async (userId, progressData) => {
		if (!userId || !progressData) return false;

		try {
			// First handle streak calculation
			const { streak: newStreak, level: newLevel } = await handleStreak(
				userId,
				progressData.progress === 100
			);

			// Then save the progress data
			const docRef = getDocRef(userId, TODAY);
			await setDoc(docRef, {
				...progressData,
				updatedAt: new Date().toISOString()
			});

			set({
				data: progressData,
				loading: false,
				error: null,
				initialized: true,
				streak: newStreak,
				userLevel: newLevel
			});
			return true;
		} catch (error) {
			console.error('Save progress error:', error);
			update((s) => ({ ...s, error: error.message || 'Failed to save progress' }));
			return false;
		}
	};

	const reset = () =>
		set({
			data: null,
			loading: true,
			error: null,
			initialized: false,
			streak: 0,
			userLevel: 1
		});

	return {
		subscribe,
		initialize,
		saveProgress,
		reset
	};
};

export const dailyProgressStore = createDailyProgressStore();
