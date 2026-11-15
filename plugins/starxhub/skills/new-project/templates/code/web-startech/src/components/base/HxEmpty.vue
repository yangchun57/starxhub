<template>
  <div class="hx-empty">
    <svg class="hx-empty-icon" viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="1.6">
      <rect x="8" y="14" width="40" height="30" rx="5" />
      <path d="M8 22h40M18 32h8M18 38h14" stroke-linecap="round" />
      <circle cx="40" cy="36" r="6" />
      <path d="M44.5 40.5L50 46" stroke-linecap="round" />
    </svg>
    <span>{{ text }}</span>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ text?: string }>(), { text: '暂无数据' })
</script>
