# 倒数日 · 小米手环快应用

把 ev 课程表里的「倒数日」功能拆成独立的小米手环（Xiaomi Vela）快应用，同时用来验证**中文输入法在手环 11 上的可用性**。

- 包名：`com.application.watch.countdown`
- 设备：小米手环 9（192×490）/ 手环 10、11（212×520，胶囊屏）
- 平台：Xiaomi Vela JS 应用（`.ux` 单文件组件）

## 当前状态

| 项 | 情况 |
|---|---|
| 版本 | 见 `src/manifest.json` 的 `versionName`（patch 位持续累加，不进位：0.0.9 → 0.0.10 → 0.0.99） |
| 真机验证 | 手环 11：rect 全键盘可用；pill-shaped 胶囊键盘不显示（排查中） |
| 模拟器 | 212×520（`ctd-cd-a`）、192×490（`ctd-cd-b`），独占前缀 `ctd-*` |

## 页面

| 路由 | 作用 | 输入法形态 |
|---|---|---|
| `pages/index` | 首页：显示昵称、科目，三个入口 | — |
| `pages/pill` | 设置科目 | `pill-shaped` 胶囊键盘，立即挂载 |
| `pages/nickname` | 设置昵称 | `rect` 方键，延迟 300ms 挂载 |
| `pages/diag` | 诊断信息：版本、机型、屏宽高、词库读取结果 | — |
| `pages/exp` | 七形态实验页（不暴露入口，仅排障用） | 全部 |

## 开发

```bash
npm install
node scripts/bump-version.js      # patch +1，同步 versionCode
npx aiot release --enable-jsc     # 产物在 dist/*.rpk
```

签名需要 `sign/private.pem` 与 `sign/certificate.pem`，两个文件不入库，缺失时会报 `certification path` 错误。

## 目录

```
src/
  manifest.json          单一版本事实源
  app.ux
  pages/                 见上表
  components/InputMethod/ 官方 NEORUAA/Vela_input_method，未做任何修改
  common/icons/          lucide 转出的 PNG 图标（页头返回箭头等）
  assets/dict-lite/      精简词库
scripts/bump-version.js
docs/                    方案、测试说明、规范、真机收获
screenshots/             模拟器截图（带壳）与对比图
```

## 文档索引

- `docs/图标规范-20261101.md` — 图标尺寸口径与本次改版
- `docs/页头返回按钮规范-20261101.md` — 居中返回按钮的几何与图标做法
- `docs/测试说明-v0.0.80.md` — 真机测试步骤与判读规则
- `docs/手环11真机测试收获-20261101.md` — 真机实测结论
- `docs/输入法组件版本核查-20261101.md` — 官方组件版本与改动核对
- `docs/模拟器占用登记.md` — 模拟器实例归属，避免抢别人的

## 输入法组件

上游 [NEORUAA/Vela_input_method](https://github.com/NEORUAA/Vela_input_method)（MIT），本仓库 `src/components/InputMethod/` 与上游完全一致，**不要改动**。已知上游 issue：重装后第二次进入键盘页必崩（`$watch` 绑定函数泄漏）。
