<template>
  <div class="hx-col" style="gap: var(--hx-gap-section)">
    <!-- 欢迎横幅 -->
    <section class="hx-banner">
      <svg class="hx-banner-deco" width="320" height="124" viewBox="0 0 320 124" fill="none" aria-hidden="true">
        <circle cx="230" cy="62" r="78" fill="#fff" fill-opacity="0.22" />
        <circle cx="230" cy="62" r="52" fill="#fff" fill-opacity="0.28" />
        <circle cx="230" cy="62" r="26" fill="#fff" fill-opacity="0.42" />
        <circle cx="60" cy="26" r="5" fill="#fff" fill-opacity="0.55" />
        <circle cx="96" cy="98" r="7" fill="#fff" fill-opacity="0.42" />
        <path d="M140 108c30-18 60-18 90 0" stroke="#fff" stroke-opacity="0.45" stroke-width="2" stroke-linecap="round" />
      </svg>
      <div class="hx-col" style="gap: 9px">
        <span class="hx-banner-tag">今日速览</span>
        <h2 class="hx-banner-title">下午好，今天也稳步向前</h2>
        <p class="hx-banner-desc">有 12 项待办需要处理，较昨日减少 3 项</p>
      </div>
      <button class="hx-banner-btn">查看待办</button>
    </section>

    <!-- KPI -->
    <div class="hx-grid-kpi">
      <StatCard v-for="m in metricList" :key="m.key" :metric="m" />
    </div>

    <!-- 趋势 + 来源 -->
    <div class="hx-grid-main">
      <HxCard title="营收趋势">
        <template #extra>
          <div class="hx-tabs">
            <button v-for="t in ['近 7 天', '近 30 天', '近 12 月']" :key="t" class="hx-tab" :class="{ 'is-active': activeTab === t }" @click="activeTab = t">{{ t }}</button>
          </div>
        </template>
        <div class="hx-card-pad" style="padding-top: 0">
          <div class="hx-row" style="gap: 10px; margin-bottom: 8px">
            <span class="hx-num" style="font-size: 22px; font-weight: 700">¥ 486,320</span>
            <span class="hx-sm" style="color: var(--hx-success)">同比 +12.8%</span>
          </div>
          <HxLineChart :data="trend.revenue" :compare="trend.compare" />
          <p class="hx-chart-axis">11/01　　11/05　　11/09　　11/13　　11/17　　11/21　　11/25　　11/30</p>
        </div>
      </HxCard>

      <HxCard title="流量来源" sub="直接访问占比最高">
        <div class="hx-card-pad hx-row" style="gap: 14px; align-items: center; padding-top: 8px">
          <HxDonutChart :items="traffic" center-label="总访问量" center-value="42,861" />
          <div class="hx-legend hx-spacer">
            <div v-for="s in traffic" :key="s.label" class="hx-legend-row">
              <i class="hx-legend-dot" :style="{ background: s.color }" />
              <span class="hx-legend-label">{{ s.label }}</span>
              <span class="hx-legend-value">{{ s.percent }}%</span>
            </div>
          </div>
        </div>
        <div class="hx-card-pad" style="padding-top: 0">
          <div class="hx-summary-bar">
            <span>总访问量 42,861</span>
            <span style="color: var(--hx-success)">环比 +9.6%</span>
          </div>
        </div>
      </HxCard>
    </div>

    <!-- 最近订单 + 待办动态 -->
    <div class="hx-grid-main">
      <HxCard title="最近订单" link="#/orders">
        <div v-for="o in recentOrders" :key="o.id" class="hx-todo">
          <div class="hx-col hx-spacer">
            <span class="hx-num hx-body" style="color: var(--hx-text-primary)">{{ o.id }}</span>
            <span class="hx-todo-time">{{ o.customer }} · {{ o.product }}</span>
          </div>
          <span class="hx-num hx-body hx-semibold">¥ {{ o.amount.toLocaleString() }}</span>
          <StatusTag :status="o.status" />
        </div>
      </HxCard>

      <HxCard title="待办与动态" link="#/messages" link-text="全部动态">
        <TodoItem v-for="a in activities" :key="a.id" :item="a" />
        <div class="hx-card-pad" style="padding-top: 12px">
          <button class="hx-btn hx-btn--soft hx-btn--block hx-btn--sm">查看全部待办</button>
        </div>
      </HxCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import HxCard from '@/components/base/HxCard.vue'
import StatCard from '@/components/biz/StatCard.vue'
import StatusTag from '@/components/biz/StatusTag.vue'
import TodoItem from '@/components/biz/TodoItem.vue'
import HxLineChart from '@/components/charts/HxLineChart.vue'
import HxDonutChart from '@/components/charts/HxDonutChart.vue'
import { useRequest } from '@/composables/useRequest'
import { api, metrics, revenueTrend, compareTrend, trafficSources, activities, orders } from '@/mock'

const activeTab = ref('近 30 天')
const { data } = useRequest(api.getMetrics, metrics)
const metricList = computed(() => data.value ?? metrics)
const trend = { revenue: revenueTrend, compare: compareTrend }
const traffic = trafficSources
const recentOrders = orders.slice(0, 4)
</script>
