<template>
  <svg :viewBox="`0 0 ${w} ${h}`" preserveAspectRatio="none" fill="none" aria-hidden="true">
    <path :d="area" :fill="color" fill-opacity="0.09" />
    <path :d="line" :stroke="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(
  defineProps<{ data: number[]; color?: string; width?: number; height?: number }>(),
  { color: 'var(--hx-brand)', width: 70, height: 28 },
)
const w = computed(() => props.width)
const h = computed(() => props.height)
const points = computed(() => {
  const d = props.data
  if (!d.length) return [] as [number, number][]
  const max = Math.max(...d)
  const min = Math.min(...d)
  const span = max - min || 1
  const step = w.value / Math.max(1, d.length - 1)
  return d.map((v, i) => [i * step, h.value - 3 - ((v - min) / span) * (h.value - 6)] as [number, number])
})
const line = computed(() => points.value.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' '))
const area = computed(() => `${line.value} L${w.value} ${h.value} L0 ${h.value} Z`)
</script>
