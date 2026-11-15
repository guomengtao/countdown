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
    },
    nickname: {
      title: '设置昵称',
      ph: '输入昵称',
      save: '保存'
    },
    diag: {
      title: '诊断信息',
      hint: '截图发给开发者',
      ver: '版本',
      model: '机型',
      screen: '屏幕',
      os: '系统',
      dict: '词库',
      lang: '语言',
      result: '测试结果',
      refresh: '刷新',
      clear: '清空',
      unknown: '未探测'
    },
    home: {
      title: '倒数日',
      ended: '已结束',
      today: '今天',
      todayBig: '就是今天',
      emptyMain: '还没有倒数日',
      emptySub: '点下方添加',
      addBtn: '＋添加',
      setup: '设置',
      unitDay: '天',
      unitAgo: '天前',
      unitFuture: '天后'
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
    },
    nickname: {
      title: 'Name',
      ph: 'Name',
      save: 'Save'
    },
    diag: {
      title: 'Diag',
      hint: 'Send to dev',
      ver: 'Ver',
      model: 'Model',
      screen: 'Screen',
      os: 'OS',
      dict: 'Dict',
      lang: 'Lang',
      result: 'Result',
      refresh: 'Refresh',
      clear: 'Clear',
      unknown: 'Unknown'
    },
    home: {
      title: 'Timer',
      ended: 'Ended',
      today: 'Today',
      todayBig: 'Today',
      emptyMain: 'No items',
      emptySub: 'Add below',
      addBtn: 'Add',
      setup: 'Setup',
      unitDay: 'days',
      unitAgo: 'ago',
      unitFuture: 'left'
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
    },
    nickname: {
      title: '名前',
      ph: '名前',
      save: '保存'
    },
    diag: {
      title: '診断情報',
      hint: '開発者に送信',
      ver: '版',
      model: '機種',
      screen: '画面',
      os: 'OS',
      dict: '辞書',
      lang: '言語',
      result: '結果',
      refresh: '更新',
      clear: '消去',
      unknown: '未検出'
    },
    home: {
      title: '残り日数',
      ended: '終了',
      today: '今日',
      todayBig: '今日',
      emptyMain: '項目なし',
      emptySub: '下から追加',
      addBtn: '追加',
      setup: '設定',
      unitDay: '日',
      unitAgo: '日前',
      unitFuture: '日後'
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

// 先按偏好解析出主语言段（zh / en / ja），一次取系统语言供多处复用
function resolveLang(pref) {
  let sysLang = ''
  try {
    const c = require('@system.configuration')
    const loc = c.getLocale()
    if (loc && loc.language) sysLang = String(loc.language)
  } catch (e) {}
  return langFromPref(pref, sysLang)
}

// 各页统一入口：给偏好，返回该用的字典。页面只写一行 I18N.forPref(pref)
function forPref(pref) {
  return getT(resolveLang(pref))
}

// 自建 input-method 组件的语言键：cn / en / jp（组件内既有三态）
// 注意映射不是恒等——界面 'zh' 对应键盘 'cn'、界面 'ja' 对应键盘 'jp'。
function imeLangOf(pref) {
  const l = resolveLang(pref)
  if (l === 'ja') return 'jp'
  if (l === 'en') return 'en'
  return 'cn'
}

module.exports = {
  DICT: DICT,
  getT: getT,
  langFromPref: langFromPref,
  resolveLang: resolveLang,
  forPref: forPref,
  imeLangOf: imeLangOf
}
