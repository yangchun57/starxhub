<template>
  <div class="hx-page-head">
    <div>
      <h1 class="hx-page-title">{{ title }}</h1>
      <p class="hx-page-desc">{{ desc }}</p>
    </div>
    <div class="hx-row">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; desc?: string }>()
</script>
