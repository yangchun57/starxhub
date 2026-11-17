<template>
  <div class="hx-col" style="gap: var(--hx-gap-section)">
    <PageHeader title="组件库" desc="{{PROJECT_NAME}}· 全量组件与设计令牌，所有样式取自 tokens.css">
      <template #actions>
        <HxButton variant="secondary" icon-name="palette" @click="toggle">切换暗色</HxButton>
      </template>
    </PageHeader>

    <!-- 1. 设计令牌 -->
    <HxCard title="01 · 设计令牌 / Design Tokens" sub="组件里禁止出现字面量色值，一律 var(--hx-*)">
      <div class="hx-card-pad hx-demo">
        <div class="hx-swatch-grid">
          <div v-for="s in swatches" :key="s.var" class="hx-swatch">
            <div class="hx-swatch-color" :style="{ background: `var(${s.var})` }" />
            <div class="hx-swatch-meta">
              <div class="hx-swatch-name">{{ s.name }}</div>
              <div class="hx-swatch-var">{{ s.var }}</div>
            </div>
          </div>
        </div>
        <div class="hx-row" style="gap: 18px; flex-wrap: wrap; align-items: baseline">
          <span v-for="t in typeScale" :key="t.cls" :class="t.cls">{{ t.label }}</span>
        </div>
        <pre class="hx-code">:root {{ '{' }} --hx-brand: #2f6df6; --hx-radius-card: 14px; {{ '}' }}
[data-theme="dark"] {{ '{' }} --hx-surface: #18263d; {{ '}' }}

