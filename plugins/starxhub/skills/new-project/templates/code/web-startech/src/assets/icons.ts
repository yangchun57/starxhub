/* ============================================================
 * 图标资源：18×18 线性图标，统一 stroke="currentColor"
 * 颜色由父级 CSS color 决定，选中态无需换资源
 * 生产环境可整体替换为 lucide-vue-next / @element-plus/icons-vue
 * ============================================================ */

const wrap = (body: string) =>
  `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`

export const ICONS: Record<string, string> = {
  grid: wrap('<rect x="2" y="2" width="6" height="6" rx="1.5"/><rect x="10" y="2" width="6" height="6" rx="1.5"/><rect x="2" y="10" width="6" height="6" rx="1.5"/><rect x="10" y="10" width="6" height="6" rx="1.5"/>'),
  chart: wrap('<path d="M3 15V8M7.5 15V4M12 15v-5M16 15V6"/>'),
  orders: wrap('<rect x="3" y="2" width="12" height="14" rx="2"/><path d="M6 6h6M6 9h6M6 12h4"/>'),
  product: wrap('<path d="M9 2l6 3.2v7.6L9 16l-6-3.2V5.2L9 2z"/><path d="M3 5.2L9 8.5l6-3.3M9 8.5V16"/>'),
  customer: wrap('<circle cx="7" cy="6.5" r="2.5"/><path d="M2.5 15c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"/><path d="M12.5 4.5a2.5 2.5 0 010 4.5M13 11.5c1.8.4 3 1.8 3 3.5"/>'),
  campaign: wrap('<path d="M3 7h9l3-3v10l-3-3H3V7z"/><path d="M3 7v4M6 11v3"/>'),
  bell: wrap('<path d="M9 2.5a5 5 0 00-5 5v3l-1.2 2h12.4L14 10.5v-3a5 5 0 00-5-5z"/><path d="M7.5 15a1.5 1.5 0 003 0"/>'),
  settings: wrap('<circle cx="9" cy="9" r="2.5"/><path d="M9 2v1.6M9 14.4V16M2 9h1.6M14.4 9H16M4.1 4.1l1.1 1.1M12.8 12.8l1.1 1.1M13.9 4.1l-1.1 1.1M5.2 12.8l-1.1 1.1"/>'),
  layers: wrap('<path d="M9 2l7 3.5-7 3.5-7-3.5L9 2z"/><path d="M2 9l7 3.5 7-3.5M2 12.5L9 16l7-3.5"/>'),
  search: wrap('<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>'),
  calendar: wrap('<rect x="1.5" y="2.5" width="11" height="10" rx="2"/><path d="M1.5 5.5h11M4.5 1.5v2M9.5 1.5v2"/>'),
  chevron: wrap('<path d="M3 4.5L6 7.5l3-3"/>'),
  chevronRight: wrap('<path d="M6 3.5L9.5 7 6 10.5"/>'),
  building: wrap('<rect x="2.5" y="2" width="8" height="12" rx="1.5"/><path d="M10.5 6h3v8h-3M5 5h2M5 8h2M5 11h2"/>'),
  more: wrap('<circle cx="3" cy="8" r="1.1" fill="currentColor" stroke="none"/><circle cx="8" cy="8" r="1.1" fill="currentColor" stroke="none"/><circle cx="13" cy="8" r="1.1" fill="currentColor" stroke="none"/>'),
  check: wrap('<path d="M4 9.5l3.2 3.2L14 6"/>'),
  clock: wrap('<circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.5 1.5"/>'),
  alert: wrap('<circle cx="8" cy="8" r="6.5"/><path d="M8 4.5v4M8 11.5v.6"/>'),
  ticket: wrap('<path d="M2.5 5.5h11v7h-11v-7z"/><path d="M5 12.5L3.5 15l3-2.5"/>'),
  book: wrap('<path d="M2.5 4c2-1 4-1 6 0v10c-2-1-4-1-6 0V4zM14.5 4c-2-1-4-1-6 0v10c2-1 4-1 6 0V4z"/>'),
  download: wrap('<path d="M8 2.5v8M5 8l3 3 3-3M2.5 13.5h11"/>'),
  plus: wrap('<path d="M8 3v10M3 8h10"/>'),
  moon: wrap('<path d="M13.5 10.5A6 6 0 017 4a6 6 0 106.5 6.5z"/>'),
  sun: wrap('<circle cx="8" cy="8" r="3"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M13 3l-1 1M4 12l-1 1"/>'),
  close: wrap('<path d="M4 4l8 8M12 4l-8 8"/>'),
  refresh: wrap('<path d="M13.5 6A5.5 5.5 0 103 9"/><path d="M13.5 2.5V6H10"/>'),
  filter: wrap('<path d="M2 4h12M4.5 8h7M7 12h2"/>'),
  shield: wrap('<path d="M8 1.5l5 2v4c0 3-2 5-5 6-3-1-5-3-5-6v-4l5-2z"/><path d="M5.8 8l1.6 1.6L10.5 6.5"/>'),
  palette: wrap('<path d="M8 1.5a6.5 6.5 0 000 13c1.2 0 1.5-.8 1.5-1.5 0-1 .8-1.5 1.5-1.5h1.5a2 2 0 002-2A6.5 6.5 0 008 1.5z"/><circle cx="5" cy="6" r=".8" fill="currentColor" stroke="none"/><circle cx="8" cy="4.5" r=".8" fill="currentColor" stroke="none"/><circle cx="11" cy="6" r=".8" fill="currentColor" stroke="none"/>'),
  box: wrap('<path d="M8 1.5l5.5 3v7L8 14.5l-5.5-3v-7l5.5-3z"/><path d="M2.5 4.5L8 7.5l5.5-3M8 7.5v7"/>'),
  upload: wrap('<path d="M8 11.5v-8M5 6l3-3 3 3M2.5 13.5h11"/>'),
  trash: wrap('<path d="M3 4.5h10M6 4.5V2.5h4v2M4.5 4.5l.6 9h5.8l.6-9"/>'),
  edit: wrap('<path d="M11 2.5l2.5 2.5L6 12.5l-3 .5.5-3 7.5-7.5z"/>'),
}

export const icon = (name: string): string => ICONS[name] ?? ICONS.grid
