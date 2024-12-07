<script>
    export let src = ''; // Replace with your book cover URL
    export let rtl = false
    let className = ''
    export {className as class}
</script>

<div class="relative overflow-hidden {rtl ? 'rounded-r-lg rounded-l-md' : 'rounded-l-lg rounded-r-md'} shadow-2xl {className}">
  <!-- Book Cover Image -->
  <img
    src={src}
    alt="Book Cover"
    class="w-full h-auto object-cover"
  />

  <!-- Top Shadow for Thickness -->
  <div class="absolute inset-x-0 top-0 h-[0.5%] bg-gradient-to-b from-gray-800/10 to-transparent pointer-events-none"></div>

  {#if rtl}
    <!-- Right-to-Left Direction Shadows (Spine on the Right) -->

    <!-- Main Spine Bump Effect (Right side for RTL) -->
    <div class="absolute inset-y-0 right-0 w-[5%] rounded-r-md bg-gradient-to-l from-gray-700/60 to-transparent pointer-events-none shadow-md"></div>

    <!-- White Highlight for Added Depth (Right side for RTL) -->
    <div class="absolute inset-y-0 right-0 w-[2%] rounded-r-md bg-gradient-to-l from-white/20 to-transparent pointer-events-none"></div>

  {:else}
    <!-- Left-to-Right Direction Shadows (Default, Spine on the Left) -->

    <!-- Main Spine Bump Effect (Left side for LTR) -->
    <div class="absolute inset-y-0 left-0 w-[5%] rounded-l-md bg-gradient-to-r from-gray-700/60 to-transparent pointer-events-none shadow-md"></div>

    <!-- White Highlight for Added Depth (Left side for LTR) -->
    <div class="absolute inset-y-0 left-0 w-[2%] rounded-l-md bg-gradient-to-r from-white/20 to-transparent pointer-events-none"></div>
  {/if}

  <!-- Bottom Shadow for Thickness -->
  <div class="absolute inset-x-0 bottom-0 h-[0.75%] bg-gradient-to-t from-gray-800/20 to-transparent pointer-events-none"></div>
</div>