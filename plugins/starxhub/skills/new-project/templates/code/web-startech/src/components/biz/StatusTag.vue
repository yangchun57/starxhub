<template>
  <HxTag :tone="tone"><slot>{{ status }}</slot></HxTag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HxTag from '@/components/base/HxTag.vue'
import type { Tone } from '@/types'

const props = defineProps<{ status: string }>()
const MAP: Record<string, Tone> = {
  已完成: 'success', 已发货: 'info', 待付款: 'warning', 处理中: 'brand',
  已取消: 'danger', 退款中: 'danger', 在售: 'success', 草稿: 'info',
  已下架: 'danger', 进行中: 'success', 未开始: 'brand', 已结束: 'info',
  企业客户: 'brand', 金卡客户: 'warning', 银卡客户: 'info', 普通客户: 'info',
}
const tone = computed<Tone>(() => MAP[props.status] ?? 'info')
</script>
