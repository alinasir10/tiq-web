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
		loading: storeLoading,
		initialized,
		streak,
		userLevel,
		hasTodayProgress
	} = $dailyProgressStore);

	$: isLoading = userLoading || (loggedInUser && storeLoading);
	$: displayLevel = userLevel || 1;

	$: completedTasks = currentLevel.tasks.filter((task) => task.completed).length;
	$: progress = Math.round((completedTasks / currentLevel.tasks.length) * 100);
	$: daysUntilNextLevel = taskUnlockDays[selectedLevel + 1]
		? Math.max(0, taskUnlockDays[selectedLevel + 1] - streak)
		: 0;

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
		currentLevel.tasks[taskIndex].completed = !currentLevel.tasks[taskIndex].completed;
	};

	const isLevelAccessible = (levelIndex) => {
		if (storeLoading || !initialized) return false;
		if (streak >= 30) return true;

		if (streak >= 20) return levelIndex === 2;
		if (streak >= 10) return levelIndex === 1;
		return levelIndex === 0;
	};

	const changeLevel = (levelIndex) => {
		if (!isLevelAccessible(levelIndex)) return;
		selectedLevel = levelIndex;

		currentLevel = {
			...levels[levelIndex],
			tasks:
				$dailyProgressStore.data?.level === levelIndex + 1
					? $dailyProgressStore.data.tasks
					: [...levels[levelIndex].tasks]
		};
	};

	const getLevelButtonState = (index) => {
		if (streak >= 30) return 'enabled';
		if (index === selectedLevel) return 'selected';
		if (!isLevelAccessible(index)) return 'disabled';
		return 'enabled';
	};

	$: currentLevel = $dailyProgressStore.data
		? {
				...levels[selectedLevel],
				tasks:
					selectedLevel === $dailyProgressStore.data.level - 1
						? $dailyProgressStore.data.tasks
						: levels[selectedLevel].tasks
			}
		: levels[selectedLevel];

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
			date: serverTimestamp(),
			level: selectedLevel + 1,
			progress,
			completedTasks: completedTasks,
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
			if (saveSuccess) {
				setTimeout(() => {
					saveSuccess = false;
				}, 3000);
			}
		}
	};

	$: if (!storeLoading && initialized) {
		if (streak >= 20) selectedLevel = 2;
		else if (streak >= 10) selectedLevel = 1;
		else selectedLevel = 0;
	}
</script>

<div class="flex w-full flex-col items-center justify-center gap-8 p-8">
	{#if isLoading && $userStore.isAuthenticated}
		<div class="flex min-h-screen w-full items-center justify-center">
			<div class="text-center">
				<Spinner size="12" class="mb-4" />
				<p class="text-gray-600">Loading your progress...</p>
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
			{:else if daysUntilNextLevel > 0}
				<div class="mt-4 text-center text-orange-600">
					Next level will be unlocked in {daysUntilNextLevel} day{daysUntilNextLevel > 1
						? 's'
						: ''}.
				</div>
			{/if}
		{/if}

		<div class="flex gap-4">
			{#each levels as level, index}
				<button
					class="rounded-md px-4 py-2 text-white {getLevelButtonState(index) ===
					'selected'
						? 'bg-orange-600'
						: getLevelButtonState(index) === 'disabled'
							? 'cursor-not-allowed bg-gray-400'
							: 'bg-orange-400 hover:bg-orange-500'}"
					on:click={() => changeLevel(index)}
					disabled={!isLevelAccessible(index)}
				>
					{level.name}
					{#if !isLevelAccessible(index) && index > selectedLevel}
						🔒
					{/if}
					{#if !isLevelAccessible(index) && index < selectedLevel}
						✓
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