/* 组件内 */
.hx-btn--primary {{ '{' }} background: var(--hx-brand); border-radius: var(--hx-radius-control); {{ '}' }}</pre>
      </div>
    </HxCard>

    <div class="hx-grid-2">
      <!-- 2. 按钮 -->
      <HxCard title="02 · 按钮 / Button">
        <div class="hx-card-pad hx-demo">
          <div class="hx-demo-row">
            <HxButton>主要按钮</HxButton>
            <HxButton variant="secondary">次要按钮</HxButton>
            <HxButton variant="soft">弱化按钮</HxButton>
            <HxButton variant="ghost">文字按钮</HxButton>
            <HxButton variant="danger">危险按钮</HxButton>
          </div>
          <div class="hx-demo-row">
            <HxButton size="sm" icon-name="plus">小尺寸</HxButton>
            <HxButton size="lg" icon-name="download">大尺寸</HxButton>
            <HxButton disabled>禁用态</HxButton>
            <HxButton variant="secondary" size="sm" icon-name="refresh">刷新</HxButton>
          </div>
          <button class="hx-btn hx-btn--primary hx-btn--block">块级按钮</button>
        </div>
      </HxCard>

      <!-- 3. 标签 -->
      <HxCard title="03 · 标签 / Tag">
        <div class="hx-card-pad hx-demo">
          <div class="hx-demo-row">
            <HxTag tone="brand">品牌</HxTag>
            <HxTag tone="success">成功</HxTag>
            <HxTag tone="warning">警告</HxTag>
            <HxTag tone="danger">危险</HxTag>
            <HxTag tone="info">中性</HxTag>
            <HxTag tone="brand" pill>胶囊标签</HxTag>
          </div>
          <div class="hx-demo-row">
            <StatusTag v-for="s in allStatus" :key="s" :status="s" />
          </div>
          <div class="hx-demo-row">
            <span class="hx-tag hx-tag--brand hx-num">+12.8%</span>
            <span class="hx-tag hx-tag--warning hx-num">较昨日 -3</span>
          </div>
        </div>
      </HxCard>
    </div>

    <!-- 4. 表单 -->
    <HxCard title="04 · 表单控件 / Form">
      <div class="hx-card-pad hx-demo">
        <div class="hx-form-grid">
          <label class="hx-field">
            <span class="hx-label">带图标输入框</span>
            <HxInput v-model="form.name" icon-name="search" placeholder="搜索订单、客户或商品" />
          </label>
          <label class="hx-field">
            <span class="hx-label">下拉选择</span>
            <HxSelect v-model="form.status" :options="['全部状态', '已完成', '待付款', '处理中']" />
          </label>
          <label class="hx-field">
            <span class="hx-label">普通输入框</span>
            <input v-model="form.note" class="hx-input" placeholder="请输入内容" />
          </label>
          <label class="hx-field">
            <span class="hx-label">禁用输入框</span>
            <input class="hx-input" value="不可编辑" disabled />
          </label>
        </div>
        <div class="hx-demo-row">
          <label class="hx-check"><input type="checkbox" checked /> 复选框</label>
          <label class="hx-radio"><input type="radio" name="demo" checked /> 单选 A</label>
          <label class="hx-radio"><input type="radio" name="demo" /> 单选 B</label>
          <span class="hx-switch" :class="{ 'is-on': switchOn }" @click="switchOn = !switchOn" />
          <span class="hx-caption hx-secondary">开关 {{ switchOn ? '开' : '关' }}</span>
        </div>
        <textarea class="hx-input hx-textarea" placeholder="多行文本域…" />
      </div>
    </HxCard>

    <div class="hx-grid-2">
      <!-- 5. 标签页 / 告警 -->
      <HxCard title="05 · 标签页与反馈 / Tabs & Alert">
        <div class="hx-card-pad hx-demo">
          <div class="hx-tabs">
            <button v-for="t in ['近 7 天', '近 30 天', '近 12 月']" :key="t" class="hx-tab" :class="{ 'is-active': tab === t }" @click="tab = t">{{ t }}</button>
          </div>
          <div class="hx-tabs hx-tabs--line">
            <button v-for="t in ['基本信息', '权限配置', '操作日志']" :key="t" class="hx-tab" :class="{ 'is-active': lineTab === t }" @click="lineTab = t">{{ t }}</button>
          </div>
          <div class="hx-alert">这是一条品牌色提示信息，用于说明当前操作。</div>
          <div class="hx-alert hx-alert--success">操作成功，数据已保存。</div>
          <div class="hx-alert hx-alert--warning">库存低于安全阈值，请及时补货。</div>
          <div class="hx-alert hx-alert--danger">删除后不可恢复，请谨慎操作。</div>
        </div>
      </HxCard>

      <!-- 6. 空态 / 加载 / 时间线 -->
      <HxCard title="06 · 状态反馈 / Empty & Timeline">
        <div class="hx-card-pad hx-demo">
          <div class="hx-row" style="gap: 10px">
            <div class="hx-skeleton" style="width: 90px; height: 36px" />
            <div class="hx-skeleton" style="width: 140px; height: 36px" />
            <span class="hx-caption hx-muted">骨架屏加载态</span>
          </div>
          <HxEmpty text="暂无数据，试试调整筛选条件">
            <HxButton size="sm" variant="secondary" @click="showModal = true">打开弹窗</HxButton>
          </HxEmpty>
          <div class="hx-timeline">
            <div v-for="(t, i) in timeline" :key="i" class="hx-timeline-item">
              <i class="hx-timeline-dot" :style="{ background: t.color }" />
              <div class="hx-col">
                <span class="hx-body hx-semibold">{{ t.title }}</span>
                <span class="hx-micro hx-muted">{{ t.time }}</span>
              </div>
            </div>
          </div>
        </div>
      </HxCard>
    </div>

    <!-- 7. 图表 -->
    <HxCard title="07 · 图表 / Charts" sub="纯 SVG 数据驱动，零第三方依赖；生产可替换为 ECharts">
      <div class="hx-card-pad hx-demo">
        <div class="hx-grid-2">
          <div class="hx-col" style="gap: 8px">
            <span class="hx-section-title">营收趋势（含对比线）</span>
            <HxLineChart :data="revenueTrend" :compare="compareTrend" />
          </div>
          <div class="hx-row" style="gap: 16px">
            <HxDonutChart :items="trafficSources" center-label="总访问量" center-value="42,861" />
            <div class="hx-legend hx-spacer">
              <div v-for="s in trafficSources" :key="s.label" class="hx-legend-row">
                <i class="hx-legend-dot" :style="{ background: s.color }" />
                <span class="hx-legend-label">{{ s.label }}</span>
                <span class="hx-legend-value">{{ s.percent }}%</span>
              </div>
            </div>
          </div>
        </div>
        <div class="hx-demo-row">
          <span class="hx-caption hx-secondary">迷你趋势 Sparkline：</span>
          <Sparkline v-for="(m, i) in metrics" :key="i" :data="m.spark" :color="m.color" style="width: 70px; height: 28px" />
        </div>
      </div>
    </HxCard>

    <!-- 8. 表格与分页 -->
    <HxCard title="08 · 表格与分页 / Table">
      <DataTable :columns="columns" :rows="orders.slice(0, 4)" />
      <div class="hx-divider" />
      <div class="hx-table-foot">
        <span>显示 1-4 条，共 2,486 条</span>
        <HxPagination v-model="page" />
      </div>
    </HxCard>

    <!-- 9. 使用规范 -->
    <HxCard title="09 · 接入规范 / Convention">
      <div class="hx-card-pad">
        <pre class="hx-code">// 1. 数据层：src/api/http.ts 已适配三种后端，替换 loader 即可
