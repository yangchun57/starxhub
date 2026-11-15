/* ============================================================
 * Mock 数据层：所有返回都包成 ApiResult<T>（前端既定契约）
 * 接真实后端：契约不变，把视图的 loader 换成 () => http.get<T>('/orders')；
 * src/api/http.ts 已按 --backend 注入 envelope，负责收敛三种后端响应形态。
 * ============================================================ */
import type {
  ApiResult, Activity, Campaign, Customer, Metric,
  MessageItem, Order, Product, TrafficSource, PageResult,
} from '@/types'

const ok = <T,>(data: T): ApiResult<T> => ({ code: 0, data, message: 'ok' })
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms))

export const metrics: Metric[] = [
  { key: 'revenue', label: '今日营收（元）', value: '486,320', delta: '+12.8%', deltaTone: 'success', icon: 'card',   spark: [22, 18, 20, 12, 15, 8, 11, 3],  color: 'var(--hx-chart-1)' },
  { key: 'orders',  label: '新增订单（笔）', value: '1,284',  delta: '+8.4%',  deltaTone: 'success', icon: 'orders', spark: [20, 22, 14, 17, 10, 13, 6, 9],  color: 'var(--hx-warning-bright)' },
  { key: 'users',   label: '活跃客户（人）', value: '8,672',  delta: '+5.2%',  deltaTone: 'success', icon: 'customer',spark: [24, 19, 21, 15, 17, 11, 13, 5], color: 'var(--hx-success-bright)' },
  { key: 'todos',   label: '待处理工单（项）', value: '27',   delta: '较昨日 -3', deltaTone: 'warning', icon: 'ticket', spark: [8, 12, 7, 15, 11, 18, 14, 21], color: 'var(--hx-danger-bright)' },
]

export const revenueTrend = [120, 108, 96, 100, 104, 74, 82, 90, 60, 66, 72, 40, 48, 56, 30, 34, 36, 22, 18]
export const compareTrend  = [132, 126, 118, 120, 122, 108, 112, 116, 98, 102, 106, 92, 96, 100, 84, 88]

export const trafficSources: TrafficSource[] = [
  { label: '直接访问', percent: 42.1, color: 'var(--hx-chart-1)' },
  { label: '微信小程序', percent: 28.4, color: 'var(--hx-chart-2)' },
  { label: '搜索引擎', percent: 18.3, color: 'var(--hx-chart-3)' },
  { label: '其他渠道', percent: 11.2, color: 'var(--hx-chart-4)' },
]

export const orders: Order[] = [
  { id: '#ST202611150038', customer: '陈砚舟', product: '智能仓储套件',     amount: 12860, status: '已完成', channel: '直营',     createdAt: '2026-11-15 14:32' },
  { id: '#ST202611150037', customer: '苏晚宁', product: '门店数据看板年费', amount: 3480,  status: '待付款', channel: '微信小程序', createdAt: '2026-11-15 13:08' },
  { id: '#ST202611150036', customer: '沈聿珩', product: '传感器校准服务',   amount: 860,   status: '处理中', channel: '直营',     createdAt: '2026-11-15 11:45' },
  { id: '#ST202611150035', customer: '姜叙白', product: '门店巡检终端',     amount: 5200,  status: '已发货', channel: '搜索引擎', createdAt: '2026-11-15 10:12' },
  { id: '#ST202611150034', customer: '温以宁', product: '数据迁移服务',     amount: 18600, status: '已完成', channel: '直营',     createdAt: '2026-11-15 09:36' },
  { id: '#ST202611150033', customer: '邵允之', product: '手持终端配件',     amount: 1240,  status: '已取消', channel: '微信小程序', createdAt: '2026-11-15 08:51' },
  { id: '#ST202611150032', customer: '林知夏', product: '智能仓储套件',     amount: 12860, status: '退款中', channel: '直营',     createdAt: '2026-11-14 19:24' },
  { id: '#ST202611150031', customer: '裴照野', product: '数据分析订阅',     amount: 6980,  status: '已完成', channel: '搜索引擎', createdAt: '2026-11-14 17:05' },
]

