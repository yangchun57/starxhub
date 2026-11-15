<template>
  <div ref="rootRef" class="hx-select-wrap" :class="{ 'is-open': open }" :style="{ width: width + 'px' }">
    <button
      type="button"
      class="hx-select hx-select-trigger"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :disabled="disabled"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span class="hx-select-value" :class="{ 'is-placeholder': !selectedLabel }">
        {{ selectedLabel || placeholder }}
      </span>
    </button>
    <span class="hx-select-arrow" v-html="icon('chevron')" />

    <!-- Teleport 到 body：避免被 .hx-card / .hx-content 的 overflow:hidden 裁切 -->
    <Teleport to="body">
      <div
        v-if="open"
        ref="panelRef"
        class="hx-select-panel"
        :class="{ 'is-up': flipUp }"
        :style="panelStyle"
        role="listbox"
      >
        <div v-if="label" class="hx-select-label">{{ label }}</div>
        <div class="hx-select-list">
          <div
            v-for="(opt, i) in normalized"
            :key="opt.value"
            class="hx-select-option"
            :class="{ 'is-selected': opt.value === model, 'is-active': i === activeIndex }"
            role="option"
            :aria-selected="opt.value === model"
            @mouseenter="activeIndex = i"
            @click="pick(opt)"
          >
            <span class="hx-select-option-text">{{ opt.label }}</span>
            <span class="hx-select-option-check" v-html="icon('check')" />
          </div>
          <div v-if="!normalized.length" class="hx-select-empty">暂无可选项</div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, type CSSProperties } from 'vue'
import { icon } from '@/assets/icons'

type Opt = string | { label: string; value: string }
type Normalized = { label: string; value: string }

const props = withDefaults(
  defineProps<{
    options: Opt[]
    width?: number
    placeholder?: string
    label?: string
    disabled?: boolean
  }>(),
  { width: 150, placeholder: '请选择', label: '', disabled: false }
)
const model = defineModel<string>({ default: '' })

const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const open = ref(false)
const flipUp = ref(false)
const activeIndex = ref(0)
const panelStyle = ref<CSSProperties>({ left: '0px', top: '0px', minWidth: '150px' })

const normalized = computed<Normalized[]>(() =>
  props.options.map((o) => (typeof o === 'string' ? { label: o, value: o } : o))
)
const selectedLabel = computed(
  () => normalized.value.find((o) => o.value === model.value)?.label ?? ''
)

/** 按触发器 rect 定位 fixed 浮层；下方空间不足且上方足够时向上翻转 */
function updatePosition() {
  const root = rootRef.value
  const panel = panelRef.value
  if (!root || !panel) return
  const rect = root.getBoundingClientRect()
  const panelH = panel.offsetHeight
  const panelW = panel.offsetWidth
  const up = window.innerHeight - rect.bottom < panelH + 12 && rect.top > panelH + 12
  flipUp.value = up
  panelStyle.value = {
    left: Math.max(8, Math.min(rect.left, window.innerWidth - panelW - 8)) + 'px',
    top: (up ? rect.top - panelH - 6 : rect.bottom + 6) + 'px',
    minWidth: rect.width + 'px'
  }
}

async function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (!open.value) return
  activeIndex.value = Math.max(0, normalized.value.findIndex((o) => o.value === model.value))
  await nextTick()
  updatePosition()
}

function pick(opt: Normalized) {
  model.value = opt.value
  open.value = false
}

function scrollActiveIntoView() {
  const list = panelRef.value?.querySelector('.hx-select-list') as HTMLElement | null | undefined
  const item = list?.children.item(activeIndex.value) as HTMLElement | null
  if (!list || !item) return
  const top = item.offsetTop
  const bottom = top + item.offsetHeight
  if (top < list.scrollTop) list.scrollTop = top
  else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  const n = normalized.value.length
  if (e.key === 'Escape') {
    open.value = false
    return
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    if (!open.value) {
      void toggle()
      return
    }
    if (n) {
      activeIndex.value = (activeIndex.value + (e.key === 'ArrowDown' ? 1 : -1) + n) % n
      scrollActiveIntoView()
    }
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (!open.value) {
      void toggle()
      return
    }
    const opt = normalized.value[activeIndex.value]
    if (opt) pick(opt)
  }
}

function onDocClick(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node
  if (rootRef.value?.contains(target) || panelRef.value?.contains(target)) return
  open.value = false
}
function onDocKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
/** 内层滚动容器（.hx-content）滚动时，capture 阶段重算浮层位置 */
function onScrollOrResize() {
  if (open.value) updatePosition()
}

onMounted(() => {
  // 首项默认显示：同步回 v-model，避免「看着选中、值却为空」
  if (!model.value && normalized.value.length) model.value = normalized.value[0].value
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onDocKeydown)
  document.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onDocKeydown)
  document.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})
</script>
