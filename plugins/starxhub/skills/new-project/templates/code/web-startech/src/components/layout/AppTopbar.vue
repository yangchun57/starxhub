<template>
  <header class="hx-topbar">
    <div class="hx-col">
      <span class="hx-crumb">{{ crumb }}&nbsp; / &nbsp;{{ title }}</span>
      <span class="hx-topbar-title">{{ title }}</span>
    </div>

    <div class="hx-topbar-actions">
      <label class="hx-input-wrap hx-hide-narrow">
        <span class="hx-input-icon" v-html="icon('search')" />
        <input class="hx-input hx-input--with-icon" style="width: 220px" placeholder="搜索订单、客户或商品" />
      </label>

      <HxSelect class="hx-hide-narrow" :options="MONTHS" :width="150" label="统计月份" />

      <button class="hx-icon-btn" title="切换主题" @click="toggle">
        <span v-html="theme === 'light' ? icon('moon') : icon('sun')" />
      </button>

      <button class="hx-icon-btn" title="通知">
        <span v-html="icon('bell')" />
        <i class="hx-dot" />
      </button>

      <span class="hx-v-divider hx-hide-narrow" />

      <HxSelect class="hx-hide-narrow" :options="ORGS" :width="150" label="切换组织" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NAV_ITEMS } from '@/router'
import { icon } from '@/assets/icons'
import { useTheme } from '@/composables/useTheme'
import HxSelect from '@/components/base/HxSelect.vue'

const route = useRoute()
const { theme, toggle } = useTheme()

const MONTHS = ['2026 年 11 月', '2026 年 10 月', '2026 年 9 月']
const ORGS = ['长沙运营中心', '武汉运营中心', '深圳运营中心']

const current = computed(() => NAV_ITEMS.find((n) => n.path === route.path))
const title = computed(() => current.value?.label ?? String(route.meta.title ?? '控制台'))
const crumb = computed(() => String(route.meta.crumb ?? '运营中心'))
</script>
