// ===== 主题模块（11 套：本应用经典黑 + 从 ev/class-schedule 复制来的 10 套）=====
// 历史：本文件早先只是一个 40 行的假实现，getTheme() 恒返回纯黑，
// 因为倒数日当时只有一套视觉。现在要可切换配色，所以退回真实实现。
//
// 数据来源与取舍：
//   - classic 是本应用原有的纯黑 + iOS 蓝体系（bg #000 / card #1c1c1e / accent #0a84ff），
//     作为默认值，保证老用户升级后视觉零变化。
//   - 其余 10 套逐字节取自 ev/class-schedule/src/data/store.js 的 THEMES
//     （深空蓝/翡翠绿/珊瑚红/暗夜黑/深空灰/暗紫魅影/晨光白/暖阳米/墨绿护眼/琥珀金）。
//     没有二次调色 —— 那 10 套是课程表长期真机调过的，改色只会让「同一套主题在两个
//     应用里颜色不一样」，反而更难维护。
//   - 字段名两套体系不完全一致，这里取并集：countdown 的页面用到 keyBg，
//     课程表的页面用到 progressOngoing/progressDone，都保留，谁也不缺。
//
// 持久化：storage key = "cd_theme"，存主题 key 字符串（如 "blue"）。
// 读到不认识的值（降级、脏数据）一律回落 classic，不抛错、不白屏。

var storage = require("@system.storage")

var THEME_KEY = "cd_theme"

