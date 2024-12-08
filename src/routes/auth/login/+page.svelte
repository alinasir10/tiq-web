<script>
	// @ts-nocheck
	import { Button, Checkbox, Label, Input, Alert, Spinner } from 'flowbite-svelte';
	import { InfoCircleSolid } from 'flowbite-svelte-icons';
	import { firebase } from '$lib/firebase.js'; // Updated import
	import { signInWithEmailAndPassword } from 'firebase/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let email = '';
	let password = '';
	let rememberMe = false;
	let errorMessage = '';
	let loading = false;

	const handleLogin = async () => {
		if (loading) return;
		loading = true;
		errorMessage = ''; // Reset the error message each time handleLogin is called

		try {
			await signInWithEmailAndPassword(firebase.auth, email, password); // Updated auth reference
			const redirectUrl = $page.url.searchParams.get('redirect') || '/planner';
			goto(redirectUrl); // Redirect to planner after successful login
		} catch (error) {
			console.error('Login failed:', error);
			errorMessage = getFriendlyErrorMessage(error.code);
		} finally {
			loading = false;
		}
	};

	// Helper function to map Firebase error codes to friendly messages
	const getFriendlyErrorMessage = (errorCode) => {
		switch (errorCode) {
			case 'auth/user-not-found':
				return 'No account found with this email address.';
			case 'auth/wrong-password':
				return 'Incorrect password. Please try again.';
			case 'auth/invalid-email':
				return 'The email address is badly formatted.';
			case 'auth/invalid-credential':
				return 'Incorrect Email or Passowrd. Please double-check and try again.';
			default:
				return 'An error occurred. Please try again later.';
		}
	};

	$: queryParams = $page.url.searchParams.toString();
	$: registerUrl = `/auth/register${queryParams ? `?${queryParams}` : ''}`;
</script>

<form on:submit|preventDefault={handleLogin} class="space-y-4">
	<h3 class="p-0 text-xl font-medium text-gray-900 dark:text-white">Login</h3>

	{#if errorMessage}
		<Alert color="red" class="mb-4">
			<InfoCircleSolid slot="icon" class="h-5 w-5" />
			{errorMessage}
		</Alert>
	{/if}

	<Label class="space-y-2">
		<span>Your Email</span>
		<Input type="email" bind:value={email} placeholder="name@gmail.com" required />
	</Label>

	<Label class="space-y-2">
		<span>Your Password</span>
		<Input type="password" bind:value={password} placeholder="•••••" required />
	</Label>

	<div class="flex items-start justify-between">
		<Checkbox bind:checked={rememberMe}>Remember me</Checkbox>
		<a
			href="/auth/reset"
			class="ml-auto text-sm text-blue-700 hover:underline dark:text-blue-500"
			>Forgot password?</a
		>
	</div>

	<Button type="submit" class="mt-4 w-full" disabled={loading}>
		{#if loading}
			<Spinner class="mr-3" size="4" color="white" />
			Signing in...
		{:else}
			Sign in
		{/if}
	</Button>

	<p class="mt-4 text-sm font-light text-gray-500 dark:text-gray-400">
		Don’t have an account yet?
		<a
			href={registerUrl}
			class="font-medium text-primary-600 hover:underline dark:text-primary-500">Register</a
		>
	</p>
</form>
