<template>
  <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" fill="none" aria-label="流量来源环形图">
    <g :transform="`rotate(-90 ${size / 2} ${size / 2})`">
      <circle :cx="c" :cy="c" :r="r" :stroke="track" :stroke-width="thickness" />
      <circle
        v-for="(seg, i) in segments"
        :key="i"
        :cx="c" :cy="c" :r="r"
        :stroke="seg.color"
        :stroke-width="thickness"
        :stroke-dasharray="`${seg.length} ${circumference}`"
        :stroke-dashoffset="seg.offset"
      />
    </g>
    <text v-if="centerLabel" :x="c" :y="c - 2" text-anchor="middle" font-size="12" fill="var(--hx-text-secondary)">{{ centerLabel }}</text>
    <text v-if="centerValue" :x="c" :y="c + 16" text-anchor="middle" font-size="15" font-weight="700" fill="var(--hx-text-primary)">{{ centerValue }}</text>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TrafficSource } from '@/types'
const props = withDefaults(
  defineProps<{
    items: TrafficSource[]
    size?: number
    thickness?: number
    centerLabel?: string
    centerValue?: string
    track?: string
  }>(),
  { size: 140, thickness: 17, track: 'var(--hx-chart-grid)' },
)
const c = computed(() => props.size / 2)
const r = computed(() => props.size / 2 - props.thickness / 2 - 8)
const circumference = computed(() => 2 * Math.PI * r.value)
const segments = computed(() => {
  let acc = 0
  return props.items.map((item) => {
    const length = (item.percent / 100) * circumference.value
    const seg = { color: item.color, length, offset: -acc }
    acc += length
    return seg
  })
})
</script>