var THEMES = {
  classic: {
    name: "经典黑",
    bg: "#000000",
    card: "#1c1c1e",
    cardLight: "#2c2c2e",
    accent: "#0a84ff",
    text: "#ffffff",
    textSecondary: "#8e8e93",
    textMuted: "#6e6e73",
    border: "#3a3a3c",
    borderLight: "#2c2c2e",
    keyBg: "#1c1c1e",
    keyBorder: "#2c2c2e",
    btnSecondary: "#3a3a3c",
    btnSecondaryText: "#ffffff",
    deleteBg: "#3a3a3c",
    deleteText: "#ff453a",
    progressOngoing: "rgba(10,132,255,0.2)",
    progressDone: "rgba(10,90,180,0.25)"
  },
  blue: {
    name: "深空蓝",
    bg: "#1a1a2e",
    card: "#16213e",
    cardLight: "#0f3460",
    accent: "#7ec8e3",
    text: "#ffffff",
    textSecondary: "#888899",
    textMuted: "#555566",
    border: "#0f3460",
    borderLight: "#2a2a5a",
    keyBg: "#1a1a3e",
    keyBorder: "#2a2a5a",
    btnSecondary: "#333355",
    btnSecondaryText: "#a0a0b0",
    deleteBg: "#2a1a3e",
    deleteText: "#e08080",
    progressOngoing: "rgba(126,200,227,0.2)",
    progressDone: "rgba(74,138,154,0.25)"
  },
  green: {
    name: "翡翠绿",
    bg: "#1a2e1a",
    card: "#1a3a1a",
    cardLight: "#0f4a20",
    accent: "#7ec8a0",
    text: "#ffffff",
    textSecondary: "#889988",
    textMuted: "#556655",
    border: "#0f4a20",
    borderLight: "#2a4a2a",
    keyBg: "#1a2e1a",
    keyBorder: "#2a4a2a",
    btnSecondary: "#334433",
    btnSecondaryText: "#a0b0a0",
    deleteBg: "#2a2e1a",
    deleteText: "#e0c880",
    progressOngoing: "rgba(126,200,160,0.2)",
    progressDone: "rgba(74,138,106,0.25)"
  },
  red: {
    name: "珊瑚红",
    bg: "#2e1a1a",
    card: "#3a1a1a",
    cardLight: "#4a2020",
    accent: "#e37e7e",
    text: "#ffffff",
    textSecondary: "#998888",
    textMuted: "#665555",
    border: "#4a2020",
    borderLight: "#5a2a2a",
    keyBg: "#3a1a1a",
    keyBorder: "#4a2a2a",
    btnSecondary: "#553333",
    btnSecondaryText: "#b0a0a0",
    deleteBg: "#3a1a2a",
    deleteText: "#e38080",
    progressOngoing: "rgba(227,126,126,0.2)",
    progressDone: "rgba(154,74,74,0.25)"
  },
  dark: {
    name: "暗夜黑",
    bg: "#000000",
    card: "#0a0a0a",
    cardLight: "#111111",
    accent: "#666666",
    text: "#cccccc",
    textSecondary: "#666666",
    textMuted: "#444444",
    border: "#1a1a1a",
    borderLight: "#222222",
    keyBg: "#0a0a0a",
    keyBorder: "#1a1a1a",
    btnSecondary: "#222222",
    btnSecondaryText: "#888888",
    deleteBg: "#1a0a0a",
    deleteText: "#aa6666",
    progressOngoing: "rgba(102,102,102,0.2)",
    progressDone: "rgba(68,68,68,0.25)"
  },
  gray: {
    name: "深空灰",
    bg: "#1a1a1a",
    card: "#242424",
    cardLight: "#1a1a1a",
    accent: "#888899",
    text: "#e0e0e0",
    textSecondary: "#888899",
    textMuted: "#555566",
    border: "#2a2a2a",
    borderLight: "#333333",
    keyBg: "#1a1a1a",
    keyBorder: "#2a2a2a",
    btnSecondary: "#333333",
    btnSecondaryText: "#999999",
    deleteBg: "#2a1a1a",
    deleteText: "#cc8888",
    progressOngoing: "rgba(136,136,153,0.2)",
    progressDone: "rgba(85,85,102,0.25)"
  },
  purple: {
    name: "暗紫魅影",
    bg: "#1a0a2e",
    card: "#2a1a3a",
    cardLight: "#3a204a",
    accent: "#b07ec8",
    text: "#e0d0e8",
    textSecondary: "#9988aa",
    textMuted: "#665577",
    border: "#3a204a",
    borderLight: "#4a2a5a",
    keyBg: "#2a1a3a",
    keyBorder: "#3a2a4a",
    btnSecondary: "#443355",
    btnSecondaryText: "#b0a0c0",
    deleteBg: "#3a1a2a",
    deleteText: "#e080c0",
    progressOngoing: "rgba(176,126,200,0.2)",
    progressDone: "rgba(106,74,122,0.25)"
  },
  light: {
    name: "晨光白",
    bg: "#f0f0f0",
    card: "#ffffff",
    cardLight: "#e8e8e8",
    accent: "#4a90d9",
    text: "#222222",
    textSecondary: "#888888",
    textMuted: "#aaaaaa",
    border: "#d0d0d0",
    borderLight: "#e0e0e0",
    keyBg: "#ffffff",
    keyBorder: "#d0d0d0",
    btnSecondary: "#e0e0e0",
    btnSecondaryText: "#666666",
    deleteBg: "#f0e0e0",
    deleteText: "#cc6666",
    progressOngoing: "rgba(74,144,217,0.2)",
    progressDone: "rgba(42,90,138,0.25)"
  },
  warm: {
    name: "暖阳米",
    bg: "#f5f0e8",
    card: "#ffffff",
    cardLight: "#f0ece4",
    accent: "#c4a882",
    text: "#332211",
    textSecondary: "#887766",
    textMuted: "#998877",
    border: "#e0d8cc",
    borderLight: "#e8e0d4",
    keyBg: "#ffffff",
    keyBorder: "#d0c8bc",
    btnSecondary: "#e8e0d4",
    btnSecondaryText: "#887766",
    deleteBg: "#f0e0d8",
    deleteText: "#cc8866",
    progressOngoing: "rgba(196,168,130,0.2)",
    progressDone: "rgba(138,106,74,0.25)"
  },
  forest: {
    name: "墨绿护眼",
    bg: "#1a2a1a",
    card: "#0a1a0a",
    cardLight: "#0a2a0a",
    accent: "#6a9a6a",
    text: "#c0d0c0",
    textSecondary: "#7a8a7a",
    textMuted: "#5a6a5a",
    border: "#0a2a0a",
    borderLight: "#1a3a1a",
    keyBg: "#0a1a0a",
    keyBorder: "#1a2a1a",
    btnSecondary: "#2a3a2a",
    btnSecondaryText: "#8a9a8a",
    deleteBg: "#1a2a1a",
    deleteText: "#aa8866",
    progressOngoing: "rgba(106,154,106,0.2)",
    progressDone: "rgba(58,90,58,0.25)"
  },
  amber: {
    name: "琥珀金",
    bg: "#2a1a0a",
    card: "#3a2a1a",
    cardLight: "#4a3a2a",
    accent: "#d4a060",
    text: "#f0e0c0",
    textSecondary: "#a09070",
    textMuted: "#807060",
    border: "#4a3a2a",
    borderLight: "#5a4a3a",
    keyBg: "#3a2a1a",
    keyBorder: "#4a3a2a",
    btnSecondary: "#554433",
    btnSecondaryText: "#b0a090",
    deleteBg: "#3a2a1a",
    deleteText: "#e0a060",
    progressOngoing: "rgba(212,160,96,0.2)",
    progressDone: "rgba(138,106,58,0.25)"
  }
}

