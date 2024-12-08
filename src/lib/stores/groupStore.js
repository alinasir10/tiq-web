// @ts-nocheck
import { writable } from 'svelte/store';
import { firebase } from '$lib/firebase';
import {
	collection,
	doc,
	getDoc,
	setDoc,
	updateDoc,
	query,
	where,
	getDocs,
	deleteDoc,
	writeBatch,
	arrayUnion,
	arrayRemove,
	serverTimestamp
} from 'firebase/firestore';

const createGroupStore = () => {
	const { subscribe, update } = writable({
		loading: false,
		initialized: false,
		userGroups: [],
		error: null
	});

	const getUserDisplayName = async (userId) => {
		try {
			const userDoc = await getDoc(doc(firebase.db, 'users', userId));
			return userDoc.exists() ? userDoc.data().name : 'Unknown';
		} catch (error) {
			// console.error('Error fetching user name:', error);
			return 'Unknown';
		}
	};

	const getMemberProgress = async (userId) => {
		try {
			const today = new Date().toISOString().split('T')[0];
			const [progressDoc, userDoc] = await Promise.all([
				getDoc(doc(firebase.db, 'dailyProgress', `${userId}_${today}`)),
				getDoc(doc(firebase.db, 'users', userId))
			]);

			return {
				progress: progressDoc.exists() ? progressDoc.data().progress : 0,
				level: userDoc.exists() ? userDoc.data().level : 1,
				lastUpdate: progressDoc.exists() ? progressDoc.data().updatedAt : null
			};
		} catch (error) {
			// console.error('Error fetching member progress:', error);
			return { progress: 0, level: 1, lastUpdate: null };
		}
	};

	const getInviteInfo = async (inviteId) => {
		const inviteRef = doc(firebase.db, 'groupInvites', inviteId);
		const inviteDoc = await getDoc(inviteRef);

		if (!inviteDoc.exists()) throw new Error('Invite not found');

		const groupRef = doc(firebase.db, 'groups', inviteDoc.data().groupId);
		const groupDoc = await getDoc(groupRef);

		if (!groupDoc.exists()) throw new Error('Group not found');

		const ownerName = await getUserDisplayName(groupDoc.data().ownerId);

		return {
			name: groupDoc.data().name,
			ownerName,
			groupId: groupDoc.id,
			email: inviteDoc.data().email
		};
	};

	const loadMemberLevels = async (memberId) => {
		try {
			const userDoc = await getDoc(doc(firebase.db, 'users', memberId));
			if (!userDoc.exists()) throw new Error('User not found');

			const userData = userDoc.data();
			const levelStartDates = {};

			if (userData.levelUnlocks) {
				for (const [level, timestamp] of Object.entries(userData.levelUnlocks)) {
					levelStartDates[level] = timestamp;
				}
			}

			return {
				unlockedLevels: userData.unlockedLevels || [1],
				levelStartDates: levelStartDates
			};
		} catch (error) {
			// console.error('Error loading member levels:', error);
			return null;
		}
	};

	const loadMemberWeeklyProgress = async (memberId, { level, startDate }) => {
		try {
			const progressData = [];
			const startTimestamp = new Date(startDate.seconds * 1000);
			const startDateStr = startTimestamp.toLocaleString('en-US', {
				timeZone: 'Asia/Karachi'
			});
			const pktDate = new Date(startDateStr);
			pktDate.setHours(0, 0, 0, 0);

			const today = new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' });
			const todayPKT = new Date(today);
			todayPKT.setHours(0, 0, 0, 0);

			const diffTime = todayPKT.getTime() - pktDate.getTime();
			const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
			const currentWeek = Math.floor(diffDays / 7);

			const weekStartDate = new Date(pktDate);
			weekStartDate.setDate(pktDate.getDate() + currentWeek * 7);

			const batch = [];
			const docRefs = [];
			const dateStrings = [];

			for (let i = 0; i < 7; i++) {
				const currentDate = new Date(weekStartDate);
				currentDate.setDate(weekStartDate.getDate() + i);
				const formattedDate = currentDate.toLocaleString('en-US', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit',
					timeZone: 'Asia/Karachi'
				});
				const [month, day, year] = formattedDate.split('/');
				const dateStr = `${year}-${month}-${day}`;
				dateStrings.push(dateStr);

				const docRef = doc(firebase.db, 'dailyProgress', `${memberId}_${level}_${dateStr}`);
				docRefs.push(docRef);
				batch.push(getDoc(docRef));
			}

			const snapshots = await Promise.all(batch);
			snapshots.forEach((docSnap, index) => {
				const data = docSnap.exists() ? docSnap.data() : null;
				if (data) {
					data.date = dateStrings[index];
				}
				progressData[index] = data;
			});

			return progressData;
		} catch (error) {
			return null;
		}
	};

	const loadGroupMembers = async (groupId) => {
		const groupRef = doc(firebase.db, 'groups', groupId);
		const groupDoc = await getDoc(groupRef);

		if (!groupDoc.exists()) throw new Error('Group not found');

		const members = await Promise.all(
			groupDoc.data().members.map(async (memberId) => {
				// console.log(`Fetching data for member ${memberId}`);
				const name = await getUserDisplayName(memberId);
				const progress = await getMemberProgress(memberId);
				const userDoc = await getDoc(doc(firebase.db, 'users', memberId));
				const userData = userDoc.exists() ? userDoc.data() : {};
				const levelStartDates = {};
				if (userData.levelUnlocks) {
					for (const [level, timestamp] of Object.entries(userData.levelUnlocks)) {
						levelStartDates[level] = timestamp;
					}
				}
				// console.log(`Member ${memberId} data:`, userData);
				return {
					id: memberId,
					name,
					isOwner: memberId === groupDoc.data().ownerId,
					unlockedLevels: userData.unlockedLevels || [],
					levelStartDates,
					...progress
				};
			})
		);

		return members;
	};

	const reset = () => {
		update(() => ({
			loading: false,
			initialized: false,
			userGroups: [],
			error: null
		}));
	};

	return {
		subscribe,
		createGroup: async (name, ownerId) => {
			const groupRef = doc(collection(firebase.db, 'groups'));
			await setDoc(groupRef, {
				name,
				ownerId,
				members: [ownerId],
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
				code: groupRef.id
			});
			return groupRef.id;
		},

		inviteUser: async (groupId, email) => {
			const groupRef = doc(firebase.db, 'groups', groupId);
			const groupDoc = await getDoc(groupRef);

			if (!groupDoc.exists()) throw new Error('Group not found');

			const inviteRef = doc(collection(firebase.db, 'groupInvites'));
			await setDoc(inviteRef, {
				groupId,
				email,
				createdAt: serverTimestamp()
			});

			const response = await fetch('/api/send-invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email,
					inviteId: inviteRef.id,
					groupName: groupDoc.data().name
				})
			});

			if (!response.ok) {
				await deleteDoc(inviteRef);
				throw new Error('Failed to send invitation email');
			}

			return inviteRef.id;
		},

		acceptInvite: async (inviteId, userId) => {
			const inviteRef = doc(firebase.db, 'groupInvites', inviteId);
			const inviteDoc = await getDoc(inviteRef);

			if (!inviteDoc.exists()) throw new Error('Invite not found');

			const userEmail = firebase.auth.currentUser?.email;
			if (inviteDoc.data().email.toLowerCase() !== userEmail?.toLowerCase()) {
				throw new Error('This invitation was not meant for you');
			}

			const groupRef = doc(firebase.db, 'groups', inviteDoc.data().groupId);
			const groupDoc = await getDoc(groupRef);

			if (!groupDoc.exists()) throw new Error('Group not found');

			if (groupDoc.data().members.includes(userId)) {
				await deleteDoc(inviteRef);
				throw new Error('You are already a member of this group');
			}

			const batch = writeBatch(firebase.db);
			batch.update(groupRef, {
				members: arrayUnion(userId)
			});
			batch.delete(inviteRef);

			await batch.commit();
		},

		removeMember: async (groupId, memberId) => {
			const groupRef = doc(firebase.db, 'groups', groupId);
			await updateDoc(groupRef, {
				members: arrayRemove(memberId)
			});
		},

		loadUserGroups: async (userId) => {
			update((s) => ({ ...s, loading: true }));
			try {
				const q = query(
					collection(firebase.db, 'groups'),
					where('members', 'array-contains', userId)
				);
				const snapshot = await getDocs(q);
				const groups = snapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data()
				}));
				update((s) => ({ ...s, userGroups: groups, loading: false }));
			} catch (error) {
				update((s) => ({ ...s, error: error.message, loading: false }));
			}
		},

		getInviteInfo,

		declineInvite: async (inviteId) => {
			const inviteRef = doc(firebase.db, 'groupInvites', inviteId);
			await deleteDoc(inviteRef);
		},

		revokeInvite: async (inviteId) => {
			const inviteRef = doc(firebase.db, 'groupInvites', inviteId);
			const inviteDoc = await getDoc(inviteRef);

			if (!inviteDoc.exists()) throw new Error('Invite not found');

			const revokedRef = doc(firebase.db, 'revokedInvites', inviteId);
			await setDoc(revokedRef, {
				revokedAt: serverTimestamp(),
				originalInvite: inviteDoc.data()
			});

			await deleteDoc(inviteRef);
		},

		checkInviteStatus: async (inviteId) => {
			const revokedRef = doc(firebase.db, 'revokedInvites', inviteId);
			const revokedDoc = await getDoc(revokedRef);

			if (revokedDoc.exists()) {
				throw new Error('This invitation has been revoked');
			}

			return await getInviteInfo(inviteId);
		},

		loadGroupInvites: async (groupId) => {
			const q = query(
				collection(firebase.db, 'groupInvites'),
				where('groupId', '==', groupId)
			);
			const snapshot = await getDocs(q);
			return snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data()
			}));
		},

		loadGroupMembers,
		loadMemberLevels,
		loadMemberWeeklyProgress,
		reset
	};
};

export const groupStore = createGroupStore();
