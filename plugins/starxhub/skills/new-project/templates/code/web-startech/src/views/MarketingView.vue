<template>
  <div class="hx-col" style="gap: var(--hx-gap-section)">
    <PageHeader title="营销活动" desc="活动策划、投放渠道与转化效果">
      <template #actions>
        <HxButton icon-name="plus">创建活动</HxButton>
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
      <HxCard title="活动列表" sub="共 4 个活动">
        <DataTable :columns="columns" :rows="campaigns" />
      </HxCard>

      <div class="hx-col" style="gap: var(--hx-gap-section)">
        <HxCard title="本月投放概览">
          <div class="hx-card-pad hx-demo">
            <div v-for="c in channels" :key="c.label" class="hx-col" style="gap: 5px">
              <div class="hx-row-between">
                <span class="hx-body">{{ c.label }}</span>
                <span class="hx-num hx-sm hx-semibold">¥ {{ c.value.toLocaleString() }}</span>
              </div>
              <div class="hx-progress" style="height: 8px">
                <div class="hx-progress-fill" :style="{ width: c.percent + '%', background: c.color }" />
              </div>
            </div>
          </div>
        </HxCard>
        <HxCard title="活动日历">
          <div class="hx-card-pad">
            <div class="hx-timeline">
              <div v-for="(c, i) in campaigns" :key="c.id" class="hx-timeline-item">
                <i class="hx-timeline-dot" :style="{ background: colors[i % colors.length] }" />
                <div class="hx-col">
                  <span class="hx-body hx-semibold">{{ c.name }}</span>
                  <span class="hx-xs hx-muted">{{ c.period }} · {{ c.channel }}</span>
                </div>
              </div>
            </div>
          </div>
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
import { campaigns } from '@/mock'
import type { Campaign, TableColumn, Tone } from '@/types'

const TONE: Record<string, Tone> = { 进行中: 'success', 未开始: 'brand', 已结束: 'info' }
const stats = [
  { label: '进行中活动', value: '2', hint: '本月底结束 1 个' },
  { label: '本月预算（元）', value: '284,000', hint: '已使用 46.8%' },
  { label: '平均转化率', value: '5.4%', hint: '较上月 +0.8pt' },
  { label: '带来的订单', value: '386', hint: '环比 +18.2%' },
]
const columns: TableColumn<Campaign>[] = [
  { key: 'id', title: '活动编号', link: true },
  { key: 'name', title: '活动名称' },
  { key: 'channel', title: '投放渠道' },
  { key: 'budget', title: '预算', render: (r) => `¥ ${r.budget.toLocaleString()}`, align: 'right' },
  { key: 'conversion', title: '转化率', align: 'right' },
  { key: 'status', title: '状态', tone: (r) => TONE[r.status] ?? 'info' },
  { key: 'period', title: '活动周期' },
]
const channels = [
  { label: '微信小程序', value: 86000, percent: 88, color: 'var(--hx-chart-1)' },
  { label: '直营渠道', value: 120000, percent: 72, color: 'var(--hx-chart-2)' },
  { label: '搜索引擎', value: 42000, percent: 46, color: 'var(--hx-chart-3)' },
  { label: '其他', value: 36000, percent: 28, color: 'var(--hx-chart-4)' },
]
const colors = ['var(--hx-chart-1)', 'var(--hx-chart-2)', 'var(--hx-chart-3)', 'var(--hx-chart-4)']
</script>
