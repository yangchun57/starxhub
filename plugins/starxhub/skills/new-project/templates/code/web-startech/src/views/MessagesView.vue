<template>
  <div class="hx-col" style="gap: var(--hx-gap-section)">
    <PageHeader title="消息通知" desc="系统提醒、业务预警与待办消息">
      <template #actions>
        <HxButton variant="secondary" icon-name="check" @click="markAllRead">全部标记已读</HxButton>
      </template>
    </PageHeader>

    <div class="hx-grid-kpi">
      <div v-for="s in stats" :key="s.label" class="hx-stat hx-stat--compact">
        <span class="hx-stat-label">{{ s.label }}</span>
        <span class="hx-stat-value">{{ s.value }}</span>
        <span class="hx-stat-hint is-up">{{ s.hint }}</span>
      </div>
    </div>

    <HxCard>
      <template #extra>
        <div class="hx-tabs">
          <button v-for="t in ['全部消息', '未读', '已读']" :key="t" class="hx-tab" :class="{ 'is-active': tab === t }" @click="tab = t">{{ t }}</button>
        </div>
      </template>
      <div class="hx-card-head">
        <span class="hx-card-title">消息列表</span>
        <span class="hx-card-sub">共 {{ filtered.length }} 条</span>
      </div>
      <div class="hx-divider" />
      <div v-for="m in filtered" :key="m.id" class="hx-todo" style="align-items: flex-start; padding: 16px 18px">
        <span
          class="hx-todo-icon"
          :style="{ background: `var(--hx-${m.tone}-soft)`, color: `var(--hx-${m.tone})`, borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 26px' }"
          v-html="icon(m.tone === 'warning' ? 'alert' : m.tone === 'danger' ? 'ticket' : m.tone === 'success' ? 'check' : 'bell')"
        />
        <div class="hx-col hx-spacer" style="gap: 4px">
          <div class="hx-row" style="gap: 8px">
            <span class="hx-body hx-semibold">{{ m.title }}</span>
            <span v-if="!m.read" class="hx-tag hx-tag--brand">未读</span>
          </div>
          <span class="hx-body hx-secondary">{{ m.body }}</span>
          <span class="hx-todo-time">{{ m.time }}</span>
        </div>
        <HxButton v-if="!m.read" size="sm" variant="ghost" @click="m.read = true">标记已读</HxButton>
      </div>
      <HxEmpty v-if="!filtered.length" text="这里空空如也，没有符合条件的消息" />
    </HxCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import HxButton from '@/components/base/HxButton.vue'
import HxCard from '@/components/base/HxCard.vue'
import HxEmpty from '@/components/base/HxEmpty.vue'
import { icon } from '@/assets/icons'
import { messages as seed } from '@/mock'

const items = ref(seed.map((m) => ({ ...m })))
const tab = ref('全部消息')
const stats = [
  { label: '未读消息', value: String(items.value.filter((m) => !m.read).length), hint: '建议 24 小时内处理' },
  { label: '今日新增', value: '3', hint: '较昨日 -1' },
  { label: '业务预警', value: '2', hint: '库存与订单' },
  { label: '系统通知', value: '1', hint: '例行维护' },
]
const filtered = computed(() => items.value.filter((m) =>
  tab.value === '全部消息' || (tab.value === '未读' ? !m.read : m.read)))
const markAllRead = () => items.value.forEach((m) => { m.read = true })
</script>
