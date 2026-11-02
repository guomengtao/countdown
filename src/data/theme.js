// ===== 主题模块（从 class-schedule 的 data/store.js 剥离）=====
// 背景：class-schedule 的倒数日四页只需要 store.getTheme() 这一个方法，
// 而 store.js 有 1014 行（主题 + 课表 + 假期 + 设置全在里面）。
// 为了一份调色板搬 1014 行属于坏账，所以这里只保留 getTheme 的签名与语义：
//   getTheme(function(theme, themeName) { ... })
//
// 与课程表的差异：倒数日独立应用的视觉基线是「纯黑 + 圆角胶囊」，
// 只有一套深色主题，没有 light / warm。因此 isLight 恒为 false，
// adaptColor() 一律走「往白提亮」分支，色块在纯黑上才能保住对比度。
//
// 色值全部对齐倒数日现有页面（index / pill / nickname / settings），
// 不引入课程表的深蓝紫（#1a1a2e / #16213e）——两套视觉混在一台手环上会显得割裂。

var DARK = {
  bg: "#000000",
  card: "#1c1c1e",
  cardLight: "#2c2c2e",
  border: "#3a3a3c",
  borderLight: "#2c2c2e",
  accent: "#0a84ff",
  text: "#ffffff",
  textSecondary: "#8e8e93",
  textMuted: "#6e6e73",
  btnSecondary: "#3a3a3c",
  btnSecondaryText: "#ffffff",
  deleteBg: "#3a3a3c",
  deleteText: "#ff453a"
}

// 保持异步回调形态：调用方（三个页面）原样保留 store.getTheme 的写法，
// 将来若接入真正的主题切换，只改本文件即可，页面零改动。
function getTheme(cb) {
  if (typeof cb === "function") cb(DARK, "dark")
}

// 是否浅色主题：恒 false。保留导出是为了让 adaptColor(hex, isLight) 的调用点不必改动
function isLightTheme() {
  return false
}

module.exports = {
  DARK: DARK,
  getTheme: getTheme,
  isLightTheme: isLightTheme
}
