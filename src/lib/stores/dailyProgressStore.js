// @ts-nocheck
import { writable, get } from 'svelte/store';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebase } from '$lib/firebase';
import { notificationStore } from './notificationStore';

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

	const handleStreak = async (userId, progressData) => {
		const userDoc = await getDoc(getUserDoc(userId));
		if (!userDoc.exists()) return { streak: 0, unlockedLevels: new Set([1]) };

		const userData = userDoc.data();
		const unlockedLevels = new Set(userData.unlockedLevels || [1]);
		const highestLevel = getHighestRequiredLevel(unlockedLevels);

		const streakRef = getStreakRef(userId);
		const streakDoc = await getDoc(streakRef);
		const streakData = streakDoc.data() || {};
		const { currentStreak = 0, lastStreakDate, lastResetStreak } = streakData;

		if (progressData.level !== highestLevel) {
			return { streak: currentStreak, unlockedLevels };
		}

		let newStreak = currentStreak;

		if (progressData.progress === 100) {
			if (lastStreakDate === TODAY && streakData.lastProgress < 100) {
				newStreak = Math.min(lastResetStreak || currentStreak + 1, currentStreak + 1);
			} else if (lastStreakDate === YESTERDAY) {
				newStreak = currentStreak + 1;
			} else if (!lastStreakDate || lastStreakDate < YESTERDAY) {
				newStreak = 1;
			}
		} else if (streakData.lastProgress === 100 && progressData.progress < 100) {
			newStreak = Math.max(0, currentStreak - 1);
			await setDoc(
				streakRef,
				{
					currentStreak: newStreak,
					lastResetStreak: currentStreak,
					lastProgress: progressData.progress,
					lastUpdated: serverTimestamp(),
					lastStreakDate: TODAY
				},
				{ merge: true }
			);
			return { streak: newStreak, unlockedLevels };
		}

		// Update streak if changed
		if (newStreak !== currentStreak) {
			await setDoc(
				streakRef,
				{
					currentStreak: newStreak,
					lastProgress: progressData.progress,
					lastUpdated: serverTimestamp(),
					lastStreakDate: TODAY,
					lastResetStreak: null // Clear reset value on successful increment
				},
				{ merge: true }
			);

			const { unlockedLevels: updatedLevels, levelUnlocks } = await updateUnlockedLevels(
				userId,
				newStreak
			);
			return { streak: newStreak, unlockedLevels: updatedLevels, levelUnlocks };
		}

		// Always update last progress
		await setDoc(
			streakRef,
			{
				lastProgress: progressData.progress,
				lastUpdated: serverTimestamp(),
				lastStreakDate: TODAY
			},
			{ merge: true }
		);

		return { streak: currentStreak, unlockedLevels };
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

	const validateStreak = async (userId, currentStreak, unlockedLevels) => {
		if (currentStreak === 0) return { streak: 0, message: null };

		const streakRef = getStreakRef(userId);
		const highestLevel = getHighestRequiredLevel(unlockedLevels);

		// Special handling for newly unlocked levels
		if (highestLevel > 1) {
			// For level 2 (unlocked at 10 days)
			if (highestLevel === 2 && currentStreak === 10) {
				return { streak: currentStreak, message: null };
			}
			// For level 3 (unlocked at 20 days)
			if (highestLevel === 3 && currentStreak === 20) {
				return { streak: currentStreak, message: null };
			}
		}

		// Check yesterday's progress for highest level
		const yesterdayDoc = await getDoc(getDailyProgressDocRef(userId, highestLevel, YESTERDAY));

		// If no yesterday record, check if this is a level transition day
		if (!yesterdayDoc.exists()) {
			// Check previous level's progress if this is a newly unlocked level
			const previousLevelDoc = await getDoc(
				getDailyProgressDocRef(userId, highestLevel - 1, YESTERDAY)
			);

			if (previousLevelDoc.exists() && previousLevelDoc.data()?.progress === 100) {
				return { streak: currentStreak, message: null };
			}
		} else if (yesterdayDoc.data()?.progress === 100) {
			return { streak: currentStreak, message: null };
		}

		// Reset streak if no valid progress found
		await setDoc(
			streakRef,
			{
				currentStreak: 0,
				lastUpdated: serverTimestamp(),
				lastResetStreak: currentStreak
			},
			{ merge: true }
		);

		return {
			streak: 0,
			message: `Streak reset! Make sure to complete your daily tasks to maintain your streak.`
		};
	};

	const initialize = async (userId) => {
		set({ ...get({ subscribe }), loading: true });

		try {
			const userDoc = await getDoc(getUserDoc(userId));
			if (!userDoc.exists()) throw new Error('User document not found');

			const userData = userDoc.data();
			const { data: streakData } = await getFirestoreDoc(getStreakRef(userId));
			let currentStreak = streakData?.currentStreak || 0;

			const unlockedLevels = new Set(userData.unlockedLevels || [1]);

			const { streak: validatedStreak, message } = await validateStreak(
				userId,
				currentStreak,
				unlockedLevels
			);
			if (message) {
				notificationStore.set({ show: true, message, type: 'warning' });
			}
			currentStreak = validatedStreak;

			const { unlockedLevels: updatedLevels } = await updateUnlockedLevels(
				userId,
				currentStreak
			);

			const levelData = {};
			const loadPromises = Array.from(updatedLevels).map((level) =>
				loadTodayProgress(userId, level, TODAY)
			);

			const progressResults = await Promise.all(loadPromises);

			Array.from(updatedLevels).forEach((level, index) => {
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
				unlockedLevels: updatedLevels
			});
		} catch (error) {
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
