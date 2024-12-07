<script>
	import { Timeline, TimelineItem } from 'flowbite-svelte';
	import { CheckOutline } from 'flowbite-svelte-icons';
	import { doc, setDoc } from 'firebase/firestore';
	import { db } from '$lib/firebase'; // Make sure this is the correct import for your Firestore instance
	import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Import Firebase Auth

	// Firebase Auth setup
	const auth = getAuth();
	/**
	 * @type {import("firebase/auth").User | null}
	 */
	let loggedInUser = null;

	// Initialize user state
	onAuthStateChanged(auth, (user) => {
		if (user) {
			loggedInUser = user;
		} else {
			loggedInUser = null;
		}
	});

	// Levels data with tasks
	const levels = [
		{
			name: 'Level 1',
			tasks: [
				{ name: 'Check Planner', completed: false },
				{ name: 'Read Quran in Fajar', completed: false },
				{ name: "Don't sleep after Fajar", completed: false },
				{ name: 'Grow and Water Plant', completed: false },
				{ name: '1 Hour Walk', completed: false }
			]
		},
		{
			name: 'Level 2',
			tasks: [
				{ name: 'Daily 5 Prayers', completed: false },
				{ name: 'Recite Surah Yaseen', completed: false },
				{ name: 'Avoid Wasting Food', completed: false },
				{ name: 'Go for a Run', completed: false },
				{ name: 'Help Someone', completed: false }
			]
		},
		{
			name: 'Level 3',
			tasks: [
				{ name: 'Donate Something', completed: false },
				{ name: 'Call a Relative', completed: false },
				{ name: 'Practice Gratitude', completed: false },
				{ name: 'Reflect on Goals', completed: false },
				{ name: 'Avoid Negative Talk', completed: false }
			]
		}
	];

	// State variables
	let selectedLevel = 0; // Default to Level 1
	let progress = 0;

	// Reactive variables for progress
	$: currentLevel = levels[selectedLevel];
	$: completedTasks = currentLevel.tasks.filter((task) => task.completed).length;
	$: progress = Math.round((completedTasks / currentLevel.tasks.length) * 100);

	// Toggle task completion
	const markComplete = (taskIndex) => {
		currentLevel.tasks[taskIndex].completed = !currentLevel.tasks[taskIndex].completed;
	};

	// Change level
	const changeLevel = (levelIndex) => {
		selectedLevel = levelIndex;
	};

	// Save progress to Firestore
	const saveProgress = async () => {
		if (!loggedInUser) {
			console.error('No user is logged in');
			return;
		}

		const userDocRef = doc(db, 'users', loggedInUser.uid); // Use user.uid for Firestore document reference

		try {
			await setDoc(userDocRef, {
				name: loggedInUser.displayName || loggedInUser.email, // Use displayName or email if available
				level: selectedLevel + 1, // Store the level as 1-indexed
				progress,
				tasks: levels.map((level) => ({
					name: level.name,
					tasks: level.tasks
				}))
			});
			console.log('Progress saved successfully');
		} catch (error) {
			console.error('Error saving progress:', error);
		}
	};
</script>

<div class="flex w-full flex-col items-center justify-center gap-8 p-8">
	<!-- User Information -->
	<div class="flex w-full max-w-sm rounded-lg border border-orange-500 bg-orange-50 shadow-lg">
		<div class="flex w-full flex-col items-center justify-center gap-2 p-4">
			<span class="text-sm text-orange-600">Name</span>
			<span class="text-2xl font-bold text-orange-800"
				>{loggedInUser ? loggedInUser.displayName || loggedInUser.email : 'Guest'}</span
			>
		</div>

		<div
			class="flex w-full flex-col items-center justify-center gap-2 border-x border-orange-300 p-4"
		>
			<span class="text-sm text-orange-600">Level</span>
			<span class="text-2xl font-bold text-orange-800">{selectedLevel + 1}</span>
		</div>

		<div class="flex w-full flex-col items-center justify-center gap-2 p-4">
			<span class="text-sm text-orange-600">Progress</span>
			<span class="text-2xl font-bold text-orange-800">{progress}%</span>
		</div>
	</div>

	<!-- Level Selection -->
	<div class="flex gap-4">
		{#each levels as level, index}
			<button
				class="rounded-md px-4 py-2 text-white {index === selectedLevel
					? 'bg-orange-600'
					: 'bg-orange-400 hover:bg-orange-500'}"
				on:click={() => changeLevel(index)}
			>
				{level.name}
			</button>
		{/each}
	</div>

	<!-- Task List -->
	<Timeline order="vertical">
		{#each currentLevel.tasks as task, index}
			<TimelineItem classLi="pl-4">
				<button
					class="flex w-full items-center gap-4 rounded-lg p-4 text-left {task.completed
						? 'border-l-4 border-orange-500 bg-orange-100 shadow-lg'
						: 'bg-gray-100 hover:bg-gray-200'}"
					on:click={() => markComplete(index)}
					on:keydown={(e) => e.key === 'Enter' && markComplete(index)}
					type="button"
					aria-pressed={task.completed}
				>
					<!-- Task Status Icon -->
					<span
						class="flex h-8 w-8 items-center justify-center {task.completed
							? 'bg-orange-300'
							: 'bg-gray-300'} rounded-full ring-4 {task.completed
							? 'ring-orange-400'
							: 'ring-white'}"
					>
						{#if task.completed}
							<CheckOutline class="h-6 w-6 text-orange-600" />
						{/if}
					</span>

					<!-- Task Name -->
					<span
						class="text-xl font-bold {task.completed
							? 'text-orange-800 line-through'
							: 'text-gray-800'}"
					>
						{task.name}
					</span>
				</button>
			</TimelineItem>
		{/each}
	</Timeline>

	<!-- Save Button -->
	<div class="mt-4">
		<button
			class="rounded-md bg-orange-600 px-6 py-2 text-white hover:bg-orange-700"
			on:click={saveProgress}
		>
			Save Progress
		</button>
	</div>
</div>
