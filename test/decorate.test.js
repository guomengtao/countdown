/**
 * 首页天数展示（cd-list.decorate）单元测试 —— node test/decorate.test.js
 *
 * 为什么这么测：快应用没有测试框架，逻辑写在 .ux 的 <script> 里，Node 不能直接 require。
 * 这里把真实的 decorate() 源码整段抽出来求值（不是抄一份副本），再注入真实数据层
 * countdown.js（只给 `@system.storage` 打桩），测的就是线上跑的那两段代码 ——
 * 抄副本会漂移，抽源码不会。
 *
 * 钉死的命门（2026-11-02 统一「方向由单位承担」后）：
 *   1) 数字永不带正负号：未来「N 天」、过去（已过期/正计时）「N 天前」；
 *   2) 今天必须落到「0」+「天」，不能变成「0 天前」；
 *   3) 已过期压灰 + 归入「已结束」分组，且分隔线只能在组首出现一次；
 *   4) 正计时不压灰（吃用户自选颜色），且不再回到「+306」那套符号方案；
 *   5) 字号三档分界：≤2 字符 44 / 3 字符 30 / ≥4 字符 28（越界会在真机折行）；
 *   6) phrase、dirWord 两个死字段不许复活。
 */

"use strict"
process.env.TZ = "Asia/Shanghai"

var fs = require("fs")
var path = require("path")
var Module = require("module")

/* ── 给 `@system.storage` 打桩，让真实数据层能 require ── */

var STORE = {}
var origLoad = Module._load
Module._load = function(request) {
  if (request === "@system.storage") {
    return {
      get: function(o) { if (o && o.success) o.success({ key: o.key, data: STORE[o.key] }) },
      set: function(o) { if (o) STORE[o.key] = o.data; if (o && o.success) o.success() },
      delete: function(o) { if (o) delete STORE[o.key]; if (o && o.success) o.success() }
    }
  }
  return origLoad.apply(this, arguments)
}

var countdown = require(path.join(__dirname, "..", "src", "data", "countdown.js"))

var UX = path.join(__dirname, "..", "src", "pages", "cd-list", "cd-list.ux")
var SRC = fs.readFileSync(UX, "utf8")

var pass = 0, fail = 0
function ok(n) { pass++; console.log("  \x1b[32m✓\x1b[0m " + n) }
function bad(n, d) { fail++; console.log("  \x1b[31m✗\x1b[0m " + n + (d ? "\n      \x1b[2m" + d + "\x1b[0m" : "")) }
function eq(n, a, b) { if (a === b) ok(n); else bad(n, "期望 " + JSON.stringify(b) + "，实际 " + JSON.stringify(a)) }
function truthy(n, v) { if (v) ok(n); else bad(n, "期望真值，实际 " + JSON.stringify(v)) }

/* ── 从 .ux 里抽出 decorate 方法原文（按大括号配平，跳过字符串与注释） ── */

function extractMethod(src, name) {
  var head = src.indexOf("\n  " + name + "(")
  if (head < 0) throw new Error("在 cd-list.ux 里找不到方法 " + name)
  var start = head + 1
  var i = src.indexOf("{", start)
  var depth = 0, inS = null, inLine = false, inBlock = false
  for (; i < src.length; i++) {
    var c = src[i], p = src[i - 1], nx = src[i + 1]
    if (inLine) { if (c === "\n") inLine = false; continue }
    if (inBlock) { if (c === "/" && p === "*") inBlock = false; continue }
    if (inS) {
      if (c === "\\") { i++; continue }
      if (c === inS) inS = null
      continue
    }
    if (c === "/" && nx === "/") { inLine = true; continue }
    if (c === "/" && nx === "*") { inBlock = true; continue }
    if (c === '"' || c === "'" || c === "`") { inS = c; continue }
    if (c === "{") depth++
    else if (c === "}") {
      depth--
      if (depth === 0) return src.slice(start, i + 1)
    }
  }
  throw new Error("decorate 方法括号未配平")
}

var METHOD = extractMethod(SRC, "decorate")
// 源码里是 `decorate(items) {…}`（对象字面量方法简写），补 function 关键字才能 new Function
var decorate = new Function("countdown", "return function " + METHOD)(countdown)

var THEME = { textMuted: "#8A8A8A", bg: "#000000", text: "#FFFFFF" }

// 造一条输入，交给真实的 decorate 处理
function run(list, opts) {
  opts = opts || {}
  var ctx = { isLight: !!opts.isLight, theme: opts.theme || THEME }
  decorate.call(ctx, list)
  return list
}

function item(daysLeft, mode, extra) {
  var it = { title: "考试", daysLeft: daysLeft, mode: mode || "down", color: "#FF6B6B" }
  for (var k in extra) it[k] = extra[k]
  return it
}

// 相对今天的日期串（computeItem / progressOf 都用它算天数）
function dateOffset(days) {
  var d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  var m = d.getMonth() + 1, dd = d.getDate()
  return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (dd < 10 ? "0" + dd : dd)
}

/* ── 1. 四种情形的主文案 ───────────────────────────── */

console.log("\n1. 天数文案：方向一律由单位承担")

var future = run([item(126)])[0]
eq("未来：数字不带符号", future.numText, "126")
eq("未来：列表单位「天」", future.unitText, "天")
eq("未来：hero 单位「天后」", future.heroUnit, "天后")
eq("未来：status=active", future.status, "active")
truthy("未来：不置灰（吃用户色，非 textMuted）", future.daysColor !== THEME.textMuted)

