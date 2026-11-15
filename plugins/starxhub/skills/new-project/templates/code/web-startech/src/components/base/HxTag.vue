<template>
  <span class="hx-tag" :class="[`hx-tag--${tone}`, { 'hx-tag--pill': pill }]">
    <slot />
  </span>
</template>

<script setup lang="ts">
import type { Tone } from '@/types'
withDefaults(defineProps<{ tone?: Tone; pill?: boolean }>(), { tone: 'info', pill: false })
</script>
