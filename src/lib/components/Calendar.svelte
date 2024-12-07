<script>
	import { onMount } from 'svelte';
	import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
	export let progressHistory = [];

	let calendarDays = [];

	onMount(() => {
		const today = new Date();
		const monthStart = startOfMonth(today);
		const monthEnd = endOfMonth(today);
		const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

		calendarDays = daysInMonth.map((date) => {
			const dateStr = format(date, 'yyyy-MM-dd');
			const progressData = progressHistory.find((p) => p.date === dateStr);
			return {
				date,
				progress: progressData ? progressData.progress : 0,
				completedTasks: progressData ? progressData.completedTasks : 0,
				totalTasks: progressData ? progressData.totalTasks : 0
			};
		});
	});

	function getBackgroundColor(progress) {
		if (progress === 100) return '#4caf50'; // Green for full completion
		if (progress >= 50) return '#ffeb3b'; // Yellow for half completion
		if (progress > 0) return '#f44336'; // Red for some progress
		return '#e0e0e0'; // Grey for no progress
	}
</script>

<div class="calendar-grid">
	{#each calendarDays as day}
		<div
			class="calendar-cell"
			style="background-color: {getBackgroundColor(day.progress)}"
			title="Progress: {day.progress}%\nTasks Completed: {day.completedTasks}/{day.totalTasks}"
		>
			{day.date.getDate()}
		</div>
	{/each}
</div>

<style>
	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		grid-gap: 4px;
	}
	.calendar-cell {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
	}
</style>
