<script>
	// @ts-nocheck
	import { Button, Modal, Label, Input, Alert, Spinner, Table } from 'flowbite-svelte';
	import { InfoCircleSolid } from 'flowbite-svelte-icons';
	import { userStore } from '$lib/stores/userStore';
	import { dailyProgressStore } from '$lib/stores/dailyProgressStore';
	import { groupStore } from '$lib/stores/groupStore';
	import { onMount } from 'svelte';

	let modals = {
		create: false,
		invite: false,
		details: false,
		revoke: false,
		progress: false
	};

	let groupName = '';
	let inviteEmail = '';
	let selectedGroup = null;
	let inviteToRevoke = null;
	let error = '';
	let success = '';
	let loading = false;
	let pendingInvites = [];
	let groupMembers = [];
	let initialized = false;
	let loadingDetails = false;
	let memberProgress = {};
	let showMemberModal = false;
	let selectedMember = null;

	let showMemberDetailsModal = false;
	let showLevelDetailsModal = false;
	let selectedLevel = null;

	const openMemberDetails = (member) => {
		selectedMember = member;
		showMemberDetailsModal = true;
	};

	const openLevelModal = async (member) => {
		selectedMember = member;
		loadingDetails = true;
		try {
			await groupStore.loadMemberLevels(member.id);
			showLevelDetailsModal = true;
		} catch (err) {
			error = 'Failed to load member levels';
			// console.error(err);
		} finally {
			loadingDetails = false;
		}
	};

	const openLevelDetails = async (level) => {
		selectedLevel = level;
		await loadLevelProgress(level);
		showLevelDetailsModal = true;
	};

	async function openMemberLevels(member) {
		selectedMember = member;
		loadingDetails = true;
		try {
			const memberLevels = await groupStore.loadMemberLevels(member.id);
			if (memberLevels) {
				selectedMember.unlockedLevels = memberLevels.unlockedLevels;
				selectedMember.levelStartDates = memberLevels.levelStartDates;
			} else {
				selectedMember.unlockedLevels = [1];
				selectedMember.levelStartDates = {
					1: { seconds: Math.floor(member.createdAt.seconds) }
				};
			}
			modals.progress = true;
			currentView = 'levels';
			viewHistory = ['members'];
		} catch (err) {
			error = 'Failed to load member levels';
			// console.error(err);
		} finally {
			loadingDetails = false;
		}
	}

	async function openLevelProgress(level) {
		selectedLevel = level;
		loadingDetails = true;
		try {
			await loadLevelProgress(level);
			navigateTo('progress');
		} catch (err) {
			error = 'Failed to load level progress';
			// console.error(err);
		} finally {
			loadingDetails = false;
		}
	}

	$: canCreateGroup = initialized && $dailyProgressStore.unlockedLevels.has(2);
	$: isLoggedIn = $userStore.isAuthenticated;
	$: isAuthChecking = $userStore.loading;
	$: isDailyProgressInitialized = $dailyProgressStore.initialized;
	$: isLoading = isAuthChecking || (isLoggedIn && (!isDailyProgressInitialized || !initialized));

	async function initialize() {
		if (!isLoggedIn || !$userStore.user?.uid) return;

		if (!isLoggedIn || !$userStore.user?.uid) return;

		try {
			if (!isDailyProgressInitialized) {
				await dailyProgressStore.initialize($userStore.user.uid);
			}
			await groupStore.loadUserGroups($userStore.user.uid);
			if (!isDailyProgressInitialized) {
				await dailyProgressStore.initialize($userStore.user.uid);
			}
			await groupStore.loadUserGroups($userStore.user.uid);
			initialized = true;
		} catch (error) {
			console.error('Initialization error:', error);
			error = 'Failed to load groups';
		}
	}

	$: if (isLoggedIn && isDailyProgressInitialized && !initialized) {
		initialize();
	}

	onMount(() => {
		if (isLoggedIn && !initialized) {
			initialize();
		}
	});

	async function loadGroupDetails(group) {
		selectedGroup = group;
		loadingDetails = true;
		modals.details = true;
		try {
			const [invites, members] = await Promise.all([
				groupStore.loadGroupInvites(group.id),
				groupStore.loadGroupMembers(group.id)
			]);
			pendingInvites = invites;
			groupMembers = members;
		} catch (err) {
			error = 'Failed to load group details';
		} finally {
			loadingDetails = false;
		}
	}

	async function revokeInvite(inviteId) {
		if (!confirm('Are you sure you want to revoke this invitation?')) return;
		loading = true;
		try {
			await groupStore.revokeInvite(inviteId);
			pendingInvites = pendingInvites.filter((invite) => invite.id !== inviteId);
			success = 'Invitation revoked successfully';
		} catch (err) {
			error = 'Failed to revoke invitation';
		} finally {
			loading = false;
		}
	}

	async function handleCreateGroup() {
		if (!groupName) {
			error = 'Please enter a group name';
			return;
		}
		loading = true;
		error = '';
		try {
			await groupStore.createGroup(groupName, $userStore.user.uid);
			success = 'Group created successfully!';
			modals.create = false;
			groupName = '';
			await groupStore.loadUserGroups($userStore.user.uid);
		} catch (err) {
			error = 'Failed to create group';
		} finally {
			loading = false;
		}
	}

	async function handleInvite() {
		if (!inviteEmail) {
			error = 'Please enter an email';
			return;
		}
		loading = true;
		error = '';
		try {
			await groupStore.inviteUser(selectedGroup.id, inviteEmail);
			success = 'Invitation sent successfully!';
			modals.invite = false;
			inviteEmail = '';
		} catch (err) {
			error = 'Failed to send invitation';
		} finally {
			loading = false;
		}
	}

	async function removeMember(groupId, memberId) {
		if (!confirm('Are you sure you want to remove this member?')) return;
		try {
			await groupStore.removeMember(groupId, memberId);
			success = 'Member removed successfully!';
			await groupStore.loadUserGroups($userStore.user.uid);
		} catch (err) {
			error = 'Failed to remove member';
		}
	}

	async function handleRevokeInvite() {
		loading = true;
		try {
			await groupStore.revokeInvite(inviteToRevoke.id);
			pendingInvites = pendingInvites.filter((invite) => invite.id !== inviteToRevoke.id);
			success = 'Invitation revoked successfully';
			modals.revoke = false;
		} catch (err) {
			error = 'Failed to revoke invitation';
		} finally {
			loading = false;
		}
	}

	async function openMemberProgress(member) {
		selectedMember = member;
		loadingDetails = true;
		try {
			// console.log('Selected member:', member);
			const memberLevels = await groupStore.loadMemberLevels(member.id);
			if (memberLevels) {
				selectedMember.unlockedLevels = memberLevels.unlockedLevels;
				selectedMember.levelStartDates = memberLevels.levelStartDates;
				showMemberModal = true;
			} else {
				throw new Error('Failed to load member levels');
			}
		} catch (err) {
			error = 'Failed to load member progress';
			// console.error(err);
		} finally {
			loadingDetails = false;
		}
	}

	async function loadLevelProgress(level) {
		try {
			const levelStartDate = selectedMember.levelStartDates[level];
			if (!levelStartDate) {
				throw new Error(`Missing startDate for level ${level}`);
			}

			const progressData = await groupStore.loadMemberWeeklyProgress(selectedMember.id, {
				level,
				startDate: levelStartDate
			});

			if (progressData && progressData.some((day) => day !== null)) {
				memberProgress[level] = progressData;
			} else {
				memberProgress[level] = Array(7).fill(null);
			}
			memberProgress = memberProgress;
		} catch (error) {
			error = `Failed to load progress for level ${level}`;
		}
	}

	let currentView = 'members'; // 'members', 'levels', 'progress'
	let viewHistory = [];

	function navigateTo(view) {
		viewHistory.push(currentView);
		currentView = view;
	}

	function goBack() {
		if (viewHistory.length > 0) {
			currentView = viewHistory.pop();
		} else {
			modals.progress = false;
		}
	}

	const defaultTasks = {
		1: {
			name: 'Level 1',
			tasks: [
				{ name: 'Check Planner', completed: false },
				{ name: 'Read Quran in Fajar', completed: false },
				{ name: "Don't sleep after Fajar", completed: false },
				{ name: 'Grow and Water Plant', completed: false },
				{ name: '1 Hour Walk', completed: false }
			]
		},
		2: {
			name: 'Level 2',
			tasks: [
				{ name: 'Daily 5 Prayers', completed: false },
				{ name: 'Recite Surah Yaseen', completed: false },
				{ name: 'Avoid Wasting Food', completed: false },
				{ name: 'Go for a Run', completed: false },
				{ name: 'Help Someone', completed: false }
			]
		},
		3: {
			name: 'Level 3',
			tasks: [
				{ name: 'Donate Something', completed: false },
				{ name: 'Call a Relative', completed: false },
				{ name: 'Practice Gratitude', completed: false },
				{ name: 'Reflect on Goals', completed: false },
				{ name: 'Avoid Negative Talk', completed: false }
			]
		}
	};

	function formatDate(timestamp) {
		if (!timestamp) return '';
		const date = new Date(timestamp.seconds * 1000);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			timeZone: 'Asia/Karachi'
		});
	}

	function getWeekNumber(date, startDate) {
		const diffTime = date.getTime() - startDate.getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
		return Math.floor(diffDays / 7);
	}

	function getDateForDayIndex(dayIndex, startDate) {
		// Convert timestamp to PKT date
		const date = new Date(startDate.seconds * 1000);
		const startDateStr = date.toLocaleString('en-US', { timeZone: 'Asia/Karachi' });
		const pktDate = new Date(startDateStr);
		pktDate.setHours(0, 0, 0, 0);

		const today = new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' });
		const todayPKT = new Date(today);
		todayPKT.setHours(0, 0, 0, 0);

		const currentWeek = getWeekNumber(todayPKT, pktDate);

		const weekStartDate = new Date(pktDate);
		weekStartDate.setDate(pktDate.getDate() + currentWeek * 7);

		const targetDate = new Date(weekStartDate);
		targetDate.setDate(weekStartDate.getDate() + dayIndex);

		const formattedDate = targetDate.toLocaleString('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			timeZone: 'Asia/Karachi'
		});
		const [month, day, year] = formattedDate.split('/');
		return `${year}-${month}-${day}`;
	}

	function getDateDisplay(dayIndex, startDate) {
		const dateStr = getDateForDayIndex(dayIndex, startDate);
		const date = new Date(dateStr);

		return {
			date: dateStr,
			display: `Day ${dayIndex + 1}`, // Simplified back to original
			shortDate: date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				timeZone: 'Asia/Karachi'
			})
		};
	}

	let futureDatesCache = new Map();

	function isDateInFuture(dateString) {
		if (futureDatesCache.has(dateString)) {
			return futureDatesCache.get(dateString);
		}

		const today = new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' });
		const todayPKT = new Date(today);
		todayPKT.setHours(0, 0, 0, 0);

		const inputDate = new Date(dateString).toLocaleString('en-US', {
			timeZone: 'Asia/Karachi'
		});
		const datePKT = new Date(inputDate);
		datePKT.setHours(0, 0, 0, 0);

		const isFuture = datePKT > todayPKT;
		futureDatesCache.set(dateString, isFuture);
		return isFuture;
	}

	$: if (selectedLevel) {
		futureDatesCache.clear();
	}

	function getCurrentWeek(startDate) {
		const start = new Date(startDate.seconds * 1000);
		const startDateStr = start.toLocaleString('en-US', { timeZone: 'Asia/Karachi' });
		const pktDate = new Date(startDateStr);
		pktDate.setHours(0, 0, 0, 0);

		const today = new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' });
		const todayPKT = new Date(today);
		todayPKT.setHours(0, 0, 0, 0);

		const diffTime = todayPKT.getTime() - pktDate.getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
		return Math.floor(diffDays / 7) + 1;
	}