var today = run([item(0)])[0]
eq("今天：数字 0", today.numText, "0")
eq("今天：单位「天」不是「天前」", today.unitText, "天")
eq("今天：isToday", today.isToday, true)
eq("今天：status=today", today.status, "today")

var past = run([item(-5)])[0]
eq("已过期：绝对值无符号", past.numText, "5")
eq("已过期：单位「天前」", past.unitText, "天前")
eq("已过期：hero 也是「天前」", past.heroUnit, "天前")
eq("已过期：status=done", past.status, "done")
eq("已过期：压灰用 theme.textMuted", past.daysColor, THEME.textMuted)

var up = run([item(-306, "up")])[0]
eq("正计时：绝对值无符号（不再是 +306）", up.numText, "306")
eq("正计时：单位「天前」", up.unitText, "天前")
eq("正计时：status=active 不归入已结束", up.status, "active")
truthy("正计时：不压灰（吃用户自选色）", up.daysColor !== THEME.textMuted)

var upToday = run([item(0, "up")])[0]
eq("正计时起点当天也算今天", upToday.numText, "0")
eq("正计时起点当天单位「天」", upToday.unitText, "天")

/* ── 2. 全量铁律：任何数字都不许出现正负号 ──────────── */

console.log("\n2. 铁律：numText 永不带正负号")

var many = run([
  item(0), item(1), item(126), item(1234), item(-1), item(-5),
  item(-306, "up"), item(306, "up")
])
var signed = many.filter(function(it) { return /^[+\-−]/.test(it.numText) })
eq("8 条输入里带符号的条数", signed.length, 0)

/* ── 3. 字号三档分界 ─────────────────────────────── */

console.log("\n3. 字号分档：≤2 字符 44 / 3 字符 30 / ≥4 字符 28")

var sizes = run([item(9), item(99), item(126), item(1234)]).map(function(it) { return it.numText + "→" + it.numSize })
eq("分档结果", sizes.join(", "), "9→44, 99→44, 126→30, 1234→28")

/* ── 4. 分组：真正走一遍 sortForDisplay 再判分隔线 ──── */

console.log("\n4. 分组：排序后 active 全在前、done 全在后，分隔线只出现一次")

var real = [
  { title: "已过期A", daysLeft: -2, mode: "down", color: "#FF6B6B" },
  { title: "正计时", daysLeft: -30, mode: "up", color: "#FF6B6B" },
  { title: "未来", daysLeft: 10, mode: "down", color: "#FF6B6B" },
  { title: "已过期B", daysLeft: -9, mode: "down", color: "#FF6B6B" },
  { title: "今天", daysLeft: 0, mode: "down", color: "#FF6B6B" }
]
countdown.sortForDisplay(real, "recent")
var order = real.map(function(it) { return it.title })
eq("排序结果", order.join(","), "今天,未来,正计时,已过期A,已过期B")

run(real)
var dividers = real.filter(function(it) { return it.showDivider })
eq("分隔线出现次数", dividers.length, 1)
eq("分隔线落在组首（已过期A）", dividers[0] && dividers[0].title, "已过期A")
eq("首条不出现分隔线", real[0].showDivider, false)
eq("正计时不进已结束分组", real[2].status, "active")

/* ── 5. 进度条像素：下限钳位 + 中点近似 ─────────────── */

console.log("\n5. 进度条像素：无日期钳到 4px，半程约 72/74")

eq("无 date → progressOf 0 → fillPx 钳到 4", run([item(5)])[0].fillPx, 4)

var mid = {
  title: "半程", mode: "down", color: "#FF6B6B",
  date: dateOffset(5),
  createdAt: new Date(new Date().setHours(0, 0, 0, 0) - 5 * 86400000).getTime()
}
run([mid])
eq("半程 fillPx ≈ 72", mid.fillPx, 72)
eq("半程 heroFillPx ≈ 74", mid.heroFillPx, 74)

/* ── 6. 死字段不许复活 ───────────────────────────── */

console.log("\n6. 清理项：phrase / dirWord 不许复活")

eq("decorate 内无 phrase 赋值", /\bphrase\s*=/.test(METHOD), false)
eq("decorate 内无 dirWord 赋值", /\bdirWord\s*=/.test(METHOD), false)
eq("模板不再渲染 phrase", /\{\{\s*\w*\.?phrase\s*\}\}/.test(SRC), false)
eq("模板不再渲染 dirWord", /\{\{\s*\w*\.?dirWord\s*\}\}/.test(SRC), false)

/* ── 7. 装饰字段该有的都有 ───────────────────────── */

console.log("\n7. 装饰字段完整性")

var one = run([item(100)])[0]
;["lsBg", "cardBg", "cardBorder", "numText", "unitText", "heroUnit", "numSize",
  "daysColor", "barBg", "fillPx", "heroFillPx", "status", "isToday"].forEach(function(k) {
  truthy("字段 " + k + " 已赋值", one[k] !== undefined && one[k] !== "")
})

/* ── 结果 ───────────────────────────────────────── */

console.log("\n" + (fail === 0
  ? "\x1b[32m全部通过\x1b[0m " + pass + " 项"
  : "\x1b[31m失败 " + fail + " 项\x1b[0m / 通过 " + pass + " 项"))
process.exit(fail === 0 ? 0 : 1)
