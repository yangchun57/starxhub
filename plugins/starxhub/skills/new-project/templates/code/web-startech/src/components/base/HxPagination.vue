<template>
  <div class="hx-pagination">
    <button
      v-for="p in visiblePages"
      :key="p"
      class="hx-page"
      :class="{ 'is-active': p === model }"
      @click="model = p"
    >{{ p }}</button>
    <button class="hx-page" style="min-width: 64px" @click="next">下一页</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(
  defineProps<{ total?: number; pageSize?: number; span?: number }>(),
  { total: 2486, pageSize: 6, span: 3 },
)
const model = defineModel<number>({ default: 1 })
const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const visiblePages = computed(() => {
  const start = Math.min(Math.max(1, model.value - 1), Math.max(1, pageCount.value - props.span + 1))
  return Array.from({ length: Math.min(props.span, pageCount.value) }, (_, i) => start + i)
})
const next = () => { if (model.value < pageCount.value) model.value += 1 }
</script>
