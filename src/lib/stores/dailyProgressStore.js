// @ts-nocheck
import { writable, get } from 'svelte/store';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebase } from '$lib/firebase';

const createDailyProgressStore = () => {
	const getPKTDate = (date = new Date()) => {
		const pktDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));

		const offset = pktDate.getTimezoneOffset();
		return new Date(pktDate.getTime() - offset * 60 * 1000);
	};

	const getFormattedDate = (date = new Date()) => {
		const pktDate = getPKTDate(date);
		return pktDate.toISOString().split('T')[0];
	};

	const { subscribe, set, update } = writable({
		levels: {},
		loading: true,
		error: null,
		initialized: false,
		streak: 0,
		levelStartDates: {},
		hasTodayProgress: false,
		unlockedLevels: new Set([1])
	});

	const TODAY = getFormattedDate();
	const YESTERDAY = getFormattedDate(new Date(getPKTDate().getTime() - 86400000));

	const getDailyProgressDocRef = (userId, level, date) =>
		doc(firebase.db, 'dailyProgress', `${userId}_${level}_${date}`);
	const getUserDoc = (userId) => doc(firebase.db, 'users', userId);
	const getStreakRef = (userId) => doc(firebase.db, 'streaks', userId);

	const getFirestoreDoc = async (docRef) => {
		try {
			const docSnap = await getDoc(docRef);
			return { exists: docSnap.exists(), data: docSnap.exists() ? docSnap.data() : null };
		} catch (error) {
			return { exists: false, data: null, error };
		}
	};

	const loadTodayProgress = async (userId, level, date) => {
		const docRef = getDailyProgressDocRef(userId, level, date);
		const docSnap = await getDoc(docRef);
		return docSnap.exists() ? docSnap.data() : null;
	};

	const getHighestRequiredLevel = (unlockedLevels) => {
		const levels = Array.from(unlockedLevels);
		return Math.max(...levels);
	};

	const checkYesterdayProgress = async (userId, level, unlockedLevels) => {
		if (!level || !unlockedLevels) return false;

		const yesterdayDoc = await getDoc(getDailyProgressDocRef(userId, level, YESTERDAY));
		if (yesterdayDoc.exists()) {
			return yesterdayDoc.data()?.progress === 100;
		}

		if (level > 1 && unlockedLevels.has(level)) {
			const previousLevelDoc = await getDoc(
				getDailyProgressDocRef(userId, level - 1, YESTERDAY)
			);
			return previousLevelDoc.exists() ? previousLevelDoc.data()?.progress === 100 : false;
		}

		return false;
	};

	const handleStreak = async (userId, progressData) => {
		const userDoc = await getDoc(getUserDoc(userId));
		if (!userDoc.exists()) return { streak: 0, unlockedLevels: new Set([1]) };

		const userData = userDoc.data();
		const unlockedLevels = new Set(userData.unlockedLevels || [1]);
		const { data: streakData } = await getFirestoreDoc(getStreakRef(userId));
		const currentStreak = streakData?.currentStreak || 0;

		const todayDoc = await getDoc(getDailyProgressDocRef(userId, progressData.level, TODAY));
		const hadTodayComplete = todayDoc.exists() && todayDoc.data()?.progress === 100;

		const highestLevel = getHighestRequiredLevel(unlockedLevels);

		if (progressData.level !== highestLevel || hadTodayComplete) {
			return { streak: currentStreak, unlockedLevels };
		}

		const hadYesterdayComplete = await checkYesterdayProgress(
			userId,
			highestLevel,
			unlockedLevels
		);
		const is100PercentComplete = progressData.progress === 100;

		let newStreak = currentStreak;
		if (hadYesterdayComplete) {
			if (is100PercentComplete && !hadTodayComplete) {
				newStreak = currentStreak + 1;
			}
		} else {
			newStreak = is100PercentComplete ? 1 : 0;
		}

		const { unlockedLevels: updatedLevels, levelUnlocks } = await updateUnlockedLevels(
			userId,
			newStreak
		);

		await Promise.all([
			setDoc(getStreakRef(userId), {
				currentStreak: newStreak,
				lastUpdated: serverTimestamp()
			}),
			setDoc(
				getUserDoc(userId),
				{
					...userData,
					unlockedLevels: Array.from(updatedLevels),
					levelUnlocks,
					lastUpdated: serverTimestamp()
				},
				{ merge: true }
			)
		]);

		return { streak: newStreak, unlockedLevels: updatedLevels, levelUnlocks };
	};

	const updateUnlockedLevels = async (userId, currentStreak) => {
		const userDoc = await getDoc(getUserDoc(userId));
		if (!userDoc.exists()) return new Set([1]);

		const userData = userDoc.data();
		let unlockedLevels = new Set(userData.unlockedLevels || [1]);
		let levelUnlocks = userData.levelUnlocks || { 1: serverTimestamp() };
		let needsUpdate = false;

		if (currentStreak >= 20 && !unlockedLevels.has(3)) {
			unlockedLevels.add(3);
			levelUnlocks[3] = serverTimestamp();
			needsUpdate = true;
		}
		if (currentStreak >= 10 && !unlockedLevels.has(2)) {
			unlockedLevels.add(2);
			levelUnlocks[2] = serverTimestamp();
			needsUpdate = true;
		}

		if (needsUpdate) {
			await setDoc(
				getUserDoc(userId),
				{
					...userData,
					unlockedLevels: Array.from(unlockedLevels),
					levelUnlocks,
					level: Math.max(...Array.from(unlockedLevels)),
					lastUpdated: serverTimestamp()
				},
				{ merge: true }
			);
		}

		return { unlockedLevels, levelUnlocks };
	};

	const initialize = async (userId) => {
		set({ ...get({ subscribe }), loading: true });

		try {
			// console.log(`Initializing daily progress for user ${userId}`);
			const userDoc = await getDoc(getUserDoc(userId));
			if (!userDoc.exists()) throw new Error('User document not found');

			const userData = userDoc.data();
			// console.log('User data:', userData);
			const { data: streakData } = await getFirestoreDoc(getStreakRef(userId));
			const currentStreak = streakData?.currentStreak || 0;
			// console.log('Current streak:', currentStreak);

			const { unlockedLevels } = await updateUnlockedLevels(userId, currentStreak);
			// console.log('Unlocked levels:', unlockedLevels);

			const levelData = {};
			const loadPromises = Array.from(unlockedLevels).map((level) =>
				loadTodayProgress(userId, level, TODAY)
			);

			const progressResults = await Promise.all(loadPromises);
			// console.log('Progress results:', progressResults);

			Array.from(unlockedLevels).forEach((level, index) => {
				if (progressResults[index]) {
					levelData[level] = progressResults[index];
				}
			});

			set({
				levels: levelData,
				loading: false,
				error: null,
				initialized: true,
				streak: currentStreak,
				levelStartDates: userData.levelStartDates || {},
				hasTodayProgress: Object.keys(levelData).length > 0,
				unlockedLevels
			});
		} catch (error) {
			// console.error('Initialize error:', error);
			set({
				levels: {},
				loading: false,
				error: error.message,
				initialized: true,
				streak: 0,
				levelStartDates: {},
				hasTodayProgress: false,
				unlockedLevels: new Set([1])
			});
		}
	};

	const saveProgress = async (userId, progressData) => {
		if (!userId || !progressData) return false;

		try {
			// console.log(`Saving progress for user ${userId} at level ${progressData.level}`);
			const level = progressData.level;
			const today = getFormattedDate();

			const progressRef = getDailyProgressDocRef(userId, level, today);
			await setDoc(
				progressRef,
				{
					...progressData,
					date: today,
					updatedAt: serverTimestamp(),
					createdAt: serverTimestamp()
				},
				{ merge: true }
			);

			const { streak: newStreak, unlockedLevels } = await handleStreak(userId, progressData);
			// console.log('New streak:', newStreak);
			// console.log('Updated unlocked levels:', unlockedLevels);

			update((state) => ({
				...state,
				streak: newStreak,
				unlockedLevels,
				levels: {
					...state.levels,
					[level]: progressData
				}
			}));

			return true;
		} catch (error) {
			// console.error('Save progress error:', error);
			update((s) => ({ ...s, error: error.message }));
			return false;
		}
	};

	const reset = () => {
		set({
			levels: {},
			loading: true,
			error: null,
			initialized: false,
			streak: 0,
			levelStartDates: {},
			hasTodayProgress: false,
			unlockedLevels: new Set([1])
		});
	};

	return {
		subscribe,
		initialize,
		saveProgress,
		getFormattedDate,
		reset
	};
};

export const dailyProgressStore = createDailyProgressStore();
