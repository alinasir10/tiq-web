<script>
	// @ts-nocheck
	import { Button, Modal, Label, Input, Alert, Spinner } from 'flowbite-svelte';
	import { InfoCircleSolid } from 'flowbite-svelte-icons';
	import { userStore } from '$lib/stores/userStore';
	import { dailyProgressStore } from '$lib/stores/dailyProgressStore';
	import { groupStore } from '$lib/stores/groupStore';
	import { onMount } from 'svelte';

	let showCreateModal = false;
	let showInviteModal = false;
	let groupName = '';
	let inviteEmail = '';
	let selectedGroup = null;
	let error = '';
	let success = '';
	let loading = false;

	$: canCreateGroup = $dailyProgressStore.userLevel === 3;
	$: isLoggedIn = $userStore.isAuthenticated;

	onMount(() => {
		if (isLoggedIn) {
			groupStore.loadUserGroups($userStore.user.uid);
		}
	});

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
			showCreateModal = false;
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
			showInviteModal = false;
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
</script>

<div class="container mx-auto p-8">
	{#if !isLoggedIn}
		<div class="text-center">
			<h2 class="mb-4 text-2xl font-bold">Login Required</h2>
			<p class="mb-4">Please login to access groups.</p>
			<Button href="/auth/login">Login</Button>
		</div>
	{:else}
		<div class="mb-8 flex items-center justify-between">
			<h1 class="text-3xl font-bold">Groups</h1>
			{#if canCreateGroup}
				<Button on:click={() => (showCreateModal = true)}>Create Group</Button>
			{:else}
				<p class="text-orange-600">Reach Level 3 to create groups!</p>
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
				<div class="rounded-lg border p-6 shadow-lg">
					<h3 class="mb-4 text-xl font-bold">{group.name}</h3>
					<p class="mb-2">Members: {group.members.length}</p>
					{#if group.ownerId === $userStore.user.uid}
						<Button
							color="primary"
							on:click={() => {
								selectedGroup = group;
								showInviteModal = true;
							}}
						>
							Invite Members
						</Button>
					{/if}
				</div>
			{/each}
		</div>

		<Modal bind:open={showCreateModal} size="sm">
			<h3 class="mb-4 text-xl font-bold">Create New Group</h3>
			<Label class="space-y-2">
				<span>Group Name</span>
				<Input type="text" bind:value={groupName} placeholder="Enter group name" />
			</Label>
			<div class="mt-4 flex justify-end gap-4">
				<Button color="alternative" on:click={() => (showCreateModal = false)}
					>Cancel</Button
				>
				<Button disabled={loading} on:click={handleCreateGroup}>
					{#if loading}
						<Spinner class="mr-3" size="4" />
					{/if}
					Create
				</Button>
			</div>
		</Modal>

		<Modal bind:open={showInviteModal} size="sm">
			<h3 class="mb-4 text-xl font-bold">Invite to {selectedGroup?.name}</h3>
			<Label class="space-y-2">
				<span>Email Address</span>
				<Input type="email" bind:value={inviteEmail} placeholder="Enter email" />
			</Label>
			<div class="mt-4 flex justify-end gap-4">
				<Button color="alternative" on:click={() => (showInviteModal = false)}
					>Cancel</Button
				>
				<Button disabled={loading} on:click={handleInvite}>
					{#if loading}
						<Spinner class="mr-3" size="4" />
					{/if}
					Send Invite
				</Button>
			</div>
		</Modal>
	{/if}
</div>
