<template>
  <div class="hx-stat" :class="{ 'hx-stat--compact': compact }">
    <div class="hx-stat-head">
      <svg class="hx-icon-block" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="9" :fill="soft" />
        <g :stroke="metric.color" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="glyph" />
      </svg>
      <HxTag :tone="metric.deltaTone">{{ metric.delta }}</HxTag>
    </div>
    <span class="hx-stat-label">{{ metric.label }}</span>
    <span class="hx-stat-value">{{ metric.value }}</span>
    <Sparkline v-if="!compact" class="hx-stat-spark" :data="metric.spark" :color="metric.color" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HxTag from '@/components/base/HxTag.vue'
import Sparkline from '@/components/charts/Sparkline.vue'
import type { Metric, Tone } from '@/types'

const props = withDefaults(defineProps<{ metric: Metric; compact?: boolean }>(), { compact: false })

const SOFT: Record<Tone | string, string> = {
  brand: 'var(--hx-brand-soft)', success: 'var(--hx-success-soft)',
  warning: 'var(--hx-warning-soft)', danger: 'var(--hx-danger-soft)', info: 'var(--hx-info-soft)',
}
const GLYPHS: Record<string, string> = {
  revenue: '<rect x="8" y="10" width="16" height="13" rx="2.5"/><path d="M8 14h16M16 18h4"/>',
  orders: '<rect x="10" y="8" width="12" height="16" rx="2"/><path d="M13 13h6M13 17h6M13 20.5h4"/>',
  users: '<circle cx="16" cy="13" r="3"/><path d="M10 23c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/>',
  todos: '<rect x="10" y="8" width="12" height="16" rx="2"/><path d="M13 13.5h6M13 17.5h4"/>',
  card: '<rect x="8" y="10" width="16" height="13" rx="2.5"/><path d="M8 14h16M16 18h4"/>',
  customer: '<circle cx="16" cy="13" r="3"/><path d="M10 23c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/>',
  ticket: '<rect x="10" y="8" width="12" height="16" rx="2"/><path d="M13 13.5h6M13 17.5h4"/>',
}
const glyph = computed(() => GLYPHS[props.metric.icon] ?? GLYPHS.card)
const soft = computed(() => {
  const key = props.metric.key
  if (key === 'revenue') return 'var(--hx-brand-soft)'
  if (key === 'orders') return 'var(--hx-warning-soft)'
  if (key === 'users') return 'var(--hx-success-soft)'
  if (key === 'todos') return 'var(--hx-danger-soft)'
  return SOFT.brand
})
</script>
