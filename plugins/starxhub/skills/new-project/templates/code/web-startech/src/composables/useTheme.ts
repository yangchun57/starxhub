import { ref } from 'vue'

type Theme = 'light' | 'dark'
const STORAGE_KEY = 'hx-theme'

const current = ref<Theme>(
  (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'light',
)

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem(STORAGE_KEY, theme)
  current.value = theme
}

apply(current.value)

export function useTheme() {
  return {
    theme: current,
    toggle: () => apply(current.value === 'light' ? 'dark' : 'light'),
    set: apply,
  }
}
