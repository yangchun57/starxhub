import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import type { NavItem } from '@/types'

/* 导航配置：侧栏、面包屑、路由三者共用，改一处即可 */
export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: '概览',     path: '/dashboard', icon: 'grid',     group: '工作台' },
  { key: 'analytics', label: '数据看板', path: '/analytics', icon: 'chart',    group: '工作台' },
  { key: 'orders',    label: '订单管理', path: '/orders',    icon: 'orders' },
  { key: 'products',  label: '商品中心', path: '/products',  icon: 'product' },
  { key: 'customers', label: '客户管理', path: '/customers', icon: 'customer' },
  { key: 'marketing', label: '营销活动', path: '/marketing', icon: 'campaign', group: '运营' },
  { key: 'messages',  label: '消息通知', path: '/messages',  icon: 'bell', badge: 3 },
  { key: 'settings',  label: '系统设置', path: '/settings',  icon: 'settings' },
  { key: 'components',label: '组件库',   path: '/components',icon: 'layers',  group: '开发' },
]

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard',  name: 'dashboard',  component: () => import('@/views/DashboardView.vue'),  meta: { title: '数据概览', crumb: '运营中心' } },
  { path: '/analytics',  name: 'analytics',  component: () => import('@/views/AnalyticsView.vue'),  meta: { title: '数据看板', crumb: '运营中心' } },
  { path: '/orders',     name: 'orders',     component: () => import('@/views/OrdersView.vue'),     meta: { title: '订单管理', crumb: '运营中心' } },
  { path: '/products',   name: 'products',   component: () => import('@/views/ProductsView.vue'),   meta: { title: '商品中心', crumb: '运营中心' } },
  { path: '/customers',  name: 'customers',  component: () => import('@/views/CustomersView.vue'),  meta: { title: '客户管理', crumb: '运营中心' } },
  { path: '/marketing',  name: 'marketing',  component: () => import('@/views/MarketingView.vue'),  meta: { title: '营销活动', crumb: '运营中心' } },
  { path: '/messages',   name: 'messages',   component: () => import('@/views/MessagesView.vue'),   meta: { title: '消息通知', crumb: '运营中心' } },
  { path: '/settings',   name: 'settings',   component: () => import('@/views/SettingsView.vue'),   meta: { title: '系统设置', crumb: '运营中心' } },
  { path: '/components', name: 'components', component: () => import('@/views/ComponentsView.vue'), meta: { title: '组件库', crumb: '开发资源' } },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  // hash 模式：无需服务端 rewrite，静态托管到任意子目录也能跑
  history: createWebHashHistory(),
  routes,
})

export default router
