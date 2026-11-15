<template>
  <button
    class="hx-btn"
    :class="[`hx-btn--${variant}`, `hx-btn--${size}`, { 'hx-btn--block': block }]"
    :disabled="disabled"
    type="button"
  >
    <HxIcon v-if="iconName" :name="iconName" :size="14" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import HxIcon from './HxIcon.vue'

withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'soft' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    block?: boolean
    disabled?: boolean
    iconName?: string
  }>(),
  { variant: 'primary', size: 'md', block: false, disabled: false },
)
</script>
