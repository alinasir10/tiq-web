<script>
  import { Button } from 'flowbite-svelte';
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-orange-50 via-blue-100 to-blue-200 dark:from-gray-800 dark:to-gray-900 p-8">
  <!-- Hero Section -->
  <h1 class="mb-8 text-center text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-700 md:text-7xl lg:text-8xl">
    Welcome to <span class="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-600">Sunnah 24/7</span>
  </h1>
  <p class="mb-12 text-lg text-gray-600 dark:text-gray-400 max-w-2xl text-center">
    Your ultimate companion in embracing and following the Sunnah every day. Get resources and tools to stay on track.
  </p>

  <!-- Footer Section -->
  <div class="mt-16 text-center">
    <p class="text-sm text-gray-500 dark:text-gray-400">
      © {new Date().getFullYear()} Sunnah 24/7. All rights reserved.
    </p>
  </div>
</div>
