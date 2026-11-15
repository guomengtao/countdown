/**
 * 应用内自带词表（自建 t）
 *
 * 为什么不用框架 $t / configuration.setLocale：1050 与 1060 上 setLocale 均为静默 no-op
 * （pit-20261115-189 / -191），界面语言只跟系统走。要「点了就变」只能自己查表渲染。
 * 完整流程见 docs/应用内语言切换-技术实现流程-20261115.md。
 *
 * 词条与 src/i18n/*.json 同源生成，不手抄；全量迁移完成后可删掉 i18n/*.json。
 * 加语言 = DICT 加一个顶层键 + 页面 LOCALES 加一项，模板零改动。
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
  },
  ja: {
    settings: {
      title: '設定',
      language: '言語',
      theme: 'テーマ',
      nickname: '名前',
      unset: '未設定',
      diag: '診断',
      open: 'オン',
      exit: '終了',
      close: 'オフ',
      clear: '全消去',
      clearConfirm: '消去確認'
    },
    theme: {
      classic: 'ダーク',
      blue: 'ブルー',
      green: 'グリーン',
      red: 'コーラル',
      dark: 'ナイト',
      gray: 'グレー',
      purple: 'ムラサキ',
      light: 'ホワイト',
      warm: 'サンド',
      forest: 'モス',
      amber: 'アンバー'
    }
  }
}

// 只按字面量取属性；模板侧绝不拼 key（动态 key 会崩，pit-20261115-190）
// 入参兼容完整 locale（ja-JP / zh-CN / en-US），只取主语言段
function getT(lang) {
  const k = String(lang || '').split('-')[0]
  return DICT[k] || DICT.zh
}

// 偏好优先于系统语言；读不到系统语言时落中文（defaults 恒中文）
// pref 同样是完整 locale（ja-JP / zh-CN），只取主语言段再查
function langFromPref(pref, sysLang) {
  const p = String(pref || '').split('-')[0]
  if (DICT[p]) return p
  const s = String(sysLang || '').toLowerCase()
  if (!s) return 'zh'
  if (s.indexOf('zh') === 0) return 'zh'
  if (s.indexOf('ja') === 0) return 'ja'
  return 'en'
}

module.exports = { DICT: DICT, getT: getT, langFromPref: langFromPref }
