<script>
	// @ts-nocheck

	import { Timeline, TimelineItem, Alert, Spinner, Modal, Button } from 'flowbite-svelte';
	import { CheckOutline, InfoCircleSolid } from 'flowbite-svelte-icons';
	import { serverTimestamp } from 'firebase/firestore';
	import { userStore } from '$lib/stores/userStore';
	import { dailyProgressStore } from '$lib/stores/dailyProgressStore';

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

	let selectedLevel = 0;
	let progress = 0;
	let isSaving = false;
	let saveError = '';
	let saveSuccess = false;
	let taskUnlockDays = [0, 10, 20];
	let showUnlockModal = false;
	let unlockedLevel = null;

	let shownUnlocks = {
		level2: false,
		level3: false
	};

	$: ({ user: loggedInUser, loading: userLoading } = $userStore);

	$: ({
		levels: progressLevels,
		loading: storeLoading,
		initialized,
		streak,
		unlockedLevels,
		levelStartDates,
		hasTodayProgress
	} = $dailyProgressStore);

	$: currentUnlockedLevels = loggedInUser ? unlockedLevels || new Set([1]) : new Set([1, 2, 3]);

	// Calculate current level for display
	$: displayLevel = selectedLevel + 1;

	const { getFormattedDate } = dailyProgressStore;

	// Remove userLevel calculation since we use unlockedLevels instead

	$: isLoading = userLoading || (loggedInUser && storeLoading);

	$: completedTasks = currentLevel.tasks.filter((task) => task.completed).length;
	$: progress = Math.round((completedTasks / currentLevel.tasks.length) * 100);

	// Helper function to check if next level is locked
	const getNextLockedLevel = (currentLevel) => {
		const nextLevel = currentLevel + 1;
		return nextLevel <= 3 && !currentUnlockedLevels.has(nextLevel) ? nextLevel : null;
	};

	// Helper to get days until unlock for a level
	const getDaysUntilUnlock = (level) => {
		const requiredStreak = level === 3 ? 20 : 10;
		return Math.max(0, requiredStreak - streak);
	};

	// Replace daysUntilNextLevel calculation with these
	$: nextLockedLevel = getNextLockedLevel(selectedLevel + 1);
	$: daysUntilUnlock = nextLockedLevel ? getDaysUntilUnlock(nextLockedLevel) : 0;

	$: if (initialized && !hasTodayProgress) {
		const yesterdayStreak = streak - 1;
		if ([10, 20, 30].includes(streak) && yesterdayStreak === streak - 1) {
			showUnlockModal = true;
			unlockedLevel = streak >= 30 ? 'max' : Math.floor(streak / 10) + 1;
		}
	}

	$: if ($userStore.user?.uid) {
		shownUnlocks = {
			level2: false,
			level3: false
		};
	}

	const markComplete = (taskIndex) => {
		if (!loggedInUser) {
			saveError = 'Please login to mark tasks as complete';
			return;
		}
		currentLevel.tasks[taskIndex].completed = !currentLevel.tasks[taskIndex].completed;
	};

	const changeLevel = (levelIndex) => {
		selectedLevel = levelIndex;
	};

	$: currentLevel = progressLevels[selectedLevel + 1] || {
		...levels[selectedLevel],
		tasks: levels[selectedLevel].tasks.map((t) => ({ ...t }))
	};

	$: if (currentLevel) {
		completedTasks = currentLevel.tasks.filter((task) => task.completed).length;
		progress = Math.round((completedTasks / currentLevel.tasks.length) * 100);
	}

	const saveProgress = async () => {
		if (!loggedInUser) {
			saveError = 'Please login to save progress';
			return;
		}

		isSaving = true;
		saveError = '';
		saveSuccess = false;

		const progressData = {
			userId: loggedInUser.uid,
			level: selectedLevel + 1,
			date: getFormattedDate(), // Use the imported function
			progress,
			completedTasks,
			totalTasks: currentLevel.tasks.length,
			tasks: currentLevel.tasks
		};

		try {
			const success = await dailyProgressStore.saveProgress(loggedInUser.uid, progressData);
			if (success) {
				saveSuccess = true;
			} else {
				throw new Error('Save failed');
			}
		} catch (error) {
			console.error('Error saving progress:', error);
			saveError = 'Failed to save progress. Please try again.';
		} finally {
			isSaving = false;
		}
	};

	$: if (!storeLoading && initialized) {
		// Automatically select highest unlocked level
		const highestUnlocked = Math.max(...Array.from(currentUnlockedLevels));
		if (!currentUnlockedLevels.has(selectedLevel + 1)) {
			selectedLevel = highestUnlocked - 1; // Convert to 0-based index
		}
		// Recalculate nextLockedLevel and daysUntilUnlock
		nextLockedLevel = getNextLockedLevel(selectedLevel + 1);
		daysUntilUnlock = nextLockedLevel ? getDaysUntilUnlock(nextLockedLevel) : 0;
	}

	$: isAuthChecking = $userStore.loading;
</script>

