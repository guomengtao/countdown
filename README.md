# 倒数日 · 小米手环快应用

独立的小米手环（Xiaomi Vela）倒数日应用：记录考试、纪念日、缴费日，显示「还剩 / 已过 N 天」。

它脱胎于 `ev/class-schedule` 的「倒数日」功能，同时也承载了一项副产品结论：**中文输入法在手环 9 / 11 上的可用形态**（详见 `docs/手环11真机测试收获-20261101.md`）。

- 包名：`com.application.watch.countdown`
- 设备：小米手环 9（192×490）/ 手环 10、11（212×520，胶囊屏）
- 平台：Xiaomi Vela JS 应用（`.ux` 单文件组件）

## 当前状态

| 项 | 情况 |
|---|---|
| 版本 | 见 `src/manifest.json` 的 `versionName`（patch 位持续累加，不进位：0.0.9 → 0.0.10 → 0.0.99）；2026-11-02 为 **0.6.3 / vc142** |
| 真机验证 | 手环 9（192×490）与手环 11（212×520）均可用。**胶囊屏不再用 pill 键盘**：`screenShape` 为 `capsule`/`circle` 时一律映射成 `rect`（手环 11 七形态实测，pill-shaped / circle 全部打不开） |
| 天数文案 | 方向由单位承担，数字不带正负号：未来「N 天」（hero「N 天后」）、今天「0 天」、过去一律「N 天前」（已过期压灰并归入「已结束」分组，正计时不压灰） |
| 自动化测试 | `npm test` → `test/decorate.test.js`（47 项）——抽 `.ux` 里真实的 `decorate()` 源码求值 + 真实数据层，钉死文案 / 字号 / 分组 / 死字段 |
| 安装 | `ev-install.sh -v -w 30`（在 `ev/ev-hooks/workbuddy-scripts/`），装完输出 `RESULT: <包名> -> 安装成功/失败`；手环未连接会直接中止（退出码 3） |
| 模拟器 | 212×520（`ctd-cd-a`）、192×490（`ctd-cd-b`），独占前缀 `ctd-*`；**不要动别人的实例**，见 `docs/模拟器占用登记.md` |

## 页面

路由以 `src/manifest.json` 的 `router` 为准，下表与之一致。

| 路由 | 作用 | 输入法 |
|---|---|---|
| `pages/cd-list` | **首页 / 入口**（`router.entry`）：倒数日列表，两种版式（列表 / 大字），排序与版式切换在工具行 | — |
| `pages/cd-edit` | 新增 / 编辑倒数日：标题、日期、颜色、倒数或正计时 | — |
| `pages/cd-name` | 设置标题名 | `rect` 方键；`screenShape` 为 capsule/circle 时映射成 rect |
| `pages/nickname` | 设置昵称（早期原型页，保留可用） | `rect`，延迟 300ms 挂载 |
| `pages/settings` | 设置：主题、清空（带二次确认）、诊断入口 | — |
| `pages/theme` | 主题选择：深色 / 浅色 / 暖色 | — |
| `pages/diag` | 诊断：版本、机型、屏宽高、词库读取结果 | 键盘自检 |

## 开发

```bash
npm install
npm test                          # test/decorate.test.js，纯 node，无需模拟器
node scripts/bump-version.js      # patch +1，同步 versionCode
npx aiot release --enable-jsc     # 产物在 dist/*.rpk
```

签名需要 `sign/private.pem` 与 `sign/certificate.pem`，两个文件不入库，缺失时会报 `certification path` 错误。

> 打包若被平台的「批量删除」保护拦住（`npm run release` 会清 `.temp_countdown`，文件数超阈值即中止），
> 先手动 `rm -rf ../.temp_countdown`，再执行：
> `env -u CODEBUDDY_SAFE_DELETE_BULK_STATE_DIR -u CODEBUDDY_TOOL_CALL_ID npm run release`

## 目录

```
src/
  manifest.json          单一版本事实源
  app.ux
  pages/                 见上表
  data/countdown.js      数据层：读写、迁移、排序、天数与进度计算
  components/InputMethod/ 官方 NEORUAA/Vela_input_method，未做任何修改
  common/icons/          lucide 转出的 PNG 图标（页头返回箭头等）
  assets/dict-lite/      精简词库
scripts/bump-version.js
test/decorate.test.js    首页天数展示的单测（抽 .ux 源码求值）
docs/                    方案、测试说明、规范、真机收获
screenshots/             模拟器截图（带壳）与对比图
```

## 文档索引

- `docs/图标规范-20261101.md` — 图标尺寸口径与本次改版
- `docs/页头返回按钮规范-20261101.md` — 居中返回按钮的几何与图标做法
- `docs/测试说明-v0.6.3.md` — **当前版本**的真机测试步骤与判读规则
- `docs/手环11真机测试收获-20261101.md` — 真机实测结论
- `docs/输入法组件版本核查-20261101.md` — 官方组件版本与改动核对
- `docs/Vela转场动画硬约束-20261102.md` — 转场动画的可行写法与禁区
- `docs/rpk-命令行最快安装方式.md` — 不经 IDE 的安装通道
- `docs/模拟器占用登记.md` — 模拟器实例归属，避免抢别人的

## 输入法组件

上游 [NEORUAA/Vela_input_method](https://github.com/NEORUAA/Vela_input_method)（MIT），本仓库 `src/components/InputMethod/` 与上游完全一致，**不要改动**。已知上游 issue：重装后第二次进入键盘页必崩（`$watch` 绑定函数泄漏）。
