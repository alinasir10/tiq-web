<script>
	// @ts-nocheck
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button, Alert, Spinner } from 'flowbite-svelte';
	import { InfoCircleSolid } from 'flowbite-svelte-icons';
	import { userStore } from '$lib/stores/userStore';
	import { groupStore } from '$lib/stores/groupStore';

	let loading = true;
	let error = null;
	let groupInfo = null;
	let success = false;

	$: inviteId = $page.url.searchParams.get('invite');
	$: isLoggedIn = $userStore.isAuthenticated;
	$: userEmail = $userStore.user?.email || '';

	const redirectToAuth = (path) => {
		goto(`${path}?redirect=${encodeURIComponent($page.url.pathname + $page.url.search)}`);
	};

	async function loadGroupInfo() {
		try {
			groupInfo = await groupStore.checkInviteStatus(inviteId);
			if (isLoggedIn && groupInfo.email.toLowerCase() !== userEmail.toLowerCase()) {
				error = 'This invitation was sent to a different email address.';
			}
			loading = false;
		} catch (err) {
			error = err.message || 'Invalid or expired invite';
			loading = false;
		}
	}

	async function handleAcceptInvite() {
		if (!isLoggedIn) {
			const currentUrl = $page.url.pathname + $page.url.search;
			goto(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
			return;
		}

		loading = true;
		try {
			await groupStore.acceptInvite(inviteId, $userStore.user.uid);
			success = true;
		} catch (err) {
			console.log('err', err);
			error = 'Failed to accept invite';
		} finally {
			loading = false;
		}
	}

	async function handleDeclineInvite() {
		if (!isLoggedIn) {
			const currentUrl = $page.url.pathname + $page.url.search;
			goto(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
			return;
		}

		loading = true;
		try {
			await groupStore.declineInvite(inviteId);
			goto('/groups');
		} catch (err) {
			error = 'Failed to decline invite';
			loading = false;
		}
	}

	$: {
		if (inviteId) {
			loadGroupInfo();
		}
	}
</script>

<div class="container mx-auto max-w-md p-8">
	{#if loading}
		<div class="text-center">
			<Spinner size="8" />
			<p class="mt-4">Loading invite details...</p>
		</div>
	{:else if error}
		<Alert color="red">
			<InfoCircleSolid slot="icon" class="h-5 w-5" />
			{error}
		</Alert>
	{:else if success}
		<Alert color="green">
			<InfoCircleSolid slot="icon" class="h-5 w-5" />
			Successfully joined the group!
		</Alert>
		<div class="mt-4 text-center">
			<Button href="/groups">Go to Groups</Button>
		</div>
	{:else if groupInfo}
		<div class="rounded-lg border p-6 shadow-lg">
			<h2 class="mb-4 text-2xl font-bold">Group Invitation</h2>
			<p class="mb-4">You've been invited to join:</p>
			<div class="mb-6">
				<p class="text-xl font-semibold">{groupInfo.name}</p>
				<p class="text-sm text-gray-600">Created by: {groupInfo.ownerName}</p>
			</div>
			<div class="mb-4">
				<p class="text-sm text-gray-600">Invitation sent to: {groupInfo.email}</p>
			</div>
			<div class="flex gap-4">
				{#if !isLoggedIn}
					<Button color="primary" on:click={() => redirectToAuth('/auth/login')}
						>Login</Button
					>
					<Button color="alternative" on:click={() => redirectToAuth('/auth/register')}
						>Register</Button
					>
				{:else if groupInfo.email.toLowerCase() === userEmail.toLowerCase()}
					<Button color="green" on:click={handleAcceptInvite}>Accept</Button>
					<Button color="red" on:click={handleDeclineInvite}>Decline</Button>
				{:else}
					<p class="text-red-600">
						Please log in with the email address this invitation was sent to.
					</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