const {{ '{' }} data, loading, error {{ '}' }} = useRequest(() => http.get('/orders'))

// 2. 组件：所有颜色/圆角/间距取自 tokens.css
&lt;HxButton variant="primary" icon-name="plus"&gt;新建订单&lt;/HxButton&gt;

// 3. 表格：列定义即契约，字段与后端 DTO 一致（camelCase）
const columns: TableColumn&lt;OrderDto&gt;[] = [
  {{ '{' }} key: 'id', title: '订单编号', link: true {{ '}' }},
  {{ '{' }} key: 'amount', title: '订单金额', render: r =&gt; `¥ ${'{'}r.amount{'}'}` {{ '}' }},
]

// 4. 主题：document.documentElement.dataset.theme = 'dark'</pre>
      </div>
    </HxCard>

    <HxModal :open="showModal" title="组件示例弹窗" @close="showModal = false" @confirm="showModal = false">
      <div class="hx-alert">这是一个由 HxModal + Teleport 渲染的标准弹窗，支持遮罩关闭与自定义底部插槽。</div>
    </HxModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import HxCard from '@/components/base/HxCard.vue'
import HxButton from '@/components/base/HxButton.vue'
import HxInput from '@/components/base/HxInput.vue'
import HxSelect from '@/components/base/HxSelect.vue'
import HxTag from '@/components/base/HxTag.vue'
import HxModal from '@/components/base/HxModal.vue'
import HxEmpty from '@/components/base/HxEmpty.vue'
import HxPagination from '@/components/base/HxPagination.vue'
import StatusTag from '@/components/biz/StatusTag.vue'
import DataTable from '@/components/biz/DataTable.vue'
import Sparkline from '@/components/charts/Sparkline.vue'
import HxLineChart from '@/components/charts/HxLineChart.vue'
import HxDonutChart from '@/components/charts/HxDonutChart.vue'
import { useTheme } from '@/composables/useTheme'
import { metrics, revenueTrend, compareTrend, trafficSources, orders } from '@/mock'
import type { Order, TableColumn, Tone } from '@/types'

const { toggle } = useTheme()
const swatches = [
  { name: '品牌主色', var: '--hx-brand' }, { name: '侧栏深色', var: '--hx-sidebar' },
  { name: '成功', var: '--hx-success' }, { name: '警告', var: '--hx-warning' },
  { name: '危险', var: '--hx-danger' }, { name: '页面底色', var: '--hx-page-bg' },
  { name: '卡片表面', var: '--hx-surface' }, { name: '描边', var: '--hx-border' },
  { name: '主文本', var: '--hx-text-primary' }, { name: '次文本', var: '--hx-text-secondary' },
  { name: '图表 2', var: '--hx-chart-2' }, { name: '图表 3', var: '--hx-chart-3' },
]
const typeScale = [
  { cls: 'hx-display', label: 'Display 24' }, { cls: 'hx-title', label: 'Title 19' },
  { cls: 'hx-section', label: 'Section 14' }, { cls: 'hx-body', label: 'Body 12' },
  { cls: 'hx-caption', label: 'Small 11' }, { cls: 'hx-micro', label: 'Tiny 10' },
  { cls: 'hx-metric', label: '486,320' },
]
const allStatus = ['已完成', '待付款', '处理中', '已发货', '已取消', '退款中', '在售', '进行中']
const TONE: Record<string, Tone> = { 已完成: 'success', 待付款: 'warning', 处理中: 'brand', 已发货: 'info', 已取消: 'danger', 退款中: 'danger' }
const columns: TableColumn<Order>[] = [
  { key: 'id', title: '订单编号', link: true },
  { key: 'customer', title: '客户' },
  { key: 'product', title: '商品 / 服务' },
  { key: 'amount', title: '订单金额', render: (r) => `¥ ${r.amount.toLocaleString()}`, align: 'right' },
  { key: 'status', title: '订单状态', tone: (r) => TONE[r.status] ?? 'info' },
  { key: 'createdAt', title: '下单时间' },
]
const timeline = [
  { title: '订单创建', time: '2026-11-15 14:32', color: 'var(--hx-brand)' },
  { title: '支付完成', time: '2026-11-15 14:36', color: 'var(--hx-success-bright)' },
  { title: '仓库出库', time: '2026-11-15 16:02', color: 'var(--hx-warning-bright)' },
]
const form = reactive({ name: '', status: '全部状态', note: '' })
const tab = ref('近 30 天')
const lineTab = ref('基本信息')
const switchOn = ref(true)
const showModal = ref(false)
const page = ref(1)
</script>
