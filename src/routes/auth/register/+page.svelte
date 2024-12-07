<script>
    import { Button, Label, Input, Alert } from "flowbite-svelte"
    import { InfoCircleSolid } from 'flowbite-svelte-icons'
    import { firebaseAuth } from '$lib/firebase.js'
    import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
    import { goto } from '$app/navigation'

    let email = ''
    let password = ''
    let retypePassword = ''
    let displayName = ''
    let phoneNumber = ''
    let errorMessage = ''

    const handleSignup = async () => {
        errorMessage = ''  // Reset the error message each time handleSignup is called

        if (password !== retypePassword) {
            errorMessage = 'Passwords do not match.'
            return
        }

        createUserWithEmailAndPassword(firebaseAuth, email, password)
            .then((userCredential) => {
                // Update the user's profile with the display name and phone number (stored, not verified)
                updateProfile(userCredential.user, {
                    displayName
                }).then(() => {
                    // Redirect to login page after successful registration
                    goto('/auth/login')
                }).catch((error) => {
                    console.error('Profile update failed:', error)
                    errorMessage = 'Profile update failed. Please try again later.'
                })
            })
            .catch((error) => {
                console.error('Registration failed:', error)
                errorMessage = getFriendlyErrorMessage(error.code)
            })
    }

    // Helper function to map Firebase error codes to friendly messages
    const getFriendlyErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return 'The email address is already in use by another account.'
            case 'auth/invalid-email':
                return 'The email address is badly formatted.'
            case 'auth/weak-password':
                return 'The password is too weak. Please use a stronger password.'
            default:
                return 'An error occurred. Please try again later.'
        }
    }
</script>

<form on:submit|preventDefault={handleSignup} class="space-y-4">
    <h3 class="text-xl font-medium text-gray-900 dark:text-white p-0">Register</h3>

    {#if errorMessage}
        <Alert color="red" class="mb-4">
            <InfoCircleSolid slot="icon" class="w-5 h-5" />
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

    <Button type="submit" class="w-full mt-4">Register</Button>

    <p class="text-sm font-light text-gray-500 dark:text-gray-400 mt-4">
        Already have an account?
        <a href="/auth/login" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Sign In</a>
    </p>
</form>
