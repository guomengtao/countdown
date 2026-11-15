#!/usr/bin/env node
/**
 * 由 src/i18n/*.json 生成 src/common/i18n.js 里的 DICT 字面量。
 *
 * 为什么要有这个脚本：字典本体是「数据」，逻辑是「代码」。手抄字典必然漏词/写错引号，
 * 所以字典只允许生成，不允许手改。加词条 = 改 JSON → 跑本脚本。
 *
 * 用法：node scripts/gen-i18n.js
 * 规则：
 *   - 语言来源固定为 zh-CN / en / ja-JP 三份 JSON 的 message 段
 *   - 只替换 `const DICT = {...}` 这一段，文件其余部分（注释、函数）原样保留
 *   - 生成后请跑 node test/i18n.test.js 验证 key 对齐
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const TARGET = path.join(ROOT, 'src/common/i18n.js')

// 语言标识 → 词表文件（DICT 的顶层键 = 语言标识，页面 LOCALES 里也是这套值）
const SOURCES = [
  { key: 'zh', file: 'src/i18n/zh-CN.json' },
  { key: 'en', file: 'src/i18n/en.json' },
  { key: 'ja', file: 'src/i18n/ja-JP.json' }
]

function readMessage(rel) {
  const p = path.join(ROOT, rel)
  if (!fs.existsSync(p)) throw new Error('词表不存在: ' + rel)
  const j = JSON.parse(fs.readFileSync(p, 'utf8'))
  if (!j || typeof j.message !== 'object') throw new Error(rel + ' 缺少 message 段')
  return j.message
}

// 输出成 JS 字面量：key 不加引号、字符串统一单引号
function toJsLiteral(obj) {
  const json = JSON.stringify(obj, null, 2)
  return json
    .replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)":/g, '$1:')
    .replace(/"/g, "'")
}

function countLeaves(o) {
  let n = 0
  for (const k in o) {
    const v = o[k]
    if (v && typeof v === 'object') n += countLeaves(v)
    else n++
  }
  return n
}

function main() {
  const dict = {}
  SOURCES.forEach(function (s) {
    dict[s.key] = readMessage(s.file)
  })

  const src = fs.readFileSync(TARGET, 'utf8')
  const START = 'const DICT = '
  // 结束标记不带前导换行：上一版写成 '\n\n// ...' 并在拼接时 replace(/^\n+/, '')，
  // 结果第一次生成后文件里只剩一个 \n，第二次运行就找不到标记了（不可幂等）。
  // 现在标记只认注释本身，输出时统一补 '\n\n'，任意次运行结果一致。
  const END = '// 只按字面量取属性'
  const i = src.indexOf(START)
  const j = src.indexOf(END)
  if (i < 0 || j < 0) {
    throw new Error('i18n.js 结构变了：找不到 DICT 起始或结束标记，请人工确认')
  }

  const next = src.slice(0, i + START.length) +
    toJsLiteral(dict) + '\n\n' +
    src.slice(j)

  fs.writeFileSync(TARGET, next)

  Object.keys(dict).forEach(function (k) {
    console.log('  ' + k + ': ' + countLeaves(dict[k]) + ' 条')
  })
  console.log('[gen-i18n] 已写入 src/common/i18n.js')
}

main()
