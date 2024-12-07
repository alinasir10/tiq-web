<script>
	// @ts-nocheck
	import { Button, Label, Input, Alert, Spinner } from 'flowbite-svelte';
	import { InfoCircleSolid } from 'flowbite-svelte-icons';
	import { firebase } from '$lib/firebase.js';
	import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
	import { doc, setDoc } from 'firebase/firestore';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/userStore';

	let email = '';
	let password = '';
	let retypePassword = '';
	let displayName = '';
	let phoneNumber = '';
	let errorMessage = '';
	let loading = false;

	const handleSignup = async () => {
		if (loading) return;
		loading = true;
		errorMessage = '';

		if (password !== retypePassword) {
			errorMessage = 'Passwords do not match.';
			loading = false;
			return;
		}

		try {
			const userCredential = await createUserWithEmailAndPassword(
				firebase.auth,
				email,
				password
			);

			await updateProfile(userCredential.user, {
				displayName
			});

			const userDocRef = doc(firebase.db, 'users', userCredential.user.uid);
			await setDoc(userDocRef, {
				name: displayName,
				level: 1
			});

			userStore.refresh(userCredential.user);

			goto('/planner');
		} catch (error) {
			console.error('Registration failed:', error);
			errorMessage = getFriendlyErrorMessage(error.code);
		} finally {
			loading = false;
		}
	};

	const getFriendlyErrorMessage = (errorCode) => {
		switch (errorCode) {
			case 'auth/email-already-in-use':
				return 'The email address is already in use by another account.';
			case 'auth/invalid-email':
				return 'The email address is badly formatted.';
			case 'auth/weak-password':
				return 'The password is too weak. Please use a stronger password.';
			default:
				return 'An error occurred. Please try again later.';
		}
	};
</script>

<form on:submit|preventDefault={handleSignup} class="space-y-4">
	<h3 class="p-0 text-xl font-medium text-gray-900 dark:text-white">Register</h3>

	{#if errorMessage}
		<Alert color="red" class="mb-4">
			<InfoCircleSolid slot="icon" class="h-5 w-5" />
			{errorMessage}
		</Alert>
	{/if}

	<Label class="space-y-2">
		<span>Your Name</span>
		<Input type="text" bind:value={displayName} placeholder="John Doe" required />
	</Label>

	<Label class="space-y-2">
		<span>Your Phone Number</span>
		<Input type="tel" bind:value={phoneNumber} placeholder="+1234567890" required />
	</Label>

	<Label class="space-y-2">
		<span>Your Email</span>
		<Input type="email" bind:value={email} placeholder="name@gmail.com" required />
	</Label>

	<Label class="space-y-2">
		<span>Your Password</span>
		<Input type="password" bind:value={password} placeholder="•••••" required />
	</Label>

	<Label class="space-y-2">
		<span>Retype Password</span>
		<Input type="password" bind:value={retypePassword} placeholder="•••••" required />
	</Label>

	<Button type="submit" class="mt-4 w-full" disabled={loading}>
		{#if loading}
			<Spinner class="mr-3" size="4" color="white" />
			Registering...
		{:else}
			Register
		{/if}
	</Button>

	<p class="mt-4 text-sm font-light text-gray-500 dark:text-gray-400">
		Already have an account?
		<a
			href="/auth/login"
			class="font-medium text-primary-600 hover:underline dark:text-primary-500">Sign In</a
		>
	</p>
</form>
