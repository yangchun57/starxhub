/* 星辰（starTech）· 移动端预览：仅负责浅色 / 暗色切换，无业务依赖 */
(function () {
  var root = document.documentElement
  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-theme-btn]'))
  var KEY = 'startech-mobile-theme'

  try {
    var saved = window.localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') root.dataset.theme = saved
  } catch (e) {
    // 隐私模式下 localStorage 不可用，忽略即可
  }

  // 支持 ?theme=dark / ?theme=light 直接分享指定主题，优先级高于本地记忆
  try {
    var queryTheme = new URLSearchParams(window.location.search).get('theme')
    if (queryTheme === 'light' || queryTheme === 'dark') root.dataset.theme = queryTheme
  } catch (e) {}

  function syncActive() {
    buttons.forEach(function (btn) {
      var active = btn.getAttribute('data-theme-btn') === root.dataset.theme
      if (active) btn.classList.add('is-active')
      else btn.classList.remove('is-active')
    })
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      root.dataset.theme = btn.getAttribute('data-theme-btn')
      try { window.localStorage.setItem(KEY, root.dataset.theme) } catch (e) {}
      syncActive()
    })
  })

  syncActive()
})()
