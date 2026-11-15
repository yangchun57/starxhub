<template>
  <span class="hx-nav-icon" :style="{ width: size + 'px', height: size + 'px', flex: `0 0 ${size}px` }" v-html="icon(name)" />
</template>

<script setup lang="ts">
import { icon } from '@/assets/icons'
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 18 })
</script>
