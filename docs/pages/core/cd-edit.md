# 添加/编辑倒数日

> 新建与修改同一个页面，靠 `cd_edit_id` 是否为空区分。承载名称、模式、日期、颜色、首页显示五项设置。
> 实现：`src/pages/cd-edit/cd-edit.ux`（1032 行，全应用最大页）

## 1. 页面职责

| 职责 | 说明 |
|---|---|
| 新建 | `cd_edit_id` 为空 → 空表单，保存时新增一条 |
| 编辑 | `cd_edit_id` 有值 → `loadItem()` 回填，保存时覆写原条目 |
| 名称 | 不自建输入框，跳 `cd-name` 用九宫格输入，回传写 `cd_edit_name` |
| 模式 | 倒数（`down`）/ 正计时（`up`），决定天数计算方向 |
| 日期 | 公历 / 农历两套日历，农历走年月日三个独立 picker |
| 颜色与显示 | `pickColor()` 选色、首页显示开关 |

## 2. 路由与入口

| 项 | 值 |
|---|---|
| 路由 | `pages/cd-edit` |
| 文件 | `src/pages/cd-edit/cd-edit.ux` |
| 入参 | `cd_edit_id`（storage）：空 = 新建，有值 = 编辑 |
| 上游 | `cd-list` 的「＋添加」`startAdd()` 与条目点击 `openForm()` |
| 下游 | `cd-name`（名称输入） |

## 3. 页面结构

```
scroll (page, scroll-y)
├── 名称行      name-row → openInputPage()
├── 错误提示    err-text（errMsg 非空才显示）
├── 模式行      cal-toggle → toggleMode()      文案：倒数 / 正计时，带 ⇄
├── 日期行
│   ├── cal-toggle → toggleCalendar()          文案：公历 / 农历，带 ⇄
│   ├── picker × 3（年 / 月 / 日，picker-unit 标注单位）
│   └── 农历模式下月份候选取自农历月表（`lunarMonthIdx`）
├── 颜色行      pickColor()
├── 首页显示    开关
└── 保存按钮
```

日期候选由 `buildYearStrs()` / `buildMonthStrs()` / `buildDayStrs()` 生成，切换年月后 `clampDay()` 收敛日期，避免出现 2 月 30 日。

## 4. 数据与存储

| key | 类型 | 说明 |
|---|---|---|
| `cd_edit_id` | string \| '' | 编辑目标，空串代表新建 |
| `cd_edit_name` | string | 名称输入页回传的暂存值，`drainName()` 消费后清空 |
| 条目字段 | — | `mode`（`down`/`up`）、目标日期、`color`、首页显示开关 |

数据流：`cd-name` 保存 → 写 `cd_edit_name` → 返回本页 → `onShow` 调 `drainName()` 取值并清键。**用完即清**是为了让「取消输入」不污染下次编辑。

## 5. 交互规则

| 手势 | 位置 | 行为 |
|---|---|---|
| 点击 | 名称行 | 跳 `cd-name`，把当前名称带过去 |
| 点击 | 模式行 | `toggleMode()`：`down` ⇄ `up`，文案同步 |
| 点击 | 日历行 | `toggleCalendar()`：公历 ⇄ 农历，picker 候选随之重建 |
| 滑动 | 三个 picker | `onYearChange` / `onMonthChange` / `onDayChange` → `refreshDate()` |
| 点击 | 色块 | `pickColor()` → `applyColor()` 即时预览 |
| 点击 | 保存 | 校验名称非空 → 写列表 → 返回上一页 |

## 6. 状态与边界

| 状态 | 表现 |
|---|---|
| 名称为空 | 保存被拦，`errMsg` 提示，不落库 |
| 新条目默认 | 模式 `倒数`、日历 `公历`、日期为今天 |
| 农历闰月 | `clampLunarMonth()` 处理，闰月不存在的年份自动落到合法月 |
| 月末切换 | 31 日切到 2 月 → `clampDay()` 收敛到 28/29 |
| 颜色 | 与主题强调色独立，条目色优先于主题色渲染 |
| 编辑回填 | 保存时以 `cd_edit_id` 定位覆写，不产生重复条目 |

## 7. 平台约束（Vela 手环）

1. 全页包 `<scroll>`：字段多，192×490 下必然超一屏。
2. **不使用 `<input>`**：手环无软键盘，文本一律走 `cd-name` 的九宫格输入页。
3. `picker` 是系统组件，样式可定制范围有限，高度与字号跟随 `loadLayout()` 换算。
4. 三个 picker 横排而非堆叠，依赖窄屏压缩后的列宽，改动时需在 192 与 212 两种宽度下同验。

## 8. 验收要点

- [ ] 新建一条，名称、日期、颜色、显示开关全部保存成功
- [ ] 再次进入同一条，五个字段全部正确回填
- [ ] 模式切到正计时后，列表天数显示方向相反
- [ ] 日历切到农历，月份候选变为农历月名，保存后列表日期正确
- [ ] 1 月 31 日切到 2 月，日期自动收敛且不报错
- [ ] 名称留空点保存，出现错误提示且不落库
- [ ] 从名称页按返回（不保存），原名称不被清空
