<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { signOut } from 'firebase/auth';
	import { firebase } from '$lib/firebase.js';
	import { userStore } from '$lib/stores/userStore';
	import { dailyProgressStore } from '$lib/stores/dailyProgressStore';
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

	let hasInitialized = false;

	onMount(async () => {
		await userStore.initialize();
		hasInitialized = true;
	});

	$: if ($userStore.isAuthenticated && $userStore.user?.uid && !$dailyProgressStore.initialized) {
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

	$: shouldShowLoadingState = !hasInitialized && $userStore.loading;
</script>

<Navbar class="border-b">
	<NavBrand href="/">
		<img src="/logo.png" class="me-3 h-8 rounded-full sm:h-9" alt="The Islam Quest" />
		<span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white"
			>S 24/7</span
		>
	</NavBrand>

	<div class="flex flex-nowrap items-center md:order-2">
		{#if shouldShowLoadingState}
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
			<div class="hidden md:flex md:space-x-2">
				<Button href="/auth/login{authQueryString}" color="primary">Login</Button>
				<Button href="/auth/register{authQueryString}" color="alternative">Register</Button>
			</div>
			<div class="md:hidden">
				<Button
					href="/auth/login{authQueryString}"
					color="primary"
					class="px-3 py-1 text-sm">Login</Button
				>
			</div>
		{/if}
		<NavHamburger class="ml-2" />
	</div>

	<NavUl>
		{#each navItems as { href, label }}
			<NavLi {href}>{label}</NavLi>
		{/each}
	</NavUl>
</Navbar>
