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
	deleteDoc
} from 'firebase/firestore';

const createGroupStore = () => {
	const { subscribe, set, update } = writable({
		loading: false,
		userGroups: [],
		error: null
	});

	return {
		subscribe,
		createGroup: async (name, ownerId) => {
			const groupRef = doc(collection(firebase.db, 'groups'));
			await setDoc(groupRef, {
				name,
				ownerId,
				members: [ownerId],
				createdAt: new Date(),
				code: groupRef.id
			});
			return groupRef.id;
		},

		inviteUser: async (groupId, email) => {
			const inviteRef = doc(collection(firebase.db, 'groupInvites'));
			await setDoc(inviteRef, {
				groupId,
				email,
				createdAt: new Date()
			});
			return inviteRef.id;
		},

		acceptInvite: async (inviteId, userId) => {
			const inviteRef = doc(firebase.db, 'groupInvites', inviteId);
			const inviteDoc = await getDoc(inviteRef);

			if (!inviteDoc.exists()) throw new Error('Invite not found');

			const groupRef = doc(firebase.db, 'groups', inviteDoc.data().groupId);
			await updateDoc(groupRef, {
				members: firebase.arrayUnion(userId)
			});

			await deleteDoc(inviteRef);
		},

		removeMember: async (groupId, memberId) => {
			const groupRef = doc(firebase.db, 'groups', groupId);
			await updateDoc(groupRef, {
				members: firebase.arrayRemove(memberId)
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
		}
	};
};

export const groupStore = createGroupStore();
