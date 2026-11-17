<template>
  <div class="hx-col" style="gap: var(--hx-gap-section)">
    <PageHeader title="系统设置" desc="组织信息、外观偏好、权限与通知配置">
      <template #actions>
        <HxButton icon-name="check" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存设置' }}</HxButton>
      </template>
    </PageHeader>

    <div class="hx-grid-main" style="grid-template-columns: 220px minmax(0, 1fr)">
      <HxCard>
        <div class="hx-card-pad hx-col" style="gap: 4px">
          <button
            v-for="g in groups" :key="g"
            class="hx-tab"
            :class="{ 'is-active': group === g }"
            style="text-align: left; width: 100%"
            @click="group = g"
          >{{ g }}</button>
        </div>
      </HxCard>

      <div class="hx-col" style="gap: var(--hx-gap-section)">
        <HxCard :title="group" sub="修改后点击右上角保存生效">
          <div class="hx-card-pad hx-demo">
            <template v-if="group === '基本信息'">
              <div class="hx-form-grid">
                <label class="hx-field"><span class="hx-label">组织名称</span><input class="hx-input" value="长沙运营中心" /></label>
                <label class="hx-field"><span class="hx-label">组织编码</span><input class="hx-input" value="OPS-CS-001" /></label>
                <label class="hx-field"><span class="hx-label">管理员</span><input class="hx-input" value="{{PROJECT_NAME}}" /></label>
                <label class="hx-field"><span class="hx-label">联系方式</span><input class="hx-input" value="ops@startech.example" /></label>
              </div>
              <label class="hx-field"><span class="hx-label">组织简介</span><textarea class="hx-input hx-textarea">负责华中区域门店运营与数据看板业务。</textarea></label>
            </template>

            <template v-else-if="group === '外观偏好'">
              <div class="hx-row" style="gap: 12px">
                <span class="hx-label" style="width: 96px">主题模式</span>
                <HxSelect v-model="themeMode" :options="['跟随设计令牌 · 浅色', '跟随设计令牌 · 暗色', '跟随系统']" :width="220" />
                <HxButton size="sm" variant="secondary" @click="toggle">立即预览</HxButton>
              </div>
              <div class="hx-row" style="gap: 12px">
                <span class="hx-label" style="width: 96px">主色</span>
                <span v-for="c in palette" :key="c" class="hx-legend-dot" :style="{ background: c, width: '20px', height: '20px', flex: '0 0 20px' }" />
              </div>
              <div class="hx-alert">所有颜色、圆角与间距均来自 tokens.css，切换主题无需改动组件代码。</div>
            </template>

            <template v-else-if="group === '权限#@@TENANT_ONLY_START与租户#@@TENANT_ONLY_END'">
              <div v-for="p in permissions" :key="p.label" class="hx-row-between" style="padding: 10px 0; border-bottom: 1px solid var(--hx-border-soft)">
                <div class="hx-col">
                  <span class="hx-body hx-semibold">{{ p.label }}</span>
                  <span class="hx-micro hx-muted">{{ p.desc }}</span>
                </div>
                <span class="hx-switch" :class="{ 'is-on': p.on }" @click="p.on = !p.on" />
              </div>
            </template>

            <template v-else>
              <div v-for="n in notifications" :key="n.label" class="hx-row-between" style="padding: 10px 0; border-bottom: 1px solid var(--hx-border-soft)">
                <div class="hx-col">
                  <span class="hx-body hx-semibold">{{ n.label }}</span>
                  <span class="hx-micro hx-muted">{{ n.desc }}</span>
                </div>
                <span class="hx-switch" :class="{ 'is-on': n.on }" @click="n.on = !n.on" />
              </div>
            </template>
          </div>
        </HxCard>

        <div class="hx-alert hx-alert--success">前后端契约已就绪：vite.config.ts 的 /api 代理按后端栈自动指向，src/api/http.ts 统一适配 dotnet / python / java-spring 响应，useRequest 是唯一请求入口。</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import HxButton from '@/components/base/HxButton.vue'
import HxCard from '@/components/base/HxCard.vue'
import HxSelect from '@/components/base/HxSelect.vue'
import { useTheme } from '@/composables/useTheme'

const { toggle } = useTheme()
const groups = ['基本信息', '外观偏好', '权限#@@TENANT_ONLY_START与租户#@@TENANT_ONLY_END', '通知配置']
const group = ref('基本信息')
const themeMode = ref('跟随设计令牌 · 浅色')
const saving = ref(false)
const palette = ['var(--hx-chart-1)', 'var(--hx-chart-2)', 'var(--hx-chart-3)', 'var(--hx-danger-bright)', 'var(--hx-sidebar)']
const permissions = reactive([
#@@TENANT_ONLY_START
  { label: '多租户数据隔离', desc: '按组织 ID 隔离全部业务数据', on: true },
#@@TENANT_ONLY_END
  { label: '角色权限控制', desc: '基于 RBAC 控制菜单与操作', on: true },
  { label: '操作审计日志', desc: '记录关键操作与登录行为', on: true },
  { label: '开放 API 访问', desc: '允许第三方系统调用开放接口', on: false },
])
const notifications = reactive([
  { label: '订单审核提醒', desc: '新订单待审核时推送站内消息', on: true },
  { label: '库存预警', desc: '库存低于安全阈值时提醒', on: true },
  { label: '月度结算通知', desc: '每月结算单生成后提醒', on: true },
  { label: '营销邮件', desc: '接收产品更新与活动资讯', on: false },
])
const save = () => {
  saving.value = true
  setTimeout(() => { saving.value = false }, 600)
}
</script>
