<template>
  <aside class="hx-sidebar">
    <div class="hx-brand">
      <svg class="hx-brand-mark" viewBox="0 0 34 34" fill="none" aria-hidden="true">
        <rect width="34" height="34" rx="10" fill="var(--hx-brand)" />
        <path d="M10 22V12M10 17h6M17 12v10M24 12v10" stroke="#fff" stroke-width="2.2" stroke-linecap="round" />
        <circle cx="24" cy="8.5" r="2" fill="var(--hx-accent-yellow)" />
      </svg>
      <div class="hx-col hx-hide-narrow">
        <span class="hx-brand-name">{{PROJECT_NAME}}</span>
        <span class="hx-brand-en">Admin</span>
      </div>
    </div>

    <nav class="hx-nav">
      <template v-for="item in NAV_ITEMS" :key="item.key">
        <div v-if="item.group" class="hx-nav-group hx-hide-narrow">{{ item.group }}</div>
        <RouterLink
          :to="item.path"
          class="hx-nav-item"
          :class="{ 'is-active': route.path === item.path }"
        >
          <span class="hx-nav-icon" v-html="icon(item.icon)" />
          <span class="hx-hide-narrow">{{ item.label }}</span>
          <span v-if="item.badge" class="hx-nav-badge hx-hide-narrow">{{ item.badge }}</span>
        </RouterLink>
      </template>
    </nav>

    <div class="hx-sidebar-foot">
      <div class="hx-side-card hx-hide-narrow">
        <span class="hx-side-card-title">本月目标 · 营收达成</span>
        <div class="hx-row-between">
          <span class="hx-num hx-sm" style="color: var(--hx-brand-on-dark)">78.6%</span>
          <span class="hx-xs" style="color: var(--hx-icon-on-dark)">¥ 486,320</span>
        </div>
        <div class="hx-progress"><div class="hx-progress-fill" style="width: 78.6%" /></div>
        <span class="hx-side-card-desc">距目标还差 ¥ 132,480</span>
      </div>
      <div class="hx-side-card hx-hide-narrow">
        <span class="hx-side-card-title">新手使用指南</span>
        <span class="hx-side-card-desc">3 分钟熟悉全部功能</span>
        <a class="hx-side-card-link" href="#/components">查看组件库 →</a>
      </div>
      <div class="hx-user">
        <svg class="hx-avatar" viewBox="0 0 34 34" fill="none" aria-hidden="true">
          <circle cx="17" cy="17" r="17" fill="#3E6FD8" />
          <circle cx="17" cy="13.5" r="5.2" fill="#DCE8FF" />
          <path d="M6.5 30c1.4-6 5-9 10.5-9s9.1 3 10.5 9" fill="#DCE8FF" />
        </svg>
        <div class="hx-col hx-hide-narrow">
          <span class="hx-user-name">{{PROJECT_NAME}}</span>
          <span class="hx-user-role">超级管理员</span>
        </div>
        <span class="hx-spacer hx-hide-narrow" />
        <span class="hx-nav-icon hx-hide-narrow" v-html="icon('more')" />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { NAV_ITEMS } from '@/router'
import { icon } from '@/assets/icons'

const route = useRoute()
</script>
