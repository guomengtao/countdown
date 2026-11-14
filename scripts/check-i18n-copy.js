#!/usr/bin/env node
/**
 * 多语言文案长度校验（总纲 §3.21 第 9 条）
 *
 * 用法：node scripts/check-i18n-copy.js [locale ...]
 *   不带参数 = 校验 src/i18n/ 下除 defaults.json 外的全部语言包
 *   带参数   = node scripts/check-i18n-copy.js en ja-JP
 *
 * 三条判据：
 *   ① 同一 UI 行「译文总 P ≤ 中文原文总 P」——行级不回归，硬失败
 *      （双列同行按左右两列合计，见 §3.21 第 9.4 条）
 *   ② 各语言 key 集合与 defaults.json 完全一致——防漏译 / 防漂移，硬失败
 *   ③ 单条英文单词 ≤8 字母（@28px 默认写作目标）——超了只提示，可降 24px 档
 *
 * 字符宽度按 locale 参数化：日语汉字 / 假名 1.0P，不套英文的字母预算。
 * 加新语言时只需放 <locale>.json，本脚本自动纳入，无需改校验逻辑。
 */
const fs = require('fs')
const path = require('path')

const I18N_DIR = path.join(__dirname, '..', 'src', 'i18n')
const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/
const KANA = /[\u3040-\u30ff\u31f0-\u31ff]/
const FULLWIDTH = /[\u3000-\u303f\uff00-\uffef]/

const WIDTH = {
  zh: { han: 1.0, kana: 1.0, latin: 0.55, space: 0.3, punct: 0.5 },
  en: { han: 1.0, kana: 1.0, latin: 0.55, space: 0.3, punct: 0.55 },
  ja: { han: 1.0, kana: 1.0, latin: 0.55, space: 0.3, punct: 0.5 }
}

function family(locale) {
  const l = String(locale).toLowerCase()
  if (l.indexOf('ja') === 0) return 'ja'
  if (l.indexOf('en') === 0) return 'en'
  return 'zh'
}

function widthOf(s, locale) {
  const w = WIDTH[family(locale)]
  let p = 0
  const str = String(s == null ? '' : s)
  for (const ch of str) {
    if (ch === ' ') p += w.space
    else if (/[A-Za-z0-9]/.test(ch)) p += w.latin
    else if (CJK.test(ch)) p += w.han
    else if (KANA.test(ch) || FULLWIDTH.test(ch)) p += w.kana
    else p += w.punct
  }
  return Math.round(p * 100) / 100
}

function flatten(obj, prefix, out) {
  prefix = prefix || ''
  out = out || {}
  Object.keys(obj || {}).forEach(function (k) {
    const p = prefix ? prefix + '.' + k : k
    const v = obj[k]
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, p, out)
    else out[p] = String(v)
  })
  return out
}

function load(name) {
  return JSON.parse(fs.readFileSync(path.join(I18N_DIR, name), 'utf8'))
}

// 设置页 192×490：.list 宽 168，.item 左右 padding 14/12 ⇒ 内容宽 142px。
// 多数条目是双列同行（key + value），必须左右合计比，不能单看一个词。
const ROWS = [
  ['页头', ['message.settings.title']],
  ['主题行', ['message.settings.theme', 'message.theme.classic']],
  ['昵称行(未设置)', ['message.settings.nickname', 'message.settings.unset']],
  ['诊断行', ['message.settings.diag', 'message.settings.open']],
  ['退出行', ['message.settings.exit', 'message.settings.close']],
  ['清空行', ['message.settings.clear']],
  ['清空确认行', ['message.settings.clearConfirm']]
]

if (!fs.existsSync(path.join(I18N_DIR, 'defaults.json'))) {
  console.error('FAIL: 缺 src/i18n/defaults.json —— 官方规范：缺失会把 $t(...) 当字面量显示')
  process.exit(1)
}

const base = flatten(load('defaults.json'))
const baseKeys = Object.keys(base).sort()

let targets = process.argv.slice(2)
if (!targets.length) {
  targets = fs.readdirSync(I18N_DIR).filter(function (f) {
    return /\.json$/.test(f) && f !== 'defaults.json'
  })
}
if (!targets.length) {
  console.error('FAIL: 没有可校验的语言包')
  process.exit(1)
}

let failed = false
console.log('基线 defaults.json：' + baseKeys.length + ' 个 key\n')

targets.forEach(function (arg) {
  const file = /\.json$/.test(arg) ? arg : arg + '.json'
  const locale = file.replace(/\.json$/, '')
  const fp = path.join(I18N_DIR, file)
  if (!fs.existsSync(fp)) {
    console.error('FAIL: 语言包不存在 ' + file)
    failed = true
    return
  }
  let flat
  try {
    flat = flatten(load(file))
  } catch (e) {
    console.error('FAIL: ' + file + ' 不是合法 JSON —— ' + e.message)
    failed = true
    return
  }
  const keys = Object.keys(flat).sort()
  const missing = baseKeys.filter(function (k) { return keys.indexOf(k) < 0 })
  const extra = keys.filter(function (k) { return baseKeys.indexOf(k) < 0 })

  console.log('=== ' + file + '（宽度族 ' + family(locale) + '）===')
  if (missing.length || extra.length) {
    failed = true
    console.log('  FAIL  key 集合不一致：缺 ' + missing.length + ' / 多 ' + extra.length)
    if (missing.length) console.log('        缺：' + missing.join(', '))
    if (extra.length) console.log('        多：' + extra.join(', '))
  } else {
    console.log('  OK    key 集合一致（' + keys.length + ' 条）')
  }

  let rowFail = 0
  ROWS.forEach(function (r) {
    let zh = 0
    let tr = 0
    r[1].forEach(function (k) {
      zh += widthOf(base[k], 'zh-CN')
      tr += widthOf(flat[k], locale)
    })
    zh = Math.round(zh * 100) / 100
    tr = Math.round(tr * 100) / 100
    const ok = tr <= zh
    if (!ok) { failed = true; rowFail++ }
    console.log('  ' + (ok ? 'OK  ' : 'FAIL') + ' ' + r[0] + '：中文 ' + zh.toFixed(2) + 'P → ' + locale + ' ' + tr.toFixed(2) + 'P')
  })

  // 单条超宽只作提示，不判失败：§3.21 第 9.4 条允许双列同行左右互借额度，
  // 例如「主题」2P → Theme 2.75P 单看超宽，但右列「经典黑」3P → Dark 2.2P 省回 0.8P，
  // 整行 5.00P → 4.95P 仍达标。硬判据是行级合计。
  let itemWide = []
  baseKeys.forEach(function (k) {
    const a = widthOf(base[k], 'zh-CN')
    const b = widthOf(flat[k], locale)
    if (b > a) itemWide.push(k + '(' + a.toFixed(2) + ' → ' + b.toFixed(2) + ')')
    if (family(locale) === 'en' && /^[A-Za-z]+$/.test(flat[k]) && flat[k].length > 8) {
      console.log('  WARN 单词 >8 字母（@28px 目标）：' + k + ' = ' + flat[k])
    }
  })
  console.log('  行级超宽 ' + rowFail + '/' + ROWS.length + '（硬判据）')
  console.log('  单条超宽 ' + itemWide.length + '/' + baseKeys.length + '（仅提示：双列成员由行级合计借额度兜底）')
  if (itemWide.length) console.log('        ' + itemWide.join(', '))
  console.log('')
})

console.log(failed ? 'RESULT: FAIL' : 'RESULT: PASS')
process.exit(failed ? 1 : 0)
