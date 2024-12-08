<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { signOut } from 'firebase/auth';
	import { firebase } from '$lib/firebase.js';
	import { userStore } from '$lib/stores/userStore';
	import { dailyProgressStore } from '$lib/stores/dailyProgressStore'; // Import dailyProgressStore
	import {
		Avatar,
		Navbar,
		NavBrand,
		NavHamburger,
		NavUl,
		NavLi,
		Dropdown,
		DropdownHeader,
		DropdownItem,
		DropdownDivider,
		Button
	} from 'flowbite-svelte';
	import { page } from '$app/stores';

	onMount(() => {
		userStore.initialize();
	});

	$: if ($userStore.isAuthenticated && $userStore.user?.uid) {
		dailyProgressStore.initialize($userStore.user.uid);
	}

	const handleLogout = async () => {
		try {
			await signOut(firebase.auth);
			userStore.reset();
			dailyProgressStore.reset();
			goto('/auth/login');
		} catch (error) {
			console.error('Logout failed:', error);
		}
	};

	const navItems = [
		{ href: '/', label: 'Home' },
		{ href: '/books', label: 'Books' },
		{ href: '/planner', label: 'Planner' },
		{ href: '/quran', label: 'Quran' },
		{ href: '/groups', label: 'Groups' }
	];

	$: queryParams = $page.url.searchParams.toString();
	$: authQueryString = queryParams ? `?${queryParams}` : '';
</script>

<Navbar class="border-b">
	<NavBrand href="/">
		<img src="/logo.png" class="me-3 h-8 rounded-full sm:h-9" alt="The Islam Quest" />
		<span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white"
			>S 24/7</span
		>
	</NavBrand>

	<div class="flex items-center md:order-2">
		{#if $userStore.loading}
			<div class="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
		{:else if $userStore.isAuthenticated}
			<Avatar id="user-menu" />
			<Dropdown placement="bottom" triggeredBy="#user-menu">
				<DropdownHeader>
					<span class="block text-sm">{$userStore.user.displayName}</span>
					<span class="block truncate text-sm font-medium">{$userStore.user.email}</span>
				</DropdownHeader>
				<DropdownDivider />
				<DropdownItem on:click={handleLogout}>Sign out</DropdownItem>
			</Dropdown>
		{:else}
			<Button href="/auth/login{authQueryString}" class="ms-4" color="primary">Login</Button>
			<Button href="/auth/register{authQueryString}" class="ms-2" color="alternative"
				>Register</Button
			>
		{/if}
		<NavHamburger />
	</div>

	<NavUl>
		{#each navItems as { href, label }}
			<NavLi {href}>{label}</NavLi>
		{/each}
	</NavUl>
</Navbar>
