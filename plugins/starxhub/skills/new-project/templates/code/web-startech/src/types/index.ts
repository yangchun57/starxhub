/* ============================================================
 * 数据契约层：前端 DTO 与后端出参一一对应（camelCase）
 * ApiResult<T> / PageResult<T> 为前端既定契约，不随后端改写：
 * dotnet / java-spring 的信封与 python 的 RESTful 裸 DTO 由 src/api/http.ts 适配。
 * 接真接口时只需替换视图的 loader，本文件与组件不用改
 * ============================================================ */

export type OrderStatus = '已完成' | '待付款' | '处理中' | '已发货' | '已取消' | '退款中'
export type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info'

export interface NavItem {
  key: string
  label: string
  path: string
  icon: string
  group?: string
  badge?: number
}

export interface Metric {
  key: string
  label: string
  value: string
  delta: string
  deltaTone: Tone
  icon: string
  spark: number[]
  color: string
}

export interface Order {
  id: string
  customer: string
  product: string
  amount: number
  status: OrderStatus
  channel: string
  createdAt: string
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  status: '在售' | '草稿' | '已下架'
  sales: number
}

export interface Customer {
  id: string
  name: string
  level: '普通客户' | '银卡客户' | '金卡客户' | '企业客户'
  orders: number
  total: number
  lastActive: string
}

export interface Activity {
  id: string
  title: string
  time: string
  source: string
  icon: string
  tone: Tone
}

export interface TrafficSource {
  label: string
  percent: number
  color: string
}

export interface Campaign {
  id: string
  name: string
  channel: string
  status: '进行中' | '未开始' | '已结束'
  budget: number
  conversion: string
  period: string
}

export interface MessageItem {
  id: string
  title: string
  body: string
  time: string
  tone: Tone
  read: boolean
}

export interface TableColumn<T> {
  key: keyof T | string
  title: string
  width?: string
  align?: 'left' | 'right' | 'center'
  render?: (row: T) => string
  tone?: (row: T) => Tone
  link?: boolean
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiResult<T> {
  code: number
  data: T
  message: string
}
