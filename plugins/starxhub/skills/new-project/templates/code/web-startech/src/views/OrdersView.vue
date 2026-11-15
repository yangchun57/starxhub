<template>
  <div class="hx-col" style="gap: var(--hx-gap-section)">
    <PageHeader title="订单管理" desc="共 2,486 笔订单，今日新增 38 笔">
      <template #actions>
        <HxButton variant="secondary" icon-name="download" @click="showExport = true">导出报表</HxButton>
        <HxButton icon-name="plus" @click="showCreate = true">新建订单</HxButton>
      </template>
    </PageHeader>

    <!-- 状态统计 -->
    <div class="hx-grid-kpi">
      <div v-for="s in stats" :key="s.label" class="hx-stat hx-stat--compact">
        <span class="hx-stat-label">{{ s.label }}</span>
        <span class="hx-stat-value">{{ s.value }}</span>
        <span class="hx-stat-hint" :class="s.tone === 'up' ? 'is-up' : 'is-down'">{{ s.hint }}</span>
      </div>
    </div>

    <!-- 筛选 -->
    <FilterBar @query="applyFilter" @reset="resetFilter">
      <HxInput v-model="keyword" :width="260" icon-name="search" placeholder="搜索订单编号 / 客户名称" />
      <HxSelect v-model="status" :options="['全部状态', '已完成', '待付款', '处理中', '已发货', '已取消']" :width="150" />
      <HxSelect v-model="channel" :options="['全部渠道', '直营', '微信小程序', '搜索引擎']" :width="150" />
    </FilterBar>

    <!-- 表格 -->
    <HxCard>
      <div class="hx-card-head">
        <span class="hx-card-title">订单列表</span>
        <span class="hx-card-sub">共 {{ filtered.length }} 条记录</span>
      </div>
      <div class="hx-divider" />
      <DataTable :columns="columns" :rows="filtered" />
      <div class="hx-divider" />
      <div class="hx-table-foot">
        <span>显示 1-{{ filtered.length }} 条，共 2,486 条</span>
        <HxPagination v-model="page" :total="2486" :page-size="6" />
      </div>
    </HxCard>

    <!-- 弹窗演示 -->
    <HxModal :open="showCreate" title="新建订单" @close="showCreate = false" @confirm="showCreate = false">
      <div class="hx-form-grid">
        <label class="hx-field"><span class="hx-label">客户名称</span><input class="hx-input" placeholder="请输入客户名称" /></label>
        <label class="hx-field"><span class="hx-label">商品 / 服务</span><input class="hx-input" placeholder="请选择商品" /></label>
        <label class="hx-field"><span class="hx-label">订单金额</span><input class="hx-input" placeholder="¥ 0.00" /></label>
        <label class="hx-field"><span class="hx-label">下单渠道</span><input class="hx-input" placeholder="直营" /></label>
      </div>
    </HxModal>

    <HxModal :open="showExport" title="导出报表" @close="showExport = false" @confirm="showExport = false">
      <div class="hx-alert">将按当前筛选条件导出订单数据，生成 Excel 文件。</div>
    </HxModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import HxButton from '@/components/base/HxButton.vue'
import HxInput from '@/components/base/HxInput.vue'
import HxSelect from '@/components/base/HxSelect.vue'
import HxCard from '@/components/base/HxCard.vue'
import HxModal from '@/components/base/HxModal.vue'
import HxPagination from '@/components/base/HxPagination.vue'
import FilterBar from '@/components/biz/FilterBar.vue'
import DataTable from '@/components/biz/DataTable.vue'
import { orders } from '@/mock'
import type { Order, TableColumn, Tone } from '@/types'

const stats = [
  { label: '今日订单（笔）', value: '38', hint: '较昨日 +6', tone: 'up' },
  { label: '待付款（笔）', value: '12', hint: '需 24 小时内跟进', tone: 'down' },
  { label: '待发货（笔）', value: '24', hint: '含 2 笔已超期', tone: 'down' },
  { label: '退款中（笔）', value: '3', hint: '平均处理 1.8 天', tone: 'down' },
]

const TONE: Record<string, Tone> = {
  已完成: 'success', 待付款: 'warning', 处理中: 'brand',
  已发货: 'info', 已取消: 'danger', 退款中: 'danger',
}
const columns: TableColumn<Order>[] = [
  { key: 'id', title: '订单编号', link: true },
  { key: 'customer', title: '客户' },
  { key: 'product', title: '商品 / 服务' },
  { key: 'amount', title: '订单金额', render: (r) => `¥ ${r.amount.toLocaleString()}`, align: 'right' },
  { key: 'status', title: '订单状态', tone: (r) => TONE[r.status] ?? 'info' },
  { key: 'channel', title: '渠道' },
  { key: 'createdAt', title: '下单时间' },
]

const keyword = ref('')
const status = ref('全部状态')
const channel = ref('全部渠道')
const page = ref(1)
const applied = ref({ keyword: '', status: '全部状态', channel: '全部渠道' })
const showCreate = ref(false)
const showExport = ref(false)

const filtered = computed(() => orders.filter((o) => {
  const f = applied.value
  const kw = f.keyword.trim().toLowerCase()
  return (!kw || o.id.toLowerCase().includes(kw) || o.customer.includes(kw))
    && (f.status === '全部状态' || o.status === f.status)
    && (f.channel === '全部渠道' || o.channel === f.channel)
}))

const applyFilter = () => {
  applied.value = { keyword: keyword.value, status: status.value, channel: channel.value }
  page.value = 1
}
const resetFilter = () => {
  keyword.value = ''; status.value = '全部状态'; channel.value = '全部渠道'
  applied.value = { keyword: '', status: '全部状态', channel: '全部渠道' }
  page.value = 1
}
</script>
