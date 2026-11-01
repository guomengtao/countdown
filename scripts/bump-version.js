/**
 * 版本 +1 —— 第三位十进制累加，不进位
 *
 *   0.0.1 → 0.0.2 → … → 0.0.9 → 0.0.10 → … → 0.0.99 → 0.0.100 → 0.0.123
 *
 * 单一事实源 = src/manifest.json。
 * 页面上的版本号用 @system.app.getInfo() 读运行时值，天然与包内一致，
 * 不存在"文件名 0.0.3 / 包内 0.0.2"这种错位。
 *
 * versionCode 必须同步 +1：手环侧靠 code 判新旧，只动 name 会装不上。
 */
const fs = require('fs')
const path = require('path')

const MANIFEST = path.join(__dirname, '../src/manifest.json')

function main() {
  const raw = fs.readFileSync(MANIFEST, 'utf8')
  const m = JSON.parse(raw)

  const parts = String(m.versionName || '0.0.0').split('.')
  while (parts.length < 3) parts.push('0')
  const patch = Number(parts[2] || 0) + 1

  const nextName = parts[0] + '.' + parts[1] + '.' + patch
  const nextCode = Number(m.versionCode || 0) + 1

  m.versionName = nextName
  m.versionCode = nextCode

  fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + '\n', 'utf8')

  console.log('[bump] ' + parts.join('.') + ' → ' + nextName + ' (code ' + nextCode + ')')
  console.log('[bump] 打包后请核对：rpk 文件名版本 == manifest 内版本')
}

main()