<div class="flex w-full flex-col items-center justify-center gap-8 p-8">
	{#if isAuthChecking || isLoading}
		<div class="flex min-h-screen w-full items-center justify-center">
			<div class="text-center">
				<Spinner size="12" class="mb-4" />
				<p class="text-gray-600">
					{isAuthChecking ? 'Checking authentication...' : 'Loading your progress...'}
				</p>
			</div>
		</div>
	{:else}
		<div class="flex w-full rounded-lg border border-orange-500 bg-orange-50 shadow-lg">
			<div class="flex w-full flex-col items-center justify-center gap-2 p-4">
				<span class="text-sm text-orange-600">Name</span>
				<span class="w-max text-2xl font-bold text-orange-800">
					{loggedInUser ? loggedInUser?.displayName || loggedInUser?.email : 'Guest'}
				</span>
			</div>

			<div
				class="flex w-full flex-col items-center justify-center gap-2 border-x border-orange-300 p-4"
			>
				<span class="text-sm text-orange-600">Level</span>
				<span class="text-2xl font-bold text-orange-800">{displayLevel}</span>
			</div>

			<div
				class="flex w-full flex-col items-center justify-center gap-2 border-r border-orange-300 p-4"
			>
				<span class="text-sm text-orange-600">Progress</span>
				<span class="text-2xl font-bold text-orange-800">{progress}%</span>
			</div>

			<div class="flex w-full flex-col items-center justify-center gap-2 p-4">
				<span class="text-sm text-orange-600">Streak</span>
				<span class="w-max text-2xl font-bold text-orange-800">{streak} days</span>
			</div>
		</div>

		{#if loggedInUser && !$dailyProgressStore.loading && $dailyProgressStore.initialized}
			{#if streak >= 30}
				<div class="mt-4 text-center font-bold text-green-600">
					Congratulations! You've unlocked all levels! 🎉
				</div>
			{:else if nextLockedLevel && daysUntilUnlock > 0 && nextLockedLevel !== 3}
				<div class="mt-4 text-center text-orange-600">
					Level {nextLockedLevel} will be unlocked in {daysUntilUnlock} day{daysUntilUnlock >
					1
						? 's'
						: ''}.
				</div>
			{/if}
		{/if}

		{#if !loggedInUser}
			<Alert color="yellow" class="mb-4">
				<InfoCircleSolid slot="icon" class="h-5 w-5" />
				Please login to mark tasks as complete and save your progress.
			</Alert>
		{/if}

		<div class="flex gap-4">
			{#each levels as level, index}
				{@const levelNum = index + 1}
				<button
					class="rounded-md px-4 py-2 text-white {index === selectedLevel
						? 'bg-orange-600'
						: currentUnlockedLevels.has(levelNum)
							? 'bg-orange-400 hover:bg-orange-500'
							: 'cursor-not-allowed bg-gray-400'}"
					on:click={() => changeLevel(index)}
					disabled={!currentUnlockedLevels.has(levelNum) && loggedInUser}
				>
					{level.name}
					{#if !currentUnlockedLevels.has(levelNum) && loggedInUser}
						<span class="ml-2">🔒</span>
					{/if}
				</button>
			{/each}
		</div>

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
						disabled={!loggedInUser}
					>
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

		<div class="mt-4 flex flex-col items-center gap-4">
			{#if saveError}
				<Alert color="red" class="mb-2">
					<InfoCircleSolid slot="icon" class="h-5 w-5" />
					{saveError}
				</Alert>
			{/if}

			{#if saveSuccess}
				<Alert color="green" class="mb-2">
					<InfoCircleSolid slot="icon" class="h-5 w-5" />
					Progress saved successfully!
				</Alert>
			{/if}

			<button
				class="inline-flex items-center gap-2 rounded-md bg-orange-600 px-6 py-2 text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
				on:click={saveProgress}
				disabled={isSaving || !loggedInUser}
			>
				{#if isSaving}
					<Spinner class="h-4 w-4" />
				{/if}
				{isSaving ? 'Saving...' : 'Save Progress'}
			</button>
		</div>

		<Modal bind:open={showUnlockModal} size="xs" autoclose class="w-full">
			<div class="text-center">
				<h3
					class="mb-4 text-2xl font-bold {unlockedLevel === 'max'
						? 'text-green-600'
						: 'text-orange-600'}"
				>
					{#if unlockedLevel === 'max'}
						Maximum Level Achieved! 🎊
					{:else}
						Level {unlockedLevel} Unlocked! 🎉
					{/if}
				</h3>
				<p class="mb-6 text-gray-600">
					{#if unlockedLevel === 'max'}
						Amazing achievement! You've maintained your streak for 30 days and unlocked
						all levels!
					{:else}
						Congratulations! You've maintained your streak for {streak} days and unlocked
						Level {unlockedLevel}!
					{/if}
				</p>
				<Button
					color={unlockedLevel === 'max' ? 'green' : 'primary'}
					on:click={() => {
						if (unlockedLevel !== 'max') {
							changeLevel(unlockedLevel - 1);
						}
						setTimeout(() => (showUnlockModal = false), 100);
					}}
				>
					{unlockedLevel === 'max' ? 'Continue Journey' : `Go to Level ${unlockedLevel}`}
				</Button>
			</div>
		</Modal>
	{/if}
</div>
