/**
 * 应用内自带词表（自建 t）
 *
 * 为什么不用框架 $t / configuration.setLocale：1050 与 1060 上 setLocale 均为静默 no-op
 * （pit-20261115-189 / -191），界面语言只跟系统走。要「点了就变」只能自己查表渲染。
 *
 * 词条与 src/i18n/*.json 同源生成，不手抄；全量迁移完成后可删掉 i18n/*.json。
 * 宽度规则见总纲 §3.21 第 9 条：英文单词 ≤8 字母 @28px，行级译文总 P ≤ 原文总 P。
 */
const DICT = {
  zh: {
    settings: {
      title: '设置',
      language: '语言',
      theme: '主题',
      nickname: '昵称',
      unset: '未设置',
      diag: '诊断',
      open: '打开',
      exit: '退出',
      close: '关闭',
      clear: '清空数据',
      clearConfirm: '确认清空'
    },
    theme: {
      classic: '经典黑',
      blue: '深空蓝',
      green: '翡翠绿',
      red: '珊瑚红',
      dark: '暗夜黑',
      gray: '深空灰',
      purple: '暗紫魅影',
      light: '晨光白',
      warm: '暖阳米',
      forest: '墨绿护眼',
      amber: '琥珀金'
    }
  },
  en: {
    settings: {
      title: 'Setup',
      language: 'Lang',
      theme: 'Theme',
      nickname: 'Name',
      unset: 'None',
      diag: 'Diag',
      open: 'On',
      exit: 'Exit',
      close: 'Off',
      clear: 'Clear',
      clearConfirm: 'Confirm'
    },
    theme: {
      classic: 'Dark',
      blue: 'Blue',
      green: 'Green',
      red: 'Coral',
      dark: 'Night',
      gray: 'Gray',
      purple: 'Violet',
      light: 'White',
      warm: 'Sand',
      forest: 'Moss',
      amber: 'Amber'
    }
  }
}

// 只按字面量取属性，模板侧绝不拼 key（动态 key 会让进程直接消失，pit-20261115-190）
function getT(lang) {
  return DICT[lang === 'en' ? 'en' : 'zh']
}

// auto 跟随系统：系统非中文一律给英文；读不到系统语言时落中文（defaults 恒中文）
function langFromPref(pref, sysLang) {
  if (pref === 'en') return 'en'
  if (pref === 'zh-CN') return 'zh'
  const s = String(sysLang || '').toLowerCase()
  if (!s) return 'zh'
  return s.indexOf('zh') === 0 ? 'zh' : 'en'
}

module.exports = { DICT: DICT, getT: getT, langFromPref: langFromPref }