</script>

<div class="container mx-auto p-8">
	{#if isLoading}
		<div class="flex min-h-screen w-full items-center justify-center">
			<div class="text-center">
				<Spinner size="12" class="mb-4" />
				<p class="text-gray-600">
					{#if isAuthChecking}
						Checking authentication...
					{:else if !isDailyProgressInitialized}
						Initializing...
					{:else}
						Loading groups...
					{/if}
				</p>
			</div>
		</div>
	{:else if !isLoggedIn}
		<div class="text-center">
			<h2 class="mb-4 text-2xl font-bold">Login Required</h2>
			<p class="mb-4">Please login to access groups.</p>
			<Button href="/auth/login">Login</Button>
		</div>
	{:else}
		<div class="mb-8 flex items-center justify-between">
			<h1 class="text-3xl font-bold">Groups</h1>
			{#if canCreateGroup}
				<Button on:click={() => (modals.create = true)}>Create Group</Button>
			{:else}
				<p class="text-orange-600">Reach Level 2 to create groups!</p>
			{/if}
		</div>

		{#if error}
			<Alert color="red" class="mb-4">
				<InfoCircleSolid slot="icon" class="h-5 w-5" />
				{error}
			</Alert>
		{/if}

		{#if success}
			<Alert color="green" class="mb-4">
				<InfoCircleSolid slot="icon" class="h-5 w-5" />
				{success}
			</Alert>
		{/if}

		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each $groupStore.userGroups as group}
				<button
					class="rounded-lg border p-6 text-left shadow-lg transition hover:shadow-xl"
					on:click={() => loadGroupDetails(group)}
				>
					<h3 class="mb-4 text-xl font-bold">{group.name}</h3>
					<p class="mb-2">Members: {group.members.length}</p>
					{#if group.ownerId === $userStore.user.uid}
						<span class="text-sm text-orange-600">Group Owner</span>
					{/if}
				</button>
			{/each}
		</div>

		<Modal bind:open={modals.details} size="md">
			{#if selectedGroup}
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-bold">{selectedGroup.name}</h3>
					{#if selectedGroup.ownerId === $userStore.user.uid}
						<Button
							size="xs"
							on:click={() => {
								modals.details = false;
								modals.invite = true;
							}}
						>
							Invite Member
						</Button>
					{/if}
				</div>

				{#if loadingDetails}
					<div class="flex flex-col items-center justify-center py-4">
						<Spinner size="6" />
						<p class="mt-2 text-sm text-gray-600">Loading details...</p>
					</div>
				{:else}
					<div class="max-h-[60vh] overflow-y-auto">
						<div class="space-y-2">
							{#each groupMembers as member}
								<div class="flex items-center justify-between rounded border p-2">
									<div class="flex items-center gap-2">
										<span class="font-medium">{member.name}</span>
										{#if member.isOwner}
											<span
												class="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-600"
												>Owner</span
											>
										{/if}
										<span
											class="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-600"
											>Level {member.level}</span
										>
									</div>
									<Button size="xs" on:click={() => openMemberLevels(member)}
										>View</Button
									>
								</div>
							{/each}
						</div>

						{#if selectedGroup.ownerId === $userStore.user.uid && pendingInvites.length > 0}
							<div class="mt-4 border-t pt-4">
								<h4 class="mb-2 text-sm font-semibold text-gray-600">
									Pending Invites
								</h4>
								<div class="space-y-2">
									{#each pendingInvites as invite}
										<div
											class="flex items-center justify-between rounded border p-2"
										>
											<span class="text-sm">{invite.email}</span>
											<Button
												color="red"
												size="xs"
												on:click={() => {
													inviteToRevoke = invite;
													modals.revoke = true;
												}}
											>
												Revoke
											</Button>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			{/if}
		</Modal>

		<Modal bind:open={modals.progress} size="md">
			<div class="mb-2 flex items-center justify-between">
				<h3 class="text-lg font-bold">
					{#if currentView === 'levels'}
						{selectedMember.name}'s Levels
					{:else if currentView === 'progress'}
						Level {selectedLevel} Progress - Week {getCurrentWeek(
							selectedMember.levelStartDates[selectedLevel]
						)}
						Level {selectedLevel} Progress - Week {getCurrentWeek(
							selectedMember.levelStartDates[selectedLevel]
						)}
					{/if}
				</h3>
				{#if currentView === 'progress'}
					<Button size="xs" color="alternative" on:click={goBack}>Back</Button>
				{/if}
			</div>

			{#if loadingDetails}
				<div class="flex flex-col items-center justify-center py-4">
					<Spinner size="6" />
					<p class="mt-2 text-sm text-gray-600">Loading...</p>
				</div>
			{:else if currentView === 'levels'}
				<div class="space-y-2">
					{#each selectedMember.unlockedLevels as level}
						<div class="flex items-center justify-between rounded border p-2">
							<div>
								<span class="font-medium">Level {level}</span>
								<span class="ml-2 text-xs text-gray-600">
									Started: {formatDate(selectedMember.levelStartDates[level])}
								</span>
							</div>
							<Button size="xs" on:click={() => openLevelProgress(level)}>View</Button
							>
						</div>
					{/each}
				</div>
			{:else if currentView === 'progress'}
				<div class="max-h-[70vh] overflow-auto">
					<Table class="mt-2 w-full text-sm">
						<thead class="bg-gray-50">
							<tr>
								<th
									class="px-2 py-1 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
								>
									Tasks
								</th>
								{#each Array(7) as _, index}
									{@const dateInfo = getDateDisplay(
										index,
										selectedMember.levelStartDates[selectedLevel]
									)}
									<th
										class="px-2 py-1 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
									>
										<div>{dateInfo.display}</div>
										<div class="text-gray-400">{dateInfo.shortDate}</div>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white">
							{#each defaultTasks[selectedLevel].tasks as defaultTask, taskIndex}
								<tr>
									<td class="whitespace-nowrap px-2 py-1 text-sm"
										>{defaultTask.name}</td
									>
									{#each Array(7) as _, dayIndex}
										{@const dateString = getDateForDayIndex(
											dayIndex,
											selectedMember.levelStartDates[selectedLevel]
										)}
										{@const dayData = memberProgress[selectedLevel]?.[dayIndex]}
										{@const isFuture = isDateInFuture(dateString)}
										<td class="px-2 py-1 text-center">
											<div class="relative">
												{#if isFuture}
													<span class="text-gray-400">–</span>
												{:else if dayData && dayData.tasks && Array.isArray(dayData.tasks)}
													{#if dayData.tasks[taskIndex]?.completed}
														<span class="text-green-600">✔</span>
													{:else}
														<span class="text-red-600">✘</span>
													{/if}
												{:else}
													<span class="text-red-600">✘</span>
												{/if}
											</div>
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</Table>
				</div>
			{/if}
		</Modal>
		<Modal bind:open={modals.create} size="xs">
			<h3 class="mb-4 text-xl font-bold">Create New Group</h3>
			<Label class="space-y-2">
				<span>Group Name</span>
				<Input type="text" bind:value={groupName} placeholder="Enter group name" />
			</Label>
			<div class="mt-4 flex justify-end gap-4">
				<Button color="alternative" on:click={() => (modals.create = false)}>Cancel</Button>
				<Button disabled={loading} on:click={handleCreateGroup}>
					{#if loading}
						<Spinner class="mr-3" size="4" />
					{/if}
					Create
				</Button>
			</div>
		</Modal>

		<Modal bind:open={modals.invite} size="xs">
			<h3 class="mb-4 text-xl font-bold">Invite to {selectedGroup?.name}</h3>
			<Label class="space-y-2">
				<span>Email Address</span>
				<Input type="email" bind:value={inviteEmail} placeholder="Enter email" />
			</Label>
			<div class="mt-4 flex justify-end gap-4">
				<Button color="alternative" on:click={() => (modals.invite = false)}>Cancel</Button>
				<Button disabled={loading} on:click={handleInvite}>
					{#if loading}
						<Spinner class="mr-3" size="4" />
					{/if}
					Send Invite
				</Button>
			</div>
		</Modal>

		<Modal bind:open={modals.revoke} size="xs">
			<div class="text-center">
				<h3 class="mb-4 text-xl font-bold">Revoke Invitation</h3>
				<p class="mb-6">
					Are you sure you want to revoke the invitation for <strong
						>{inviteToRevoke?.email}</strong
					>? This action cannot be undone.
				</p>
				<div class="flex justify-end gap-4">
					<Button color="alternative" on:click={() => (modals.revoke = false)}>
						Cancel
					</Button>
					<Button color="red" on:click={handleRevokeInvite}>
						{#if loading}
							<Spinner class="mr-3" size="4" />
						{/if}
						Revoke Invite
					</Button>
				</div>
			</div>
		</Modal>

		<Modal bind:open={showMemberModal} size="xl">
			{#if selectedMember}
				<h3 class="mb-4 text-xl font-bold">{selectedMember.name}'s Weekly Progress</h3>

				{#if loadingDetails}
					<div class="flex flex-col items-center justify-center py-8">
						<Spinner size="8" />
						<p class="mt-4 text-gray-600">Loading progress...</p>
					</div>
				{:else}
					<Button on:click={() => openMemberDetails(selectedMember)}>
						View Member Details
					</Button>
				{/if}
			{/if}
		</Modal>

		<Modal bind:open={showMemberDetailsModal} size="lg">
			{#if selectedMember}
				<h3 class="mb-4 text-xl font-bold">{selectedMember.name}'s Details</h3>
				<div class="space-y-4">
					{#each selectedMember.unlockedLevels as level}
						<div class="flex items-center justify-between">
							<span
								>Level {level} - Started on {new Date(
									selectedMember.levelStartDates[level]
								).toLocaleDateString()}</span
							>
							<Button size="sm" on:click={() => openLevelDetails(level)}>
								View Details
							</Button>
						</div>
					{/each}
				</div>
			{/if}
		</Modal>
	{/if}
</div>
