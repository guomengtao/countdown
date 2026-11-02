# 命令行最快装 rpk 到手环（AstroBox 投喂法）

日期：2026-11-02　实测机型：Xiaomi Smart Band 9（B885，BLE 已连 Mac）

## 结论先行

**一条命令就够，不用点任何按钮：**

```bash
open -a "/Applications/AstroBox 2.app" /path/to/xxx.rpk
```

等价写法（按 bundle id，App 改名也不怕）：

```bash
open -b com.astralsight.astrobox /path/to/xxx.rpk
```

实测时间线：敲命令 → AstroBox 自动弹出并进「安装队列」显示「安装到小米 Smart Band 9 B885 · 执行中」
→ 约 20 秒队列清空，底部留「历史记录 1」一条＝这一单结束。

## 为什么它能「自动进」

AstroBox 的 Info.plist 里注册了 rpk 文档类型，并且把角色设成 **Editor**：

```
CFBundleDocumentTypes: { CFBundleTypeName = rpk; CFBundleTypeExtensions = (rpk); CFBundleTypeRole = Editor }
UTExportedTypeDeclarations: UTTypeIdentifier = moe.astralsight.astrobox.rpk（conforms to public.zip-archive）
```

所以「用 AstroBox 打开一个 .rpk」＝App 收到一个 open-documents 事件，
它的处理逻辑就是**直接入队并安装到当前已连设备**，不需要再选设备、不用点「安装」。

## 前置条件（缺一条就白跑）

1. **AstroBox 必须已经在运行**（App 没起也能被 `open` 拉起，但蓝牙连接要等它自己连上）。
2. **手环通过蓝牙连着 Mac**，且 AstroBox 左侧已显示「已连接 + 电量」。
   自查：`system_profiler SPBluetoothDataType | grep -A3 "Smart Band"`
3. 手环要处于**上电、非睡眠、屏幕能亮**的状态（安装时会提示确认/自动执行）。
4. 文件最好用**纯 ASCII 文件名**，放到 `/tmp` 或 `~/Downloads` 都行：
   `cp dist/xxx.rpk /tmp/cd099.rpk`。中文名不是不行，但一旦要退回到图形界面点文件，
   中文名在文件面板里更容易点错。

## 反例：这些路都更慢

| 做法 | 实际耗时 | 问题 |
|---|---|---|
| **`open -a` 投喂** ✅ | 命令 ~0.2s + 安装 ~20s | 无交互，可脚本化 |
| App 内「+」→ 文件选择器 → 选文件 → Open | 手点 5~8 步 + 安装 20s | 文件面板是独立 XPC 进程，`前往文件夹` 那层收不到键盘事件 |
| `adb` / `vela push` | 不适用 | 那是往**模拟器**装，真机走蓝牙，ADB 碰不到 |
| 官方 IDE 同步 | 分钟级 | 要开 IDE、连真机调试通道 |

## 踩过的坑（都是为了不再重犯）

1. **窗口被拖到屏幕外**：AX 报 position=(1388,-954)，屏幕只有 1440×900 宽，窗口整块在屏幕右侧外，
   看着像「App 没反应」。修法：
   ```bash
   osascript -e 'tell application "System Events" to tell process "AstroBox" to set position of window 1 to {20, 30}'
   ```
   顺手把 size 设成 `{1000, 620}`，再 `set value of attribute "AXMinimized" of window 1 to true` → `false`
   可以把它从别的 Space 拉到当前桌面。
2. **Retina 坐标换算**：截图是 2880×1800（物理像素），真实点坐标 = 像素 ÷ 2；
   而很多看图工具会把图再缩到 1080 宽显示，此时**点坐标 = 显示坐标 × 1.333**。
   估错这一层，所有点击都会偏到旁边窗口（实测把点击甩到了 Chrome 上）。
3. **文件面板不接键盘**：macOS 的 open 面板跑在 `com.apple.appkit.xpc.openAndSavePanelService`
   里，`System Events` 的 keystroke 不一定进得去；能不用就不用。
4. **不要等「看起来没反应」就换方案**：先截一张全分辨率图确认窗口在哪、队列里有没有东西，
   再决定下一步——上面第 1 条就是「以为入口无效，其实是窗口在屏幕外」。

## 起名：`ev-install`（别名 `ev-ab` / `ev-rpk`）

这个方案固化成脚本，实体在 **`ev/ev-hooks/workbuddy-scripts/ev-install.sh`**（纳入版本管理，
提交 `c7ac8f0`）；`~/.workbuddy/scripts/` 下 `ev-install` / `ev-ab` / `ev-rpk` 三个绝对路径软链
指向它，与 `ev-claim.sh` 等同一种接法。

**为什么叫 `ev-install`**——`ev-*` 一族现有脚本全是「ev + 动词」：`ev-claim`、`ev-commit`、
`ev-shot`、`ev-morning-cut`、`ev-task-close`。`ev-install` 沿这条线，一眼知道是「装东西」，
以后要装 apk / 固件也能复用同一个入口。其余候选的取舍：

| 候选 | 评价 |
|---|---|
| **`ev-install`** ✅ | 动词族一致，语义直白，可扩展 |
| `ev-ab` | 短、好敲，但 `AB` 容易被误读成 A/B 测试；留作**别名** |
| `ev-rpk` | 名词型，专指性强；留作**别名** |
| `ev-run` | 太泛，和「跑脚本/跑测试」撞 |
| `ev-ast` | 太隐晦，不像中文语境的词 |

三个名字指向同一个脚本（后两个是软链），敲哪个都行。

## 用法

```bash
ev-install                 # 自动取 ./dist 或 ./ 下最新的 .rpk
ev-install path/to/x.rpk   # 指定文件
ev-install -w 25           # 投喂后等 25 秒（默认 0，不等，立即返回）
ev-install -l              # 只列候选 rpk
ev-install -c              # 只做环境自检：App / 进程 / 蓝牙里的手环
```

`ev-install` 帮你做了四件事：找 App（`/Applications/AstroBox 2.app` → `AstroBox.app` →
`~/Applications/*` 依次探测）、把文件复制成 ASCII 名 `/tmp/ev-install.rpk`、用 `open -a`
投喂、打印从文件名解析出的版本号与体积。

自检输出示例（实测）：

```
── 环境自检 ──
✅ AstroBox: /Applications/AstroBox 2.app
✅ AstroBox 进程在跑 (pid 94369)
✅ 蓝牙可见手环：
               Xiaomi Smart Band 9 B885:
                   Address: 04:34:C3:06:B8:85
```

## 不想用脚本时的等价一行

```bash
RPK=dist/com.application.watch.countdown.release.0.0.100.rpk
cp "$RPK" /tmp/cd.rpk && open -a "/Applications/AstroBox 2.app" /tmp/cd.rpk && echo "已投喂，等 20s 看手环"
```
