<template>
  <div class="hx-todo">
    <span
      class="hx-todo-icon"
      :style="{
        background: SOFT[item.tone],
        color: COLOR[item.tone],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
      }"
      v-html="icon(item.icon)"
    />
    <div class="hx-col hx-spacer">
      <span class="hx-todo-title">{{ item.title }}</span>
      <span class="hx-todo-time">{{ item.time }}</span>
    </div>
    <HxTag :tone="item.tone">{{ item.source }}</HxTag>
  </div>
</template>

<script setup lang="ts">
import HxTag from '@/components/base/HxTag.vue'
import { icon } from '@/assets/icons'
import type { Activity, Tone } from '@/types'

defineProps<{ item: Activity }>()
const COLOR: Record<Tone, string> = {
  brand: 'var(--hx-brand)', success: 'var(--hx-success-bright)',
  warning: 'var(--hx-warning-bright)', danger: 'var(--hx-danger-bright)', info: 'var(--hx-info)',
}
const SOFT: Record<Tone, string> = {
  brand: 'var(--hx-brand-soft)', success: 'var(--hx-success-soft)',
  warning: 'var(--hx-warning-soft)', danger: 'var(--hx-danger-soft)', info: 'var(--hx-info-soft)',
}
</script>
