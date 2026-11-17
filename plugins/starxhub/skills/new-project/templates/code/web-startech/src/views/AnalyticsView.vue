<template>
  <div class="hx-col" style="gap: var(--hx-gap-section)">
    <PageHeader title="数据看板" desc="全渠道经营指标与转化分析 · 数据更新于 2026-11-15 19:30">
      <template #actions>
        <div class="hx-tabs">
          <button v-for="t in ['近 7 天', '近 30 天', '近 12 月']" :key="t" class="hx-tab" :class="{ 'is-active': range === t }" @click="range = t">{{ t }}</button>
        </div>
        <HxButton variant="secondary" icon-name="download">导出报告</HxButton>
      </template>
    </PageHeader>

    <div class="hx-grid-kpi">
      <StatCard v-for="m in metrics" :key="m.key" :metric="m" />
    </div>

    <HxCard title="营收与订单趋势" sub="蓝色为当期，虚线为上期对比">
      <div class="hx-card-pad">
        <div class="hx-row" style="gap: 16px; margin-bottom: 10px">
          <span class="hx-metric">¥ 486,320</span>
          <HxTag tone="success">同比 +12.8%</HxTag>
          <HxTag tone="brand">环比 +6.4%</HxTag>
        </div>
        <HxLineChart :data="revenueTrend" :compare="compareTrend" />
        <p class="hx-chart-axis">11/01　　11/05　　11/09　　11/13　　11/17　　11/21　　11/25　　11/30</p>
      </div>
    </HxCard>

    <div class="hx-grid-2">
      <HxCard title="渠道转化漏斗">
        <div class="hx-card-pad hx-demo">
          <div v-for="(f, i) in funnel" :key="f.label" class="hx-col" style="gap: 5px">
            <div class="hx-row-between">
              <span class="hx-body">{{ f.label }}</span>
              <span class="hx-num hx-caption hx-semibold">{{ f.value.toLocaleString() }} · {{ f.percent }}%</span>
            </div>
            <div class="hx-progress" style="height: 10px">
              <div class="hx-progress-fill" :style="{ width: f.percent + '%', background: f.color }" />
            </div>
          </div>
        </div>
      </HxCard>

      <HxCard title="流量来源构成">
        <div class="hx-card-pad hx-row" style="gap: 14px">
          <HxDonutChart :items="trafficSources" center-label="总访问量" center-value="42,861" />
          <div class="hx-legend hx-spacer">
            <div v-for="s in trafficSources" :key="s.label" class="hx-legend-row">
              <i class="hx-legend-dot" :style="{ background: s.color }" />
              <span class="hx-legend-label">{{ s.label }}</span>
              <span class="hx-legend-value">{{ s.percent }}%</span>
            </div>
          </div>
        </div>
      </HxCard>
    </div>

    <HxCard title="区域业绩">
      <div class="hx-card-pad hx-demo">
        <div v-for="r in regions" :key="r.name" class="hx-row" style="gap: 12px">
          <span class="hx-body" style="width: 88px">{{ r.name }}</span>
          <div class="hx-spacer" style="height: 12px; border-radius: 6px; background: var(--hx-border-soft)">
            <div :style="{ width: r.percent + '%', height: '100%', borderRadius: '6px', background: r.color }" />
          </div>
          <span class="hx-num hx-caption hx-semibold" style="width: 96px; text-align: right">¥ {{ r.value.toLocaleString() }}</span>
        </div>
      </div>
    </HxCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import HxButton from '@/components/base/HxButton.vue'
import HxCard from '@/components/base/HxCard.vue'
import HxTag from '@/components/base/HxTag.vue'
import StatCard from '@/components/biz/StatCard.vue'
import HxLineChart from '@/components/charts/HxLineChart.vue'
import HxDonutChart from '@/components/charts/HxDonutChart.vue'
import { metrics, revenueTrend, compareTrend, trafficSources } from '@/mock'

const range = ref('近 30 天')
const funnel = [
  { label: '访问用户', value: 42861, percent: 100, color: 'var(--hx-chart-1)' },
  { label: '商品浏览', value: 28460, percent: 66.4, color: 'var(--hx-chart-2)' },
  { label: '加入购物车', value: 12840, percent: 30.0, color: 'var(--hx-chart-3)' },
  { label: '提交订单', value: 4860, percent: 11.3, color: 'var(--hx-warning-bright)' },
  { label: '支付完成', value: 3240, percent: 7.6, color: 'var(--hx-success-bright)' },
]
const regions = [
  { name: '长沙', value: 486320, percent: 88, color: 'var(--hx-chart-1)' },
  { name: '武汉', value: 312600, percent: 57, color: 'var(--hx-chart-2)' },
  { name: '深圳', value: 268400, percent: 49, color: 'var(--hx-chart-3)' },
  { name: '成都', value: 184200, percent: 33, color: 'var(--hx-chart-4)' },
  { name: '其他', value: 96200, percent: 18, color: 'var(--hx-info)' },
]
</script>
