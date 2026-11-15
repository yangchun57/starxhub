<template>
  <div class="hx-col" style="gap: var(--hx-gap-section)">
    <PageHeader title="商品中心" :desc="`管理商品、服务与订阅，共 ${products.length} 个 SKU`">
      <template #actions>
        <HxButton variant="secondary" icon-name="upload">批量导入</HxButton>
        <HxButton icon-name="plus">新建商品</HxButton>
      </template>
    </PageHeader>

    <div class="hx-alert hx-alert--warning">
      有 2 个商品库存低于安全阈值：「门店巡检终端」剩余 8 件、「手持终端配件」已售罄。
    </div>

    <div class="hx-grid-kpi">
      <div v-for="s in stats" :key="s.label" class="hx-stat hx-stat--compact">
        <span class="hx-stat-label">{{ s.label }}</span>
        <span class="hx-stat-value">{{ s.value }}</span>
        <span class="hx-stat-hint is-up">{{ s.hint }}</span>
      </div>
    </div>

    <FilterBar @query="apply" @reset="reset">
      <HxInput v-model="keyword" :width="260" icon-name="search" placeholder="搜索商品名称 / 编号" />
      <HxSelect v-model="category" :options="['全部品类', '硬件', '软件', '服务']" :width="150" />
      <HxSelect v-model="status" :options="['全部状态', '在售', '草稿', '已下架']" :width="150" />
    </FilterBar>

    <HxCard title="商品列表" :sub="`共 ${filtered.length} 条记录`">
      <DataTable :columns="columns" :rows="filtered" />
    </HxCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import HxButton from '@/components/base/HxButton.vue'
import HxInput from '@/components/base/HxInput.vue'
import HxSelect from '@/components/base/HxSelect.vue'
import HxCard from '@/components/base/HxCard.vue'
import FilterBar from '@/components/biz/FilterBar.vue'
import DataTable from '@/components/biz/DataTable.vue'
import { products } from '@/mock'
import type { Product, TableColumn, Tone } from '@/types'

const TONE: Record<string, Tone> = { 在售: 'success', 草稿: 'info', 已下架: 'danger' }
const stats = [
  { label: '在售商品', value: '6', hint: '本月新增 2 个' },
  { label: '总销售额（元）', value: '1,286,400', hint: '环比 +14.2%' },
  { label: '低库存预警', value: '2', hint: '需及时补货' },
  { label: '平均客单价（元）', value: '6,842', hint: '环比 +3.6%' },
]
const columns: TableColumn<Product>[] = [
  { key: 'id', title: '商品编号', link: true },
  { key: 'name', title: '商品名称' },
  { key: 'category', title: '品类' },
  { key: 'price', title: '单价', render: (r) => `¥ ${r.price.toLocaleString()}`, align: 'right' },
  { key: 'stock', title: '库存', render: (r) => String(r.stock), align: 'right' },
  { key: 'sales', title: '累计销量', align: 'right' },
  { key: 'status', title: '状态', tone: (r) => TONE[r.status] ?? 'info' },
]
const keyword = ref(''), category = ref('全部品类'), status = ref('全部状态')
const applied = ref({ keyword: '', category: '全部品类', status: '全部状态' })
const filtered = computed(() => products.filter((p) => {
  const f = applied.value, kw = f.keyword.trim().toLowerCase()
  return (!kw || p.name.toLowerCase().includes(kw) || p.id.toLowerCase().includes(kw))
    && (f.category === '全部品类' || p.category === f.category)
    && (f.status === '全部状态' || p.status === f.status)
}))
const apply = () => { applied.value = { keyword: keyword.value, category: category.value, status: status.value } }
const reset = () => { keyword.value = ''; category.value = '全部品类'; status.value = '全部状态'; applied.value = { keyword: '', category: '全部品类', status: '全部状态' } }
</script>
