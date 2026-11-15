/**
 * 自建词表（src/common/i18n.js）单元测试 —— node test/i18n.test.js
 *
 * 为什么要有：语言切换失效的根因是框架 setLocale 在 1050/1060 上都是静默 no-op
 * （pit-20261115-189 / -191），现在文案改由自家字典供给，字典就是唯一真相 ——
 * 它一旦缺 key，页面会直接渲染出 undefined，且运行时没有任何报错。
 *
 * 钉死的四条：
 *   1) zh / en 的 key 集合必须完全一致（缺一条即失败，不靠人眼对表）；
 *   2) getT 只认 'en'，其余一切（含 undefined）落中文，保证兜底永不空白；
 *   3) langFromPref：显式偏好优先，auto 才看系统语言，系统非 zh* 一律英文；
 *   4) ev-six 硬约束：英文每个单词 ≤8 字母（@28px），总纲 §3.21 第 9 条。
 */

const assert = require('assert')
const path = require('path')

const I18N = require(path.join(__dirname, '..', 'src', 'common', 'i18n.js'))

let pass = 0
function ok(name, fn) {
  fn()
  pass++
  console.log('  ✓ ' + name)
}

function keysOf(obj, prefix) {
  const out = []
  for (const k in obj) {
    const p = prefix ? prefix + '.' + k : k
    if (obj[k] && typeof obj[k] === 'object') out.push.apply(out, keysOf(obj[k], p))
    else out.push(p)
  }
  return out.sort()
}

console.log('\n1. zh / en / ja key 集合一致')
ok('三份词表 key 完全相同且非空', function () {
  const zh = keysOf(I18N.DICT.zh)
  assert.ok(zh.length > 0, 'zh 词表为空')
  assert.deepStrictEqual(keysOf(I18N.DICT.en), zh, 'en 与 zh 的 key 集合不一致')
  assert.deepStrictEqual(keysOf(I18N.DICT.ja), zh, 'ja 与 zh 的 key 集合不一致')
})

console.log('\n2. getT 兜底')
ok("getT('en') 返回 en", function () {
  assert.strictEqual(I18N.getT('en').settings.title, I18N.DICT.en.settings.title)
})
ok("getT('zh') / getT('zh-CN') / getT(undefined) 均返回 zh", function () {
  assert.strictEqual(I18N.getT('zh'), I18N.DICT.zh)
  assert.strictEqual(I18N.getT('zh-CN'), I18N.DICT.zh)
  assert.strictEqual(I18N.getT(undefined), I18N.DICT.zh)
})
ok("getT('ja-JP') 返回 ja（日语已接入）", function () {
  assert.strictEqual(I18N.getT('ja-JP'), I18N.DICT.ja)
  assert.strictEqual(I18N.getT('ja').settings.title, '設定')
})

console.log('\n3. langFromPref 解析')
ok("显式偏好优先于系统语言", function () {
  assert.strictEqual(I18N.langFromPref('en', 'zh'), 'en')
  assert.strictEqual(I18N.langFromPref('zh-CN', 'en'), 'zh')
})
ok('auto 跟随系统：zh* → zh，ja* → ja，其余 → en', function () {
  assert.strictEqual(I18N.langFromPref('auto', 'zh'), 'zh')
  assert.strictEqual(I18N.langFromPref('auto', 'zh-CN'), 'zh')
  assert.strictEqual(I18N.langFromPref('auto', 'zh-Hans'), 'zh')
  assert.strictEqual(I18N.langFromPref('auto', 'ja'), 'ja')
  assert.strictEqual(I18N.langFromPref('auto', 'ja-JP'), 'ja')
  assert.strictEqual(I18N.langFromPref('auto', 'en'), 'en')
  assert.strictEqual(I18N.langFromPref('auto', 'ko'), 'en')
})
ok('显式日语偏好直接生效', function () {
  assert.strictEqual(I18N.langFromPref('ja-JP', 'en'), 'ja')
})
ok('auto 且系统语言缺失时落中文（不空屏）', function () {
  assert.strictEqual(I18N.langFromPref('auto', undefined), 'zh')
  assert.strictEqual(I18N.langFromPref('auto', ''), 'zh')
})

console.log('\n4. ev-six：英文单词 ≤8 字母 @28px')
ok('settings 与 theme 的所有英文值均满足', function () {
  const bad = []
  const walk = function (obj, prefix) {
    for (const k in obj) {
      const v = obj[k]
      if (v && typeof v === 'object') walk(v, prefix + k + '.')
      else {
        String(v).split(/[\s\-/]+/).forEach(function (w) {
          if (w.length > 8) bad.push(prefix + k + ' = "' + v + '"（单词 ' + w + ' ' + w.length + ' 字母）')
        })
      }
    }
  }
  walk(I18N.DICT.en, '')
  assert.deepStrictEqual(bad, [], '超长英文单词：\n    ' + bad.join('\n    '))
})

console.log('\n全部通过 ' + pass + ' 项\n')