export const products: Product[] = [
  { id: 'P-1001', name: '智能仓储套件',     category: '硬件', price: 12860, stock: 128, status: '在售', sales: 486 },
  { id: 'P-1002', name: '门店巡检终端',     category: '硬件', price: 5200,  stock: 8,   status: '在售', sales: 312 },
  { id: 'P-1003', name: '门店数据看板年费', category: '软件', price: 3480,  stock: 999, status: '在售', sales: 274 },
  { id: 'P-1004', name: '传感器校准服务',   category: '服务', price: 860,   stock: 999, status: '在售', sales: 198 },
  { id: 'P-1005', name: '数据迁移服务',     category: '服务', price: 18600, stock: 999, status: '在售', sales: 96 },
  { id: 'P-1006', name: '手持终端配件',     category: '硬件', price: 1240,  stock: 0,   status: '已下架', sales: 421 },
]

export const customers: Customer[] = [
  { id: 'C-2001', name: '陈砚舟', level: '企业客户', orders: 42, total: 386200, lastActive: '2026-11-15 14:32' },
  { id: 'C-2002', name: '温以宁', level: '金卡客户', orders: 28, total: 214800, lastActive: '2026-11-15 09:36' },
  { id: 'C-2003', name: '姜叙白', level: '银卡客户', orders: 16, total: 92300,  lastActive: '2026-11-15 10:12' },
  { id: 'C-2004', name: '苏晚宁', level: '银卡客户', orders: 12, total: 67800,  lastActive: '2026-11-15 13:08' },
  { id: 'C-2005', name: '沈聿珩', level: '普通客户', orders: 5,  total: 18600,  lastActive: '2026-11-15 11:45' },
  { id: 'C-2006', name: '林知夏', level: '金卡客户', orders: 31, total: 268400, lastActive: '2026-11-14 19:24' },
]

export const campaigns: Campaign[] = [
  { id: 'M-01', name: '双十一仓储设备专场', channel: '微信小程序', status: '进行中', budget: 86000, conversion: '6.8%', period: '11/01 - 11/20' },
  { id: 'M-02', name: '新客首单立减',       channel: '全渠道',     status: '进行中', budget: 42000, conversion: '4.2%', period: '11/05 - 11/30' },
  { id: 'M-03', name: '年末续费回馈',       channel: '直营',       status: '未开始', budget: 120000, conversion: '—',    period: '12/01 - 12/31' },
  { id: 'M-04', name: '春季新品预热',       channel: '搜索引擎',   status: '已结束', budget: 36000, conversion: '3.1%', period: '10/01 - 10/20' },
]

export const activities: Activity[] = [
  { id: 'A1', title: '3 笔订单待审核',       time: '10 分钟前 · 订单中心', source: '订单中心', icon: 'clock',  tone: 'brand' },
  { id: 'A2', title: '月度结算单已生成',     time: '1 小时前 · 财务中心', source: '财务中心', icon: 'check',  tone: 'success' },
  { id: 'A3', title: '2 个商品库存低于阈值', time: '3 小时前 · 商品中心', source: '商品中心', icon: 'alert',  tone: 'warning' },
  { id: 'A4', title: '姜叙白 提交了新的工单', time: '昨天 17:42 · 客服中心', source: '客服中心', icon: 'ticket', tone: 'danger' },
]

export const messages: MessageItem[] = [
  { id: 'N1', title: '订单审核提醒',   body: '有 3 笔订单等待你的审核，请在 24 小时内处理。', time: '10 分钟前', tone: 'brand',   read: false },
  { id: 'N2', title: '库存预警',       body: '「门店巡检终端」当前库存 8 件，已低于安全阈值 20 件。', time: '3 小时前', tone: 'warning', read: false },
  { id: 'N3', title: '月度结算完成',   body: '11 月结算单已生成，可在财务中心下载。', time: '昨天 09:12', tone: 'success', read: false },
  { id: 'N4', title: '系统维护通知',   body: '平台将于 11 月 18 日 02:00 - 04:00 进行例行维护。', time: '11-12', tone: 'info', read: true },
]

/* ---------- 统一 API 门面 ---------- */
export const api = {
  async getMetrics()       { await delay(); return ok(metrics) },
  async getTrend()         { await delay(); return ok({ revenue: revenueTrend, compare: compareTrend }) },
  async getTraffic()       { await delay(); return ok(trafficSources) },
  async getActivities()    { await delay(); return ok(activities) },
  async getOrders(): Promise<ApiResult<PageResult<Order>>> {
    await delay(); return ok({ items: orders, total: 2486, page: 1, pageSize: 6 })
  },
  async getProducts()      { await delay(); return ok(products) },
  async getCustomers()     { await delay(); return ok(customers) },
  async getCampaigns()     { await delay(); return ok(campaigns) },
  async getMessages()      { await delay(); return ok(messages) },
}
