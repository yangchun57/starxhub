// 星辰 starTech · 小程序组件实例页逻辑
// 所有交互均为可运行示例，不引入第三方依赖
Page({
  data: {
    // 搜索
    keyword: '',
    // 列表
    listItems: [
      { id: 1, title: '订单 SO-20260701', desc: '湖南大学 · 已完成', extra: '¥12,800' },
      { id: 2, title: '订单 SO-20260702', desc: '星辰科技 · 进行中', extra: '¥8,400' },
      { id: 3, title: '订单 SO-20260703', desc: '岳麓书院 · 待审核', extra: '¥2,100' }
    ],
    // 输入
    inputValue: '',
    errorMsg: '',
    // 下拉
    regions: ['湖南省', '广东省', '湖北省', '北京市'],
    regionIndex: 0,
    // 单选/多选
    options: ['选项 A', '选项 B', '选项 C'],
    radioValue: '选项 A',
    checkboxValues: [],
    // 开关/步进/评分/滑块
    switchOn: true,
    stepValue: 1,
    rateValue: 4,
    sliderValue: 60,
    // 日期
    date: '2026-11-17',
    // 上传
    uploads: ['snapshot-1.png'],
    // Tabs
    tabs: ['全部', '进行中', '已完成'],
    activeTab: 0,
    // TabBar
    tabBarItems: [
      { label: '首页', icon: '⌂' },
      { label: '组件', icon: '▦' },
      { label: '我的', icon: '◉' }
    ],
    activeTabBar: 1,
    // 浮层
    sheetOpen: false,
    modalOpen: false,
    toastShow: false,
    // 折叠
    faqs: [
      { title: '如何引入令牌？', content: '在 app.wxss 顶部 @import styles/tokens.wxss，组件样式用 var(--hx-*)。' },
      { title: 'rpx 与 px 如何选？', content: '布局用 rpx 适配，1px 边框/分隔线保留 px 避免模糊。' },
      { title: '小程序与 H5 如何共用？', content: '同名类 + 同令牌 + 同 API；渲染层差异用端样式覆盖。' }
    ],
    openFaq: -1,
    // 宫格
    gridItems: ['课表', '图书馆', '成绩', '缴费', '通知', '更多'],
    // 倒计时
    countdown: { h: '02', m: '45', s: '18' },
    // 图表
    chartData: [42, 65, 55, 78, 60, 88, 70],
    chartLabels: ['一', '二', '三', '四', '五', '六', '日']
  },

  onLoad() {
    this.startCountdown()
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer)
  },

  // 导航
  onBack() {
    wx.navigateBack({ delta: 1 })
  },

  // 搜索
  onSearch(e) {
    this.setData({ keyword: e.detail.value })
    wx.showToast({ title: '搜索：' + (e.detail.value || '空'), icon: 'none' })
  },

  // 通用点击
  onTap() {
    wx.showToast({ title: '主按钮已点击', icon: 'none' })
  },

  // Chip 单选
  onChip(e) {
    // 简化：仅演示，真实项目维护 activeChip 状态
    const key = e.currentTarget.dataset.key
    wx.showToast({ title: '筛选：' + key, icon: 'none' })
  },

  // 列表项
  onItem(e) {
    wx.showToast({ title: '打开 ' + e.currentTarget.dataset.id, icon: 'none' })
  },

  // 输入
  onInput(e) {
    const v = e.detail.value
    this.setData({ inputValue: v, errorMsg: v.length > 15 ? '字数接近上限' : '' })
  },

  // 下拉
  onRegionChange(e) {
    this.setData({ regionIndex: Number(e.detail.value) })
  },

  // 单选/多选/开关
  onRadio(e) {
    this.setData({ radioValue: e.detail.value })
  },
  onCheckbox(e) {
    this.setData({ checkboxValues: e.detail.value })
  },
  onSwitch(e) {
    this.setData({ switchOn: e.detail.value })
  },

  // 步进
  onStepMinus() {
    this.setData({ stepValue: Math.max(0, this.data.stepValue - 1) })
  },
  onStepPlus() {
    this.setData({ stepValue: Math.min(99, this.data.stepValue + 1) })
  },

  // 评分/滑块/日期
  onRate(e) {
    this.setData({ rateValue: Number(e.currentTarget.dataset.value) })
  },
  onSlider(e) {
    this.setData({ sliderValue: e.detail.value })
  },
  onDateChange(e) {
    this.setData({ date: e.detail.value })
  },

  // 上传
  onUpload() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const file = res.tempFiles[0]
        this.setData({ uploads: this.data.uploads.concat(file.tempFilePath.split('/').pop()) })
      }
    })
  },
  onRemoveUpload(e) {
    const src = e.currentTarget.dataset.src
    this.setData({ uploads: this.data.uploads.filter((u) => u !== src) })
  },

  // Tabs / TabBar
  onTab(e) {
    this.setData({ activeTab: Number(e.currentTarget.dataset.index) })
  },
  onTabBar(e) {
    this.setData({ activeTabBar: Number(e.currentTarget.dataset.index) })
  },

  // 浮层
  showSheet() { this.setData({ sheetOpen: true }) },
  hideSheet() { this.setData({ sheetOpen: false }) },
  onSheetAction() {
    this.setData({ sheetOpen: false })
    wx.showToast({ title: '已选择操作', icon: 'none' })
  },
  showModal() { this.setData({ modalOpen: true }) },
  hideModal() { this.setData({ modalOpen: false }) },
  noop() {},
  showToast() {
    this.setData({ toastShow: true })
    wx.showToast({ title: '操作成功', icon: 'success', duration: 2000 })
    setTimeout(() => this.setData({ toastShow: false }), 2000)
  },

  // 空态重试
  onRetry() {
    wx.showToast({ title: '重新加载', icon: 'none' })
  },

  // 通知条关闭
  onCloseNotice() {
    wx.showToast({ title: '已关闭通知', icon: 'none' })
  },

  // 宫格
  onGrid(e) {
    wx.showToast({ title: e.currentTarget.dataset.name, icon: 'none' })
  },

  // 折叠
  onCollapse(e) {
    const i = Number(e.currentTarget.dataset.index)
    this.setData({ openFaq: this.data.openFaq === i ? -1 : i })
  },

  // 图表触摸（Canvas 场景预留）
  onChartTouch() {},

  // 倒计时
  startCountdown() {
    this._timer = setInterval(() => {
      const c = this.data.countdown
      let s = Number(c.s) - 1
      let m = Number(c.m)
      let h = Number(c.h)
      if (s < 0) { s = 59; m-- }
      if (m < 0) { m = 59; h-- }
      if (h < 0) { h = 2; m = 45; s = 18 }
      this.setData({
        countdown: {
          h: String(h).padStart(2, '0'),
          m: String(m).padStart(2, '0'),
          s: String(s).padStart(2, '0')
        }
      })
    }, 1000)
  }
})
