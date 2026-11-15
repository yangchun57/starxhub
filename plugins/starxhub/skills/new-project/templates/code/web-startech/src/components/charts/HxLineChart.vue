<template>
  <svg class="hx-chart" viewBox="0 0 738 150" preserveAspectRatio="none" fill="none" aria-label="营收趋势折线图">
    <path d="M0 10H738M0 55H738M0 100H738M0 145H738" stroke="var(--hx-chart-grid)" stroke-width="1" />
    <path :d="areaPath" :fill="color" fill-opacity="0.10" />
    <path v-if="compare?.length" :d="comparePath" stroke="var(--hx-chart-compare)" stroke-width="2" stroke-dasharray="5 5" stroke-linecap="round" />
    <path :d="linePath" :stroke="color" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    <circle v-for="(p, i) in markers" :key="i" :cx="p[0]" :cy="p[1]" r="4.5" fill="var(--hx-surface)" :stroke="color" stroke-width="2.5" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(
  defineProps<{ data: number[]; compare?: number[]; color?: string }>(),
  { color: 'var(--hx-chart-1)' },
)
const toPath = (arr: number[]) => {
  if (!arr.length) return ''
  const max = Math.max(...arr)
  const min = Math.min(...arr)
  const span = max - min || 1
  const step = 738 / Math.max(1, arr.length - 1)
  return arr
    .map((v, i) => [i * step, 140 - ((v - min) / span) * 120] as [number, number])
    .map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(' ')
}
const linePath = computed(() => toPath(props.data))
const comparePath = computed(() => toPath(props.compare ?? []))
const areaPath = computed(() => `${linePath.value} L738 150 L0 150 Z`)
const markers = computed(() => {
  const arr = props.data
  if (arr.length < 3) return []
  const max = Math.max(...arr), min = Math.min(...arr), span = max - min || 1
  const step = 738 / Math.max(1, arr.length - 1)
  return [Math.floor(arr.length * 0.7), arr.length - 2].map((i) => [i * step, 140 - ((arr[i] - min) / span) * 120] as [number, number])
})
</script>
