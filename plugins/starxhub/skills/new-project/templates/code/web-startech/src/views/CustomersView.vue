<template>
  <div class="hx-col" style="gap: var(--hx-gap-section)">
    <PageHeader title="客户管理" desc="客户分层、活跃度与消费画像">
      <template #actions>
        <HxButton variant="secondary" icon-name="download">导出客户</HxButton>
        <HxButton icon-name="plus">新增客户</HxButton>
      </template>
    </PageHeader>

    <div class="hx-grid-kpi">
      <div v-for="s in stats" :key="s.label" class="hx-stat hx-stat--compact">
        <span class="hx-stat-label">{{ s.label }}</span>
        <span class="hx-stat-value">{{ s.value }}</span>
        <span class="hx-stat-hint is-up">{{ s.hint }}</span>
      </div>
    </div>

    <div class="hx-grid-main">
      <HxCard title="客户列表" :sub="`共 ${customers.length} 位客户`">
        <DataTable :columns="columns" :rows="customers" />
      </HxCard>

      <div class="hx-col" style="gap: var(--hx-gap-section)">
        <HxCard title="客户等级分布">
          <div class="hx-card-pad hx-row" style="gap: 14px">
            <HxDonutChart :items="levels" center-label="客户总数" center-value="1,842" />
            <div class="hx-legend hx-spacer">
              <div v-for="l in levels" :key="l.label" class="hx-legend-row">
                <i class="hx-legend-dot" :style="{ background: l.color }" />
                <span class="hx-legend-label">{{ l.label }}</span>
                <span class="hx-legend-value">{{ l.percent }}%</span>
              </div>
            </div>
          </div>
        </HxCard>
        <HxCard title="最近活跃">
          <TodoItem v-for="a in recent" :key="a.id" :item="a" />
        </HxCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PageHeader from '@/components/layout/PageHeader.vue'
import HxButton from '@/components/base/HxButton.vue'
import HxCard from '@/components/base/HxCard.vue'
import DataTable from '@/components/biz/DataTable.vue'
import TodoItem from '@/components/biz/TodoItem.vue'
import HxDonutChart from '@/components/charts/HxDonutChart.vue'
import { customers, activities } from '@/mock'
import type { Customer, TableColumn, Tone } from '@/types'

const stats = [
  { label: '客户总数', value: '1,842', hint: '本月 +128 位' },
  { label: '活跃客户', value: '8,672', hint: '环比 +5.2%' },
  { label: '复购率', value: '42.6%', hint: '较上月 +2.1pt' },
  { label: '客户满意度', value: '98.2%', hint: '近 30 天' },
]
const TONE: Record<string, Tone> = { 企业客户: 'brand', 金卡客户: 'warning', 银卡客户: 'info', 普通客户: 'info' }
const columns: TableColumn<Customer>[] = [
  { key: 'id', title: '客户编号', link: true },
  { key: 'name', title: '客户名称' },
  { key: 'level', title: '客户等级', tone: (r) => TONE[r.level] ?? 'info' },
  { key: 'orders', title: '累计订单', align: 'right' },
  { key: 'total', title: '累计消费', render: (r) => `¥ ${r.total.toLocaleString()}`, align: 'right' },
  { key: 'lastActive', title: '最近活跃' },
]
const levels = [
  { label: '企业客户', percent: 18.4, color: 'var(--hx-chart-1)' },
  { label: '金卡客户', percent: 26.2, color: 'var(--hx-chart-2)' },
  { label: '银卡客户', percent: 33.1, color: 'var(--hx-chart-3)' },
  { label: '普通客户', percent: 22.3, color: 'var(--hx-chart-4)' },
]
const recent = activities.slice(0, 3)
</script>
