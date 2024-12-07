<script>
	import { Button, Label, Input, Alert } from 'flowbite-svelte';
	import { InfoCircleSolid } from 'flowbite-svelte-icons';
	import { firebase } from '$lib/firebase.js';
	import { sendPasswordResetEmail } from 'firebase/auth';
	import { goto } from '$app/navigation';

	let email = '';
	let errorMessage = '';
	let successMessage = '';
	let resetRequested = false;

	const handleReset = async (event) => {
		event.preventDefault();

		errorMessage = '';
		successMessage = '';

		sendPasswordResetEmail(firebase.auth, email)
			.then(() => {
				successMessage = 'Password reset email sent! Please check your inbox.';
				resetRequested = true;
			})
			.catch((error) => {
				console.error('Password reset failed:', error);
				errorMessage = getFriendlyErrorMessage(error.code);
			});
	};

	const getFriendlyErrorMessage = (errorCode) => {
		switch (errorCode) {
			case 'auth/user-not-found':
				return 'No account found with this email address.';
			case 'auth/invalid-email':
				return 'The email address is badly formatted.';
			default:
				return 'An error occurred while trying to send the password reset email. Please try again later.';
		}
	};

	const goToLogin = () => {
		goto('/auth/login');
	};
</script>

<form on:submit|preventDefault={handleReset} class="space-y-4">
	<h3 class="p-0 text-xl font-medium text-gray-900 dark:text-white">Reset Password</h3>

	{#if errorMessage}
		<Alert color="red" class="mb-4">
			<InfoCircleSolid slot="icon" class="h-5 w-5" />
			{errorMessage}
		</Alert>
	{/if}

	{#if successMessage}
		<Alert color="green" class="mb-4">
			<InfoCircleSolid slot="icon" class="h-5 w-5" />
			{successMessage}
		</Alert>
	{/if}

	{#if !resetRequested}
		<Label class="space-y-2">
			<span>Your Email</span>
			<Input type="email" bind:value={email} placeholder="name@gmail.com" required />
		</Label>

		<Button type="submit" class="mt-4 w-full">Send Password Reset Link</Button>
	{:else}
		<Button on:click={goToLogin} class="mt-4 w-full">Go Back to Login</Button>
	{/if}

	<p class="mt-4 text-sm font-light text-gray-500 dark:text-gray-400">
		Don’t have an account yet?
		<a
			href="/auth/register"
			class="font-medium text-primary-600 hover:underline dark:text-primary-500">Register</a
		>
	</p>
</form>
