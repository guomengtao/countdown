/**
 * 崩溃探针（crash probe）
 *
 * 为什么要有它：测试用户只装一次、只肯测一次，而且手里没有 logcat。
 * 手环上的崩溃表现是「页面闪一下 / 回桌面 / 应用重启」，用户描述不出来，
 * 我们也拿不到堆栈。所以在磁盘上留脚印，崩溃后回首页看脚印断在哪一级。
 *
 *   enter  离开上一页时写（本页还没开始渲染）
 *   shown  本页 onReady 写（模板渲染成功）
 *   acted  键盘回调第一次触发时写（组件活着、能收按键）
 *   done   用户勾完用例写
 *
 * 判读：
 *   有 enter 无 shown  → 进页即崩（模板/组件初始化炸了）
 *   有 shown 无 acted  → 页面能开，一按键盘就崩
 *   有 acted 无 done   → 键盘能用，用例没勾完
 *
 * 全部写在一个 storage key，避免多 key 异步竞争。
 */

const storage = require('@system.storage')

const KEY = 'cd_probe_log'
const MAX = 150
const ORDER = { enter: 1, shown: 2, armed: 3, acted: 4, done: 5 }

let log = []
let loaded = false

function load() {
  if (loaded) return
  loaded = true
  storage.get({
    key: KEY,
    success: function (data) {
      let old = []
      try {
        old = JSON.parse(data) || []
      } catch (e) {
        old = []
      }
      // load 回调可能晚于 mark，内存里已有的新条目拼在后面不丢
      log = old.concat(log)
      if (log.length > MAX) log = log.slice(log.length - MAX)
    },
    fail: function () {}
  })
}

function save() {
  storage.set({
    key: KEY,
    value: JSON.stringify(log),
    fail: function () {}
  })
}

function mark(page, stage, extra) {
  load()
  log.push({ p: page, s: stage, t: Date.now(), x: extra || '' })
  if (log.length > MAX) log = log.slice(log.length - MAX)
  save()
}

function reset() {
  log = []
  loaded = true
  save()
}

function raw() {
  load()
  return log.slice()
}

/** 每页取最高一级脚印 */
function summary() {
  load()
  const map = {}
  for (let i = 0; i < log.length; i++) {
    const it = log[i]
    const cur = map[it.p]
    if (!cur || (ORDER[it.s] || 0) > (ORDER[cur.s] || 0)) {
      map[it.p] = it
    }
  }
  const out = []
  for (const k in map) {
    out.push({ page: k, stage: map[k].s, time: map[k].t })
  }
  return out
}

/** stage 翻成人话 */
/**
 * 判读（2026-11-01 修）：原先把 shown 直接读成"按键即崩"，但诊断页本身就没有键盘，
 * 被误判成崩溃页，会让用户以为到处都崩。现在按"是否真的尝试加载键盘"分开说。
 *
 * 另一条：文案必须短。诊断页一行只有 168px 内容宽，ev-six 下 28px 字号只容 6 个字，
 * 带上分隔符 · 就直接溢出，所以这里全部压到 3 个字以内。
 */
function verdict(stage) {
  if (stage === 'done') return '可用'
  if (stage === 'acted') return '可用'
  if (stage === 'armed') return '加载崩'
  if (stage === 'shown') return '能开'
  if (stage === 'enter') return '进页崩'
  return '未测'
}

/** 一屏文本，给用户截图 */
function report() {
  const list = summary()
  const lines = []
  for (let i = 0; i < list.length; i++) {
    lines.push(list[i].page + '  ' + verdict(list[i].stage))
  }
  if (!lines.length) lines.push('（暂无记录）')
  return lines
}

module.exports = {
  KEY: KEY,
  load: load,
  mark: mark,
  reset: reset,
  raw: raw,
  summary: summary,
  verdict: verdict,
  report: report
}
