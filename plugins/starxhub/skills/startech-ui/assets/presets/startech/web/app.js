/* ============================================================
 * 星辰（starTech）· 零依赖组件与页面总览
 * 复用 ../src/styles 下的同一套设计令牌与组件样式
 * 浏览器直接打开即可查看，无需 npm install / 构建
 * ============================================================ */
(function () {
  'use strict'

  /* ---------- 图标（与 src/assets/icons.ts 同源） ---------- */
  var W = function (b) {
    return '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + b + '</svg>'
  }
  var ICONS = {
    grid: W('<rect x="2" y="2" width="6" height="6" rx="1.5"/><rect x="10" y="2" width="6" height="6" rx="1.5"/><rect x="2" y="10" width="6" height="6" rx="1.5"/><rect x="10" y="10" width="6" height="6" rx="1.5"/>'),
    chart: W('<path d="M3 15V8M7.5 15V4M12 15v-5M16 15V6"/>'),
    orders: W('<rect x="3" y="2" width="12" height="14" rx="2"/><path d="M6 6h6M6 9h6M6 12h4"/>'),
    product: W('<path d="M9 2l6 3.2v7.6L9 16l-6-3.2V5.2L9 2z"/><path d="M3 5.2L9 8.5l6-3.3M9 8.5V16"/>'),
    customer: W('<circle cx="7" cy="6.5" r="2.5"/><path d="M2.5 15c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"/>'),
    campaign: W('<path d="M3 7h9l3-3v10l-3-3H3V7z"/><path d="M3 7v4M6 11v3"/>'),
    bell: W('<path d="M9 2.5a5 5 0 00-5 5v3l-1.2 2h12.4L14 10.5v-3a5 5 0 00-5-5z"/><path d="M7.5 15a1.5 1.5 0 003 0"/>'),
    settings: W('<circle cx="9" cy="9" r="2.5"/><path d="M9 2v1.6M9 14.4V16M2 9h1.6M14.4 9H16"/>'),
    layers: W('<path d="M9 2l7 3.5-7 3.5-7-3.5L9 2z"/><path d="M2 9l7 3.5 7-3.5"/>'),
    search: W('<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>'),
    chevron: W('<path d="M3 4.5L6 7.5l3-3"/>'),
    check: W('<path d="M4 9.5l3.2 3.2L14 6"/>'),
    clock: W('<circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.5 1.5"/>'),
    alert: W('<circle cx="8" cy="8" r="6.5"/><path d="M8 4.5v4M8 11.5v.6"/>'),
    ticket: W('<path d="M2.5 5.5h11v7h-11v-7z"/>'),
    plus: W('<path d="M8 3v10M3 8h10"/>'),
    download: W('<path d="M8 2.5v8M5 8l3 3 3-3M2.5 13.5h11"/>'),
    moon: W('<path d="M13.5 10.5A6 6 0 017 4a6 6 0 106.5 6.5z"/>'),
    sun: W('<circle cx="8" cy="8" r="3"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15"/>'),
    close: W('<path d="M4 4l8 8M12 4l-8 8"/>'),
    palette: W('<path d="M8 1.5a6.5 6.5 0 000 13c1.2 0 1.5-.8 1.5-1.5 0-1 .8-1.5 1.5-1.5h1.5a2 2 0 002-2A6.5 6.5 0 008 1.5z"/>'),
    shield: W('<path d="M8 1.5l5 2v4c0 3-2 5-5 6-3-1-5-3-5-6v-4l5-2z"/>')
  }
  var icon = function (n) { return ICONS[n] || ICONS.grid }

  /* ---------- 数据 ---------- */
  var NAV = [
    { key: 'components', label: '组件库',     icon: 'layers',   group: '框架资源' },
    { key: 'tokens',     label: '设计令牌',   icon: 'palette',  group: '框架资源' },
    { key: 'pages',      label: '页面清单',   icon: 'grid' },
    { key: 'dashboard',  label: '数据概览',   icon: 'chart',    group: '页面模板' },
    { key: 'orders',     label: '订单管理',   icon: 'orders' }
  ]
  var METRICS = [
    { label: '今日营收（元）', value: '486,320', delta: '+12.8%', tone: 'success', soft: 'var(--hx-brand-soft)', color: 'var(--hx-chart-1)', spark: [22,18,20,12,15,8,11,3] },
    { label: '新增订单（笔）', value: '1,284', delta: '+8.4%', tone: 'success', soft: 'var(--hx-warning-soft)', color: 'var(--hx-warning-bright)', spark: [20,22,14,17,10,13,6,9] },
    { label: '活跃客户（人）', value: '8,672', delta: '+5.2%', tone: 'success', soft: 'var(--hx-success-soft)', color: 'var(--hx-success-bright)', spark: [24,19,21,15,17,11,13,5] },
    { label: '待处理工单（项）', value: '27', delta: '较昨日 -3', tone: 'warning', soft: 'var(--hx-danger-soft)', color: 'var(--hx-danger-bright)', spark: [8,12,7,15,11,18,14,21] }
  ]
  var ORDERS = [
    ['#ST202611150038', '陈砚舟', '智能仓储套件',     '¥ 12,860', '已完成', 'success', '2026-11-15 14:32'],
    ['#ST202611150037', '苏晚宁', '门店数据看板年费', '¥ 3,480',  '待付款', 'warning', '2026-11-15 13:08'],
    ['#ST202611150036', '沈聿珩', '传感器校准服务',   '¥ 860',    '处理中', 'brand',   '2026-11-15 11:45'],
    ['#ST202611150035', '姜叙白', '门店巡检终端',     '¥ 5,200',  '已发货', 'info',    '2026-11-15 10:12'],
    ['#ST202611150034', '温以宁', '数据迁移服务',     '¥ 18,600', '已完成', 'success', '2026-11-15 09:36'],
    ['#ST202611150033', '邵允之', '手持终端配件',     '¥ 1,240',  '已取消', 'danger',  '2026-11-15 08:51']
  ]
  var TRAFFIC = [
    { label: '直接访问', percent: 42.1, color: 'var(--hx-chart-1)' },
    { label: '微信小程序', percent: 28.4, color: 'var(--hx-chart-2)' },
    { label: '搜索引擎', percent: 18.3, color: 'var(--hx-chart-3)' },
    { label: '其他渠道', percent: 11.2, color: 'var(--hx-chart-4)' }
  ]
  var TREND = [120,108,96,100,104,74,82,90,60,66,72,40,48,56,30,34,36,22,18]
  var COMPARE = [132,126,118,120,122,108,112,116,98,102,106,92,96,100,84,88]
  var SWATCHES = [
    ['品牌主色','--hx-brand'],['侧栏深色','--hx-sidebar'],['成功','--hx-success'],['警告','--hx-warning'],
    ['危险','--hx-danger'],['页面底色','--hx-page-bg'],['卡片表面','--hx-surface'],['描边','--hx-border'],
    ['主文本','--hx-text-primary'],['次文本','--hx-text-secondary'],['图表 2','--hx-chart-2'],['图表 3','--hx-chart-3']
  ]

  /* ---------- 状态 ---------- */
  // file:// 打开时部分浏览器会禁用 localStorage，做静默兜底
  var store = {
    get: function (k) { try { return localStorage.getItem(k) } catch (e) { return null } },
    set: function (k, v) { try { localStorage.setItem(k, v) } catch (e) { /* ignore */ } }
  }
  var state = {
    page: 'components', theme: store.get('hx-theme') || 'light',
    tab: '近 30 天', lineTab: '基本信息', switchOn: true,
    modal: false, pageNum: 1, empty: false,
    select: {}, selectOpen: null
  }

  /* ---------- 下拉选择（与 HxSelect.vue 同一套结构与类名） ---------- */
  var SELECTS = {
    demo:    { label: '订单状态', options: ['全部状态', '已完成', '待付款', '处理中', '已发货', '已取消'] },
    spec:    { label: '订单状态', options: ['全部状态', '已完成', '待付款', '处理中', '已发货', '已取消'] },
    status:  { label: '订单状态', options: ['全部状态', '已完成', '待付款', '处理中', '已发货', '已取消'] },
    channel: { label: '下单渠道', options: ['全部渠道', '直营', '微信小程序', '搜索引擎'] },
    org:     { label: '切换组织', options: ['长沙运营中心', '武汉运营中心', '深圳运营中心'] }
  }
  function selectValue(id) { return state.select[id] || SELECTS[id].options[0] }
  function selectHTML(id, width, extraClass) {
    return '<div class="hx-select-wrap ' + (extraClass || '') + '" data-select="' + id + '" style="width:' + width + 'px">' +
      '<button type="button" class="hx-select hx-select-trigger" data-act="select-toggle" data-id="' + id + '"' +
      ' role="combobox" aria-haspopup="listbox" aria-expanded="false">' +
      '<span class="hx-select-value">' + selectValue(id) + '</span></button>' +
      '<span class="hx-select-arrow">' + icon('chevron') + '</span></div>'
  }
  function selectPanelHTML(id) {
    var def = SELECTS[id], cur = selectValue(id)
    return '<div class="hx-select-panel" data-select-panel="' + id + '" role="listbox">' +
      '<div class="hx-select-label">' + def.label + '</div><div class="hx-select-list">' +
      def.options.map(function (o, i) {
        return '<div class="hx-select-option' + (o === cur ? ' is-selected' : '') + (i === 0 ? ' is-active' : '') +
          '" role="option" aria-selected="' + (o === cur) + '" data-act="select-pick" data-id="' + id + '" data-val="' + o + '">' +
          '<span class="hx-select-option-text">' + o + '</span>' +
          '<span class="hx-select-option-check">' + icon('check') + '</span></div>'
      }).join('') + '</div></div>'
  }
  function positionSelect(wrap, panel) {
    var r = wrap.getBoundingClientRect(), h = panel.offsetHeight, w = panel.offsetWidth
    var up = window.innerHeight - r.bottom < h + 12 && r.top > h + 12
    panel.style.minWidth = r.width + 'px'
    panel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px'
    panel.style.top = (up ? r.top - h - 6 : r.bottom + 6) + 'px'
    panel.classList.toggle('is-up', up)
  }
  function closeSelect() {
    var p = document.querySelector('.hx-select-panel[data-select-panel]')
    if (p) p.remove()
    var w = document.querySelector('.hx-select-wrap.is-open')
    if (w) {
      w.classList.remove('is-open')
      var t = w.querySelector('.hx-select-trigger')
      if (t) t.setAttribute('aria-expanded', 'false')
    }
    state.selectOpen = null
  }
  function openSelect(wrap, id) {
    closeSelect()
    document.body.insertAdjacentHTML('beforeend', selectPanelHTML(id))
    var panel = document.querySelector('.hx-select-panel[data-select-panel="' + id + '"]')
    wrap.classList.add('is-open')
    var trigger = wrap.querySelector('.hx-select-trigger')
    if (trigger) trigger.setAttribute('aria-expanded', 'true')
    positionSelect(wrap, panel)
    state.selectOpen = id
  }
  function repositionSelectOnScroll() {
    if (!state.selectOpen) return
    var p = document.querySelector('.hx-select-panel[data-select-panel]')
    var w = document.querySelector('.hx-select-wrap.is-open')
    if (p && w) positionSelect(w, p)
  }

  /* ---------- 图形工具 ---------- */
  function spark(data, color, w, h) {
    w = w || 70; h = h || 28
    var max = Math.max.apply(null, data), min = Math.min.apply(null, data), span = max - min || 1
    var step = w / (data.length - 1)
    var pts = data.map(function (v, i) { return [i * step, h - 3 - ((v - min) / span) * (h - 6)] })
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1) }).join(' ')
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" style="width:' + w + 'px;height:' + h + 'px">' +
      '<path d="' + line + ' L' + w + ' ' + h + ' L0 ' + h + ' Z" fill="' + color + '" fill-opacity="0.09"/>' +
      '<path d="' + line + '" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'
  }
  function lineChart(data, compare) {
    function path(arr) {
      var max = Math.max.apply(null, arr), min = Math.min.apply(null, arr), span = max - min || 1
      var step = 738 / (arr.length - 1)
      return arr.map(function (v, i) { return [(i * step), 140 - ((v - min) / span) * 120] })
        .map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1) }).join(' ')
    }
    var d = path(data)
    return '<svg class="hx-chart" viewBox="0 0 738 150" preserveAspectRatio="none" fill="none">' +
      '<path d="M0 10H738M0 55H738M0 100H738M0 145H738" stroke="var(--hx-chart-grid)" stroke-width="1"/>' +
      '<path d="' + d + ' L738 150 L0 150 Z" fill="var(--hx-chart-1)" fill-opacity="0.10"/>' +
      '<path d="' + path(compare) + '" stroke="var(--hx-chart-compare)" stroke-width="2" stroke-dasharray="5 5" fill="none"/>' +
      '<path d="' + d + '" stroke="var(--hx-chart-1)" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>'
  }
  function donut(items, centerLabel, centerValue) {
    var size = 140, r = 61, C = 2 * Math.PI * r, acc = 0
    var segs = items.map(function (it) {
      var len = it.percent / 100 * C
      var s = '<circle cx="70" cy="70" r="' + r + '" stroke="' + it.color + '" stroke-width="17" stroke-dasharray="' + len + ' ' + C + '" stroke-dashoffset="' + (-acc) + '"/>'
      acc += len; return s
    }).join('')
    return '<svg width="140" height="140" viewBox="0 0 140 140" fill="none">' +
      '<g transform="rotate(-90 70 70)"><circle cx="70" cy="70" r="' + r + '" stroke="var(--hx-chart-grid)" stroke-width="17"/>' + segs + '</g>' +
      (centerLabel ? '<text x="70" y="68" text-anchor="middle" font-size="11" fill="var(--hx-text-secondary)">' + centerLabel + '</text>' : '') +
      (centerValue ? '<text x="70" y="86" text-anchor="middle" font-size="15" font-weight="700" fill="var(--hx-text-primary)">' + centerValue + '</text>' : '') +
      '</svg>'
  }
  function legend(items) {
    return '<div class="hx-legend hx-spacer">' + items.map(function (s) {
      return '<div class="hx-legend-row"><i class="hx-legend-dot" style="background:' + s.color + '"></i>' +
        '<span class="hx-legend-label">' + s.label + '</span><span class="hx-legend-value">' + s.percent + '%</span></div>'
    }).join('') + '</div>'
  }
  function card(title, sub, inner, extra) {
    return '<section class="hx-card">' +
      '<div class="hx-card-head"><div class="hx-col"><span class="hx-card-title">' + title + '</span>' +
      (sub ? '<span class="hx-card-sub">' + sub + '</span>' : '') + '</div>' + (extra || '') + '</div>' +
      '<div class="hx-divider"></div>' + inner + '</section>'
  }
  function stat(m, compact) {
    return '<div class="hx-stat' + (compact ? ' hx-stat--compact' : '') + '">' +
      '<div class="hx-stat-head"><svg class="hx-icon-block" viewBox="0 0 32 32" fill="none">' +
      '<rect width="32" height="32" rx="9" fill="' + m.soft + '"/>' +
      '<rect x="8" y="10" width="16" height="13" rx="2.5" stroke="' + m.color + '" stroke-width="1.7"/>' +
      '<path d="M8 14h16M16 18h4" stroke="' + m.color + '" stroke-width="1.7" stroke-linecap="round"/></svg>' +
      '<span class="hx-tag hx-tag--' + m.tone + '">' + m.delta + '</span></div>' +
      '<span class="hx-stat-label">' + m.label + '</span><span class="hx-stat-value">' + m.value + '</span>' +
      (compact ? '' : '<span class="hx-stat-spark">' + spark(m.spark, m.color) + '</span>') + '</div>'
  }
  function table(headers, rows, statusIndex, skipIndex) {
    var th = headers.map(function (h) { return '<th>' + h + '</th>' }).join('')
    var tb = rows.map(function (r, ri) {
      return '<tr class="' + (ri % 2 ? 'is-striped' : '') + '">' + r.map(function (c, ci) {
        /* 数据里的 tone 字段只给概览页上色用，表格不渲染成单元格 */
        if (ci === skipIndex) return ''
        if (statusIndex === ci) {
          var tone = { '已完成':'success','待付款':'warning','处理中':'brand','已发货':'info','已取消':'danger' }[c] || 'info'
          return '<td><span class="hx-tag hx-tag--' + tone + '">' + c + '</span></td>'
        }
        var cls = ci === 0 ? 'hx-link-cell' : (ci === 3 ? 'hx-strong-cell hx-num-cell' : '')
        return '<td><span class="' + cls + '">' + c + '</span></td>'
      }).join('') + '</tr>'
    }).join('')
    return '<div class="hx-table-wrap"><table class="hx-table"><thead><tr>' + th + '</tr></thead><tbody>' + tb + '</tbody></table></div>'
  }
  function pagination() {
    var out = '<div class="hx-pagination">'
    for (var i = 1; i <= 3; i++) out += '<button class="hx-page ' + (state.pageNum === i ? 'is-active' : '') + '" data-act="page" data-val="' + i + '">' + i + '</button>'
    return out + '<button class="hx-page" style="min-width:64px" data-act="page" data-val="next">下一页</button></div>'
  }

  /* ---------- 页面：组件库 ---------- */
  function pageComponents() {
    var tags = ['brand','success','warning','danger','info'].map(function (t) {
      var names = { brand:'品牌', success:'成功', warning:'警告', danger:'危险', info:'中性' }
      return '<span class="hx-tag hx-tag--' + t + '">' + names[t] + '</span>'
    }).join('')
    var statuses = ['已完成','待付款','处理中','已发货','已取消'].map(function (s) {
      var tone = { '已完成':'success','待付款':'warning','处理中':'brand','已发货':'info','已取消':'danger' }[s]
      return '<span class="hx-tag hx-tag--' + tone + '">' + s + '</span>'
    }).join('')
    var alerts = [
      ['', '这是一条品牌色提示信息，用于说明当前操作。'],
      [' hx-alert--success', '操作成功，数据已保存。'],
      [' hx-alert--warning', '库存低于安全阈值，请及时补货。'],
      [' hx-alert--danger', '删除后不可恢复，请谨慎操作。']
    ].map(function (a) { return '<div class="hx-alert' + a[0] + '">' + a[1] + '</div>' }).join('')

    return '<div class="hx-page-head"><div><h1 class="hx-page-title">组件库</h1>' +
      '<p class="hx-page-desc">星辰（starTech）· 全量组件预览，样式全部来自 tokens.css / components.css</p></div>' +
      '<div class="hx-row"><button class="hx-btn hx-btn--secondary" data-act="theme"><span>' + icon(state.theme === 'light' ? 'moon' : 'sun') + '</span> 切换暗色</button></div></div>' +

      '<div class="hx-grid-2">' +
        card('01 · 按钮 / Button', '5 种变体 · 3 种尺寸 · 图标与禁用态',
          '<div class="hx-card-pad hx-demo">' +
          '<div class="hx-demo-row">' +
            '<button class="hx-btn hx-btn--primary">主要按钮</button>' +
            '<button class="hx-btn hx-btn--secondary">次要按钮</button>' +
            '<button class="hx-btn hx-btn--soft">弱化按钮</button>' +
            '<button class="hx-btn hx-btn--ghost">文字按钮</button>' +
            '<button class="hx-btn hx-btn--danger">危险按钮</button></div>' +
          '<div class="hx-demo-row"><button class="hx-btn hx-btn--primary hx-btn--sm"><span>' + icon('plus') + '</span> 小尺寸</button>' +
            '<button class="hx-btn hx-btn--primary hx-btn--lg">大尺寸</button>' +
            '<button class="hx-btn hx-btn--primary" disabled>禁用态</button>' +
            '<button class="hx-btn hx-btn--secondary hx-btn--sm"><span>' + icon('download') + '</span> 导出</button></div>' +
          '<button class="hx-btn hx-btn--primary hx-btn--block">块级按钮</button></div>') +
        card('02 · 标签 / Tag', '语义色标签 · 状态标签 · 胶囊',
          '<div class="hx-card-pad hx-demo"><div class="hx-demo-row">' + tags + '<span class="hx-tag hx-tag--brand hx-tag--pill">胶囊标签</span></div>' +
          '<div class="hx-demo-row">' + statuses + '</div>' +
          '<div class="hx-demo-row"><span class="hx-tag hx-tag--brand hx-num">+12.8%</span>' +
          '<span class="hx-tag hx-tag--warning hx-num">较昨日 -3</span></div></div>') +
      '</div>' +

      card('03 · 表单控件 / Form', '输入框 · 下拉 · 复选 · 单选 · 开关 · 文本域',
        '<div class="hx-card-pad hx-demo"><div class="hx-form-grid">' +
        '<label class="hx-field"><span class="hx-label">带图标输入框</span><label class="hx-input-wrap"><span class="hx-input-icon">' + icon('search') + '</span><input class="hx-input hx-input--with-icon" placeholder="搜索订单、客户或商品" /></label></label>' +
        '<div class="hx-field"><span class="hx-label">下拉选择（点击展开）</span>' + selectHTML('demo', 190) + '</div>' +
        '<label class="hx-field"><span class="hx-label">普通输入框</span><input class="hx-input" placeholder="请输入内容" /></label>' +
        '<label class="hx-field"><span class="hx-label">禁用输入框</span><input class="hx-input" value="不可编辑" disabled /></label></div>' +
        '<div class="hx-demo-row"><label class="hx-check"><input type="checkbox" checked /> 复选框</label>' +
        '<label class="hx-radio"><input type="radio" name="r1" checked /> 单选 A</label>' +
        '<label class="hx-radio"><input type="radio" name="r1" /> 单选 B</label>' +
        '<span class="hx-switch ' + (state.switchOn ? 'is-on' : '') + '" data-act="switch"></span>' +
        '<span class="hx-sm hx-secondary">开关 ' + (state.switchOn ? '开' : '关') + '</span></div>' +
        '<textarea class="hx-input hx-textarea" placeholder="多行文本域…"></textarea></div>') +

      card('03B · 下拉选项 / Select Options', '自定义浮层 · 选中 / 悬停 / 禁用三态 · 暗色自适应 · 挂到 body 不被卡片裁切',
        '<div class="hx-card-pad hx-select-spec">' +
          '<div class="hx-select-spec-notes">' +
            '<span class="hx-label">交互示例（点击展开）</span>' + selectHTML('spec', 190) +
            '<div class="hx-select-spec-line"><i class="hx-select-spec-dot" style="background:var(--hx-brand)"></i>选中项：品牌浅底 + 左侧竖条 + 右侧勾选</div>' +
            '<div class="hx-select-spec-line"><i class="hx-select-spec-dot" style="background:var(--hx-border)"></i>悬停 / 键盘激活：中性浅底，文字提亮</div>' +
            '<div class="hx-select-spec-line"><i class="hx-select-spec-dot" style="background:var(--hx-text-muted)"></i>禁用项：弱化文字，不响应 hover</div>' +
            '<span class="hx-sm hx-muted">↑ ↓ 移动 · Enter 选择 · Esc 关闭 · 点击空白处收起 · 滚动时跟随定位</span>' +
          '</div>' +
          '<div class="hx-select-panel hx-select-panel--inline hx-select-spec-panel" role="listbox">' +
            '<div class="hx-select-label">订单状态</div><div class="hx-select-list">' +
            '<div class="hx-select-option is-selected" role="option" aria-selected="true"><span class="hx-select-option-text">全部状态</span><span class="hx-select-option-hint">选中</span><span class="hx-select-option-check">' + icon('check') + '</span></div>' +
            '<div class="hx-select-option is-active" role="option"><span class="hx-select-option-text">已完成</span><span class="hx-select-option-hint">悬停</span><span class="hx-select-option-check">' + icon('check') + '</span></div>' +
            '<div class="hx-select-option" role="option"><span class="hx-select-option-text">待付款</span><span class="hx-select-option-check">' + icon('check') + '</span></div>' +
            '<div class="hx-select-option" role="option"><span class="hx-select-option-text">处理中</span><span class="hx-select-option-check">' + icon('check') + '</span></div>' +
            '<div class="hx-select-option is-disabled" role="option"><span class="hx-select-option-text">已关闭（不可选）</span><span class="hx-select-option-hint">禁用</span></div>' +
            '</div></div></div>') +

      '<div class="hx-grid-2">' +
        card('04 · 标签页与告警 / Tabs & Alert', '分段控件 · 下划线标签页 · 四种反馈色',
          '<div class="hx-card-pad hx-demo">' +
          '<div class="hx-tabs">' + ['近 7 天','近 30 天','近 12 月'].map(function (t) {
            return '<button class="hx-tab ' + (state.tab === t ? 'is-active' : '') + '" data-act="tab" data-val="' + t + '">' + t + '</button>'
          }).join('') + '</div>' +
          '<div class="hx-tabs hx-tabs--line">' + ['基本信息','权限配置','操作日志'].map(function (t) {
            return '<button class="hx-tab ' + (state.lineTab === t ? 'is-active' : '') + '" data-act="linetab" data-val="' + t + '">' + t + '</button>'
          }).join('') + '</div>' + alerts + '</div>') +
        card('05 · 状态反馈 / Empty & Timeline', '骨架屏 · 空态 · 时间线 · 弹窗',
          '<div class="hx-card-pad hx-demo">' +
          '<div class="hx-row"><div class="hx-skeleton" style="width:90px;height:36px"></div><div class="hx-skeleton" style="width:140px;height:36px"></div><span class="hx-sm hx-muted">骨架屏加载态</span></div>' +
          '<div class="hx-empty"><svg class="hx-empty-icon" viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="8" y="14" width="40" height="30" rx="5"/><path d="M8 22h40M18 32h8M18 38h14" stroke-linecap="round"/><circle cx="40" cy="36" r="6"/><path d="M44.5 40.5L50 46" stroke-linecap="round"/></svg>' +
          '<span>暂无数据</span><button class="hx-btn hx-btn--secondary hx-btn--sm" data-act="modal">打开弹窗</button></div>' +
          '<div class="hx-timeline">' + [['订单创建','2026-11-15 14:32','var(--hx-brand)'],['支付完成','2026-11-15 14:36','var(--hx-success-bright)'],['仓库出库','2026-11-15 16:02','var(--hx-warning-bright)']].map(function (t) {
            return '<div class="hx-timeline-item"><i class="hx-timeline-dot" style="background:' + t[2] + '"></i><div class="hx-col"><span class="hx-body hx-semibold">' + t[0] + '</span><span class="hx-xs hx-muted">' + t[1] + '</span></div></div>'
          }).join('') + '</div></div>') +
      '</div>' +

      card('06 · 图表 / Charts', '纯 SVG 数据驱动，零第三方依赖；生产可替换为 ECharts',
        '<div class="hx-card-pad hx-demo"><div class="hx-grid-2">' +
        '<div class="hx-col" style="gap:8px"><span class="hx-section-title">营收趋势（含对比线）</span>' + lineChart(TREND, COMPARE) + '</div>' +
        '<div class="hx-row" style="gap:14px">' + donut(TRAFFIC, '总访问量', '42,861') + legend(TRAFFIC) + '</div></div>' +
        '<div class="hx-demo-row"><span class="hx-sm hx-secondary">迷你趋势 Sparkline：</span>' +
        METRICS.map(function (m) { return spark(m.spark, m.color) }).join('') + '</div></div>') +

      card('07 · 表格与分页 / Table', '隔行底色 · 状态标签 · 横向滚动',
        table(['订单编号','客户','商品 / 服务','订单金额','订单状态','下单时间'], ORDERS.slice(0, 4), 4, 5) +
        '<div class="hx-divider"></div><div class="hx-table-foot"><span>显示 1-4 条，共 2,486 条</span>' + pagination() + '</div>') +

      card('08 · 指标卡 / StatCard', '彩色图标块 · 变化标签 · sparkline',
        '<div class="hx-card-pad hx-grid-kpi">' + METRICS.map(function (m) { return stat(m) }).join('') + '</div>')
  }

  /* ---------- 页面：设计令牌 ---------- */
  function pageTokens() {
    var sw = SWATCHES.map(function (s) {
      return '<div class="hx-swatch"><div class="hx-swatch-color" style="background:var(' + s[1] + ')"></div>' +
        '<div class="hx-swatch-meta"><div class="hx-swatch-name">' + s[0] + '</div><div class="hx-swatch-var">' + s[1] + '</div></div></div>'
    }).join('')
    return '<div class="hx-page-head"><div><h1 class="hx-page-title">设计令牌</h1>' +
      '<p class="hx-page-desc">单一事实来源：src/styles/tokens.css · 组件里禁止出现字面量色值</p></div>' +
      '<button class="hx-btn hx-btn--secondary" data-act="theme"><span>' + icon(state.theme === 'light' ? 'moon' : 'sun') + '</span> 切换主题验证</button></div>' +
      card('01 · 色彩 / Color', '12 个核心色板，Light / Dark 双模式',
        '<div class="hx-card-pad"><div class="hx-swatch-grid">' + sw + '</div></div>') +
      '<div class="hx-grid-2">' +
        card('02 · 字阶 / Typography', 'Noto Sans SC 中文 + Geist 数字',
          '<div class="hx-card-pad hx-demo"><div class="hx-row" style="gap:18px;flex-wrap:wrap;align-items:baseline">' +
          '<span class="hx-display">Display 24</span><span class="hx-title">Title 19</span><span class="hx-section">Section 14</span>' +
          '<span class="hx-body">Body 12</span><span class="hx-sm">Small 11</span><span class="hx-xs">Tiny 10</span><span class="hx-metric">486,320</span></div>' +
          '<div class="hx-code">--hx-font-sans: "Noto Sans SC", "PingFang SC", ...;\n--hx-font-num:  "Geist", "Inter", ...;</div></div>') +
        card('03 · 尺寸与间距 / Spacing', '严格栅格与统一圆角',
          '<div class="hx-card-pad hx-demo">' +
          '<div class="hx-row"><span class="hx-sm" style="width:120px">卡片圆角 14px</span><div style="width:120px;height:36px;border-radius:var(--hx-radius-card);background:var(--hx-brand-soft)"></div></div>' +
          '<div class="hx-row"><span class="hx-sm" style="width:120px">控件圆角 9px</span><div style="width:120px;height:36px;border-radius:var(--hx-radius-control);background:var(--hx-brand-soft)"></div></div>' +
          '<div class="hx-row"><span class="hx-sm" style="width:120px">标签圆角 6px</span><div style="width:120px;height:36px;border-radius:var(--hx-radius-tag);background:var(--hx-brand-soft)"></div></div>' +
          '<div class="hx-code">--hx-sidebar-w: 236px;  --hx-topbar-h: 72px;\n--hx-gap-section: 18px;  --hx-control-h: 36px;</div></div>') +
      '</div>' +
      card('04 · 接入规范 / Convention', '三步把设计接进你的工程',
        '<div class="hx-card-pad"><pre class="hx-code">/* 1. 引入三层样式，顺序不能变 */\n@import "./tokens.css";\n@import "./common.css";\n@import "./components.css";\n\n/* 2. 组件内只写语义变量 */\n.hx-btn--primary { background: var(--hx-brand); }\n\n/* 3. 换主题只改根属性 */\ndocument.documentElement.dataset.theme = "dark";</pre></div>')
  }

  /* ---------- 页面：页面清单 ---------- */
  function pagePages() {
    var list = [
      ['数据概览','/dashboard','欢迎横幅 + 4 张 KPI + 营收趋势 + 流量来源 + 最近订单 + 待办动态','chart'],
      ['订单管理','/orders','状态统计 + 筛选栏 + 6 列数据表 + 分页 + 新建/导出弹窗','orders'],
      ['商品中心','/products','库存预警 + 品类筛选 + 商品表格 + 批量导入','product'],
      ['客户管理','/customers','客户分层 + 等级分布环形图 + 最近活跃','customer'],
      ['数据看板','/analytics','趋势对比 + 转化漏斗 + 渠道构成 + 区域业绩','chart'],
      ['营销活动','/campaign','投放概览 + 活动列表 + 活动日历','campaign'],
      ['消息通知','/messages','未读筛选 + 消息卡片 + 全部标记已读','bell'],
      ['系统设置','/settings','基本信息 / 外观 / 权限租户 / 通知配置 四组表单','settings'],
      ['组件库','/components','全量组件展示 + 设计令牌 + 接入规范（本页）','layers']
    ]
    return '<div class="hx-page-head"><div><h1 class="hx-page-title">页面清单</h1>' +
      '<p class="hx-page-desc">框架内置 9 个业务页面，路由、导航选中态与面包屑共用一份配置</p></div></div>' +
      card('01 · 内置页面 / Views', '全部位于 src/views，按需懒加载',
        '<div class="hx-card-pad hx-grid-3">' + list.map(function (p) {
          return '<div class="hx-swatch" style="padding:14px"><div class="hx-row" style="gap:9px;margin-bottom:8px">' +
            '<span style="color:var(--hx-brand)">' + icon(p[3]) + '</span><span class="hx-section">' + p[0] + '</span></div>' +
            '<div class="hx-sm hx-secondary" style="min-height:36px">' + p[2] + '</div>' +
            '<div class="hx-swatch-var" style="margin-top:8px">src/views/' + p[1].slice(1) + 'View.vue</div></div>'
        }).join('') + '</div>') +
      card('02 · 目录结构 / Structure', '复制即可开工',
        '<div class="hx-card-pad"><pre class="hx-code">hexu-admin/\n├── index.html                # 依次引入三层 CSS\n├── src/\n│   ├── styles/               # tokens / common / components\n│   ├── assets/icons.ts       # currentColor 线性图标\n│   ├── types/index.ts        # 与 .NET8 DTO 对应的契约\n│   ├── mock/index.ts         # ApiResult&lt;T&gt; 统一响应\n│   ├── composables/          # useRequest / useTheme\n│   ├── router/index.ts       # 导航 + 路由 + 面包屑同源\n│   ├── components/{layout,base,biz,charts}/\n│   └── views/                # 9 个业务页面\n└── showcase/                 # 零依赖组件预览（本页）</pre></div>')
  }

  /* ---------- 页面：数据概览 ---------- */
  function pageDashboard() {
    var recent = ORDERS.slice(0, 4).map(function (o) {
      return '<div class="hx-todo"><div class="hx-col hx-spacer"><span class="hx-num hx-body">' + o[0] + '</span>' +
        '<span class="hx-todo-time">' + o[1] + ' · ' + o[2] + '</span></div>' +
        '<span class="hx-num hx-body hx-semibold">' + o[3] + '</span>' +
        '<span class="hx-tag hx-tag--' + o[5] + '">' + o[4] + '</span></div>'
    }).join('')
    var todos = [
      ['3 笔订单待审核','10 分钟前 · 订单中心','clock','brand'],
      ['月度结算单已生成','1 小时前 · 财务中心','check','success'],
      ['2 个商品库存低于阈值','3 小时前 · 商品中心','alert','warning'],
      ['姜叙白 提交了新的工单','昨天 17:42 · 客服中心','ticket','danger']
    ].map(function (t) {
      return '<div class="hx-todo"><span class="hx-todo-icon" style="display:inline-flex;align-items:center;justify-content:center;border-radius:8px;background:var(--hx-' + t[3] + '-soft);color:var(--hx-' + t[3] + ')">' + icon(t[2]) + '</span>' +
        '<div class="hx-col hx-spacer"><span class="hx-todo-title">' + t[0] + '</span><span class="hx-todo-time">' + t[1] + '</span></div>' +
        '<span class="hx-tag hx-tag--' + t[3] + '">待办</span></div>'
    }).join('')
    return '<section class="hx-banner">' +
      '<svg class="hx-banner-deco" width="320" height="124" viewBox="0 0 320 124" fill="none">' +
      '<circle cx="230" cy="62" r="78" fill="#fff" fill-opacity="0.22"/><circle cx="230" cy="62" r="52" fill="#fff" fill-opacity="0.28"/>' +
      '<circle cx="230" cy="62" r="26" fill="#fff" fill-opacity="0.42"/><circle cx="60" cy="26" r="5" fill="#fff" fill-opacity="0.55"/>' +
      '<path d="M140 108c30-18 60-18 90 0" stroke="#fff" stroke-opacity="0.45" stroke-width="2"/></svg>' +
      '<div class="hx-col" style="gap:9px"><span class="hx-banner-tag">今日速览</span>' +
      '<h2 class="hx-banner-title">下午好，星辰，今天也稳步向前</h2>' +
      '<p class="hx-banner-desc">有 12 项待办需要处理，较昨日减少 3 项</p></div>' +
      '<button class="hx-banner-btn">查看待办</button></section>' +
      '<div class="hx-grid-kpi">' + METRICS.map(function (m) { return stat(m) }).join('') + '</div>' +
      '<div class="hx-grid-main">' +
        card('营收趋势', '', '<div class="hx-card-pad" style="padding-top:0"><div class="hx-row" style="gap:10px;margin-bottom:8px"><span class="hx-num" style="font-size:22px;font-weight:700">¥ 486,320</span><span class="hx-sm" style="color:var(--hx-success)">同比 +12.8%</span></div>' + lineChart(TREND, COMPARE) + '<p class="hx-chart-axis">11/01　　11/05　　11/09　　11/13　　11/17　　11/21　　11/25　　11/30</p></div>',
          '<div class="hx-tabs">' + ['近 7 天','近 30 天','近 12 月'].map(function (t) {
            return '<button class="hx-tab ' + (state.tab === t ? 'is-active' : '') + '" data-act="tab" data-val="' + t + '">' + t + '</button>'
          }).join('') + '</div>') +
        card('流量来源', '直接访问占比最高',
          '<div class="hx-card-pad hx-row" style="gap:14px">' + donut(TRAFFIC, '总访问量', '42,861') + legend(TRAFFIC) + '</div>' +
          '<div class="hx-card-pad" style="padding-top:0"><div class="hx-summary-bar"><span>总访问量 42,861</span><span style="color:var(--hx-success)">环比 +9.6%</span></div></div>') +
      '</div>' +
      '<div class="hx-grid-main">' +
        card('最近订单', '', recent, '<a class="hx-card-link" href="#/orders">查看全部</a>') +
        card('待办与动态', '', todos + '<div class="hx-card-pad" style="padding-top:12px"><button class="hx-btn hx-btn--soft hx-btn--block hx-btn--sm">查看全部待办</button></div>', '<a class="hx-card-link" href="#/pages">全部动态</a>') +
      '</div>'
  }

  /* ---------- 页面：订单管理 ---------- */
  function pageOrders() {
    var stats = [
      ['今日订单（笔）','38','较昨日 +6'],['待付款（笔）','12','需 24 小时内跟进'],
      ['待发货（笔）','24','含 2 笔已超期'],['退款中（笔）','3','平均处理 1.8 天']
    ].map(function (s) {
      return '<div class="hx-stat hx-stat--compact"><span class="hx-stat-label">' + s[0] + '</span><span class="hx-stat-value">' + s[1] + '</span><span class="hx-stat-hint is-up">' + s[2] + '</span></div>'
    }).join('')
    return '<div class="hx-page-head"><div><h1 class="hx-page-title">订单管理</h1>' +
      '<p class="hx-page-desc">共 2,486 笔订单，今日新增 38 笔</p></div><div class="hx-row">' +
      '<button class="hx-btn hx-btn--secondary"><span>' + icon('download') + '</span> 导出报表</button>' +
      '<button class="hx-btn hx-btn--primary" data-act="modal"><span>' + icon('plus') + '</span> 新建订单</button></div></div>' +
      '<div class="hx-grid-kpi">' + stats + '</div>' +
      '<div class="hx-filter"><label class="hx-input-wrap" style="width:260px"><span class="hx-input-icon">' + icon('search') + '</span>' +
      '<input class="hx-input hx-input--with-icon" placeholder="搜索订单编号 / 客户名称" /></label>' +
      selectHTML('status', 150) +
      selectHTML('channel', 150) +
      '<span class="hx-spacer"></span><button class="hx-btn hx-btn--primary">查询</button><button class="hx-btn hx-btn--ghost hx-btn--sm">重置</button></div>' +
      card('订单列表', '共 2,486 条记录',
        table(['订单编号','客户','商品 / 服务','订单金额','订单状态','下单时间'], ORDERS, 4, 5) +
        '<div class="hx-divider"></div><div class="hx-table-foot"><span>显示 1-6 条，共 2,486 条</span>' + pagination() + '</div>')
  }

  /* ---------- 外壳 ---------- */
  var PAGES = { components: pageComponents, tokens: pageTokens, pages: pagePages, dashboard: pageDashboard, orders: pageOrders }
  var TITLES = { components: '组件库', tokens: '设计令牌', pages: '页面清单', dashboard: '数据概览', orders: '订单管理' }

  function sidebar() {
    var nav = NAV.map(function (n) {
      return (n.group ? '<div class="hx-nav-group hx-hide-narrow">' + n.group + '</div>' : '') +
        '<a class="hx-nav-item ' + (state.page === n.key ? 'is-active' : '') + '" href="#/' + n.key + '">' +
        '<span class="hx-nav-icon">' + icon(n.icon) + '</span><span class="hx-hide-narrow">' + n.label + '</span></a>'
    }).join('')
    return '<aside class="hx-sidebar"><div class="hx-brand">' +
      '<svg class="hx-brand-mark" viewBox="0 0 34 34" fill="none"><rect width="34" height="34" rx="10" fill="var(--hx-brand)"/>' +
      '<path d="M10 22V12M10 17h6M17 12v10M24 12v10" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle cx="24" cy="8.5" r="2" fill="var(--hx-accent-yellow)"/></svg>' +
      '<div class="hx-col hx-hide-narrow"><span class="hx-brand-name">星辰</span><span class="hx-brand-en">starTech</span></div></div>' +
      '<nav class="hx-nav">' + nav + '</nav>' +
      '<div class="hx-sidebar-foot"><div class="hx-side-card hx-hide-narrow">' +
      '<span class="hx-side-card-title">本月目标 · 营收达成</span>' +
      '<div class="hx-row-between"><span class="hx-num hx-sm" style="color:var(--hx-brand-on-dark)">78.6%</span><span class="hx-xs" style="color:var(--hx-icon-on-dark)">¥ 486,320</span></div>' +
      '<div class="hx-progress"><div class="hx-progress-fill" style="width:78.6%"></div></div>' +
      '<span class="hx-side-card-desc">距目标还差 ¥ 132,480</span></div>' +
      '<div class="hx-side-card hx-hide-narrow"><span class="hx-side-card-title">新手使用指南</span>' +
      '<span class="hx-side-card-desc">3 分钟熟悉全部功能</span><a class="hx-side-card-link" href="#/pages">查看页面清单 →</a></div>' +
      '<div class="hx-user"><svg class="hx-avatar" viewBox="0 0 34 34" fill="none"><circle cx="17" cy="17" r="17" fill="#3E6FD8"/>' +
      '<circle cx="17" cy="13.5" r="5.2" fill="#DCE8FF"/><path d="M6.5 30c1.4-6 5-9 10.5-9s9.1 3 10.5 9" fill="#DCE8FF"/></svg>' +
      '<div class="hx-col hx-hide-narrow"><span class="hx-user-name">星辰</span><span class="hx-user-role">超级管理员</span></div></div></div></aside>'
  }
  function topbar() {
    return '<header class="hx-topbar"><div class="hx-col"><span class="hx-crumb">框架资源&nbsp; / &nbsp;' + TITLES[state.page] + '</span>' +
      '<span class="hx-topbar-title">' + TITLES[state.page] + '</span></div>' +
      '<div class="hx-topbar-actions"><label class="hx-input-wrap hx-hide-narrow"><span class="hx-input-icon">' + icon('search') + '</span>' +
      '<input class="hx-input hx-input--with-icon" style="width:220px" placeholder="搜索订单、客户或商品" /></label>' +
      '<button class="hx-icon-btn" data-act="theme" title="切换主题">' + icon(state.theme === 'light' ? 'moon' : 'sun') + '</button>' +
      '<button class="hx-icon-btn" title="通知">' + icon('bell') + '<i class="hx-dot"></i></button>' +
      '<span class="hx-v-divider hx-hide-narrow"></span>' +
      selectHTML('org', 150, 'hx-hide-narrow') + '</div></header>'
  }
  function modal() {
    if (!state.modal) return ''
    return '<div class="hx-modal-mask" data-act="mask"><div class="hx-modal hx-fade-in">' +
      '<div class="hx-modal-head hx-row-between"><span>新建订单</span><button class="hx-icon-btn" style="width:28px;height:28px" data-act="modal-close">' + icon('close') + '</button></div>' +
      '<div class="hx-modal-body"><div class="hx-form-grid">' +
      '<label class="hx-field"><span class="hx-label">客户名称</span><input class="hx-input" placeholder="请输入客户名称" /></label>' +
      '<label class="hx-field"><span class="hx-label">商品 / 服务</span><input class="hx-input" placeholder="请选择商品" /></label>' +
      '<label class="hx-field"><span class="hx-label">订单金额</span><input class="hx-input" placeholder="¥ 0.00" /></label>' +
      '<label class="hx-field"><span class="hx-label">下单渠道</span><input class="hx-input" placeholder="直营" /></label></div></div>' +
      '<div class="hx-modal-foot"><button class="hx-btn hx-btn--secondary" data-act="modal-close">取消</button><button class="hx-btn hx-btn--primary" data-act="modal-close">确定</button></div></div></div>'
  }

  function render() {
    closeSelect()
    document.documentElement.dataset.theme = state.theme
    var oldNav = document.querySelector('.hx-nav')
    var navScroll = oldNav ? oldNav.scrollTop : 0
    var fn = PAGES[state.page] || pageComponents
    document.getElementById('app').innerHTML =
      '<div class="hx-app">' + sidebar() +
      '<div class="hx-main">' + topbar() +
      '<main class="hx-content hx-fade-in">' + fn() + '</main></div></div>' + modal()
    var c = document.querySelector('.hx-content')
    if (c) c.scrollTop = 0
    /* 静态页整体重建 DOM，切页后恢复菜单滚动位置，避免菜单栏跳回顶部 */
    var nav = document.querySelector('.hx-nav')
    if (nav && navScroll) nav.scrollTop = navScroll
  }

  function readHash() {
    var key = (location.hash || '').replace(/^#\/?/, '').split('?')[0]
    state.page = PAGES[key] ? key : 'components'
  }

  document.addEventListener('click', function (e) {
    var t = e.target
    var toggleEl = t.closest('[data-act="select-toggle"]')
    if (toggleEl) {
      var wrap = toggleEl.closest('.hx-select-wrap'), sid = toggleEl.getAttribute('data-id')
      if (state.selectOpen === sid) closeSelect()
      else openSelect(wrap, sid)
      return
    }
    var pickEl = t.closest('[data-act="select-pick"]')
    if (pickEl) {
      var pid = pickEl.getAttribute('data-id'), pv = pickEl.getAttribute('data-val')
      state.select[pid] = pv
      closeSelect()
      var pw = document.querySelector('.hx-select-wrap[data-select="' + pid + '"]')
      var label = pw && pw.querySelector('.hx-select-value')
      if (label) label.textContent = pv
      return
    }
    if (!t.closest('.hx-select-wrap') && !t.closest('.hx-select-panel')) closeSelect()
    var el = e.target.closest('[data-act]')
    if (!el) return
    var act = el.getAttribute('data-act'), val = el.getAttribute('data-val')
    if (act === 'mask' && e.target !== el) return
    if (act === 'theme') { state.theme = state.theme === 'light' ? 'dark' : 'light'; store.set('hx-theme', state.theme); render() }
    else if (act === 'switch') { state.switchOn = !state.switchOn; render() }
    else if (act === 'tab') { state.tab = val; render() }
    else if (act === 'linetab') { state.lineTab = val; render() }
    else if (act === 'modal') { state.modal = true; render() }
    else if (act === 'modal-close' || act === 'mask') { state.modal = false; render() }
    else if (act === 'page') { state.pageNum = val === 'next' ? Math.min(3, state.pageNum + 1) : Number(val); render() }
  })

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSelect()
    if (!state.selectOpen) return
    var panel = document.querySelector('.hx-select-panel[data-select-panel]')
    if (!panel) return
    var items = panel.querySelectorAll('.hx-select-option')
    var active = panel.querySelector('.hx-select-option.is-active')
    var idx = Array.prototype.indexOf.call(items, active)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      var next = (idx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
      if (active) active.classList.remove('is-active')
      items[next].classList.add('is-active')
      items[next].scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter' && active) {
      e.preventDefault()
      active.click()
    }
  })
  document.addEventListener('scroll', repositionSelectOnScroll, true)
  window.addEventListener('resize', repositionSelectOnScroll)
  window.addEventListener('hashchange', function () { readHash(); state.modal = false; render() })
  readHash()
  render()
})()
