<script>
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
    } from 'flowbite-svelte'
    import { signOut } from 'firebase/auth'
    import { userStore, initializeAuth } from '$lib/stores/userStore'
    import { goto } from '$app/navigation'
    import { onMount } from 'svelte'
    import { initializeIfNotAlready, firebaseAuth } from '$lib/firebase.js'

    // Initialize Firebase when the component mounts
    onMount(() => {
        initializeIfNotAlready() // Make sure Firebase is initialized
        initializeAuth() // Call the function from userStore.js to initialize authentication state
    })

    // Logout function
    const handleLogout = async () => {
        if (typeof window !== 'undefined') {
            try {
                await signOut(firebaseAuth)
                // Reset the user store when logged out
                userStore.set({ isAuthenticated: false, user: null })
                goto('/auth/login')
            } catch (error) {
                console.error('Logout failed:', error)
            }
        }
    }
</script>

<Navbar class="border-b">
    <NavBrand href="/">
        <img src="/logo.png" class="me-3 h-8 sm:h-9 rounded-full" alt="The Islam Quest" />
        <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">S 24/7</span>
    </NavBrand>
    <div class="flex items-center md:order-2">
        {#if $userStore.isAuthenticated}
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
            <Button href="/auth/login" class="ms-4" color="primary">Login</Button>
            <Button href="/auth/register" class="ms-2" color="secondary">Register</Button>
        {/if}
        <NavHamburger />
    </div>
    <NavUl>
        <NavLi href="/">Home</NavLi>
        <NavLi href="/books">Books</NavLi>
        <NavLi href="/planner">Planner</NavLi>
        <NavLi href="/quran">Quran</NavLi>
        <NavLi href="/groups">Groups</NavLi>
    </NavUl>
</Navbar>