// 主题页的展示顺序：默认在最前，其后按色相分组（冷 → 绿 → 红 → 紫 → 中性 → 浅色 → 暖）
var ORDER = [
  "classic", "blue", "green", "forest", "red", "amber",
  "purple", "dark", "gray", "light", "warm"
]

// 浅色主题名单：决定 adaptColor / isLight 分支。只认这两套，
// 其余深色主题一律走「往白提亮」，色块在黑底上才有对比度。
var LIGHT_KEYS = ["light", "warm"]

var currentKey = "classic"

function fallback(key) {
  return THEMES[key] ? key : "classic"
}

// 保持异步回调形态，签名与课程表 store.getTheme 一致：
//   getTheme(function(theme, themeName) { ... })
// 页面现有写法零改动。
function getTheme(cb) {
  storage.get({
    key: THEME_KEY,
    success: function (v) {
      currentKey = fallback(v ? String(v) : "")
      if (typeof cb === "function") cb(THEMES[currentKey], currentKey)
    },
    fail: function () {
      currentKey = "classic"
      if (typeof cb === "function") cb(THEMES[currentKey], currentKey)
    }
  })
}

// 同步取当前主题对象：只给「已经 getTheme 过一次」的页面做兜底用
function themeOf(key) {
  return THEMES[fallback(key || currentKey)]
}

function setTheme(key, cb) {
  var k = fallback(key)
  currentKey = k
  storage.set({
    key: THEME_KEY,
    value: k,
    success: function () { if (typeof cb === "function") cb(THEMES[k], k) },
    fail: function () { if (typeof cb === "function") cb(THEMES[k], k) }
  })
}

// 主题页渲染用：返回数组，避免模板里对对象做 for-in（Vela 模板不支持）
function listThemes() {
  var out = []
  for (var i = 0; i < ORDER.length; i++) {
    var k = ORDER[i]
    var t = THEMES[k]
    out.push({
      key: k,
      name: t.name,
      bg: t.bg,
      card: t.card,
      accent: t.accent,
      text: t.text,
      swatch: "background-color: " + t.bg,
      dot: "background-color: " + t.accent
    })
  }
  return out
}

function isLightTheme() {
  return LIGHT_KEYS.indexOf(currentKey) >= 0
}

module.exports = {
  THEMES: THEMES,
  ORDER: ORDER,
  getTheme: getTheme,
  setTheme: setTheme,
  themeOf: themeOf,
  listThemes: listThemes,
  isLightTheme: isLightTheme,
  // 兼容旧导出名（index/pill 等页面里 DARK 曾被直接引用）
  DARK: THEMES.classic
}
