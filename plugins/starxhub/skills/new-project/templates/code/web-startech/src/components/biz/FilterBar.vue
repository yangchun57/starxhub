<template>
  <div class="hx-filter">
    <slot />
    <span class="hx-spacer" />
    <HxButton @click="emit('query')">查询</HxButton>
    <button class="hx-btn hx-btn--ghost hx-btn--sm" @click="emit('reset')">重置</button>
  </div>
</template>

<script setup lang="ts">
import HxButton from '@/components/base/HxButton.vue'
const emit = defineEmits<{ query: []; reset: [] }>()
</script>
