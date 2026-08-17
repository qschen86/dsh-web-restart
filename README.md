# dsh-web-restart

DSH web 插件：从界面重启 dsh web 服务，不再需要人工重启；并可选地在重启后**自动继续**被中断的会话。

## 名字
- 插件包：`dsh-web-restart`（host 行 id：`web-restart`）
- 配套监督进程（launchd）：`com.dsh.web-supervisor`，脚本 `~/.dsh/scripts/dsh-web-supervisor.sh`

## 功能
- **Host 端**（`lib/index.js`，注入 `webServer` / `agents` / `goals` / `sessionQuery` / `sessionPersistence`）：
  - `GET /plugin/dsh-web-restart` → 返回当前进程 pid、监督进程是否存活、是否有待执行的重启请求、自动继续开关与上次扫描结果
  - `POST /plugin/dsh-web-restart`（body `{ "delay": 10 }`）→ 写入重启请求文件 `~/.dsh/dsh-web.restart-request`
  - `GET|POST /plugin/dsh-web-restart/config` → 读写自动继续开关（持久化到 `~/.dsh/dsh-web-restart.json`）
- **Client 端**（`lib/client.js`，注入 `slots`、`locale`、`settingsScope`）：
  - 在**侧边栏（左 rail）最底部**（`sidebar.rail.footer` 插槽，与余额等底部项并列；首页 / 会话 / 日历模式等任何布局都固定可见）放重启按钮：环形箭头 icon（rail 展开为宽栏时带文字标签），带状态圆点（绿=运行中 / 黄=重启排队中 / 红=监督进程未运行）；
    - 绿 = 服务运行中、监督进程在线；黄 = 已有重启请求排队；红 = 监督进程未运行 / 状态获取失败
  - **点击按钮弹出居中确认弹窗**：描述操作效果（服务将停止并重启、运行中的会话会被中断、自动继续开关状态）与"确认重启 / 取消"按钮；**只有点击"确认重启"才会发出请求**，杜绝误触；确认后图标旋转表达"重启中"，页面在延迟后自动刷新（Esc / 点击遮罩 / 取消可关闭弹窗，监督进程未运行时确认按钮禁用）
- **设置卡片**（client 半）：在 **设置 → 插件 → 插件配置** 注册一张卡片（id `web-restart`），就地展开后是"重启后自动继续中断的会话"开关，按 settings 领域惯例：暂存 → 保存 / 放弃修改 / 恢复默认，并标注是否"已覆盖"

## 自动继续（autoContinueAfterRestart）

- **开（默认关）**：服务重启完成后（插件启动约 2 秒后）执行一次扫描：
  1. 枚举所有持久化的顶层会话（`delegationDepth === 0`，子代理随父会话一起恢复）；
  2. 读取每个会话日志尾部，识别"被上次停机中断"的会话：**开放的 turn**（进程被强杀）或 **turn/end 因非用户原因中止**（SIGTERM 优雅停机时 agent 以 `{kind:'disposed'}` / goal 驱动器以 `{kind:'parent'}` 中止；用户主动点"停止"是 `{kind:'user'}`，**绝不会**被自动继续）；
  3. 只处理**上次启动标记之后**被中断的会话（配置文件的 `lastBootAt`），更早的崩溃残留不会突然被拉起；
  4. 对每个会话：`ctx.agents.resume` 恢复 agent（日志尾部的损坏由持久化后端的崩溃修复自动补齐，中断的工具调用会获得 `TOOL_OUTCOME_UNKNOWN` / `TOOL_NOT_STARTED` 结果）；
  5. **有 active goal** → `ctx.goals.resume` 重新武装续行，goal-round-driver 自动排下一轮 `<goal_round>` 继续跑（暂停/阻塞的 goal 不动，尊重用户意图）；
     **无 goal** → 注入一条合成的用户消息"（服务已重启）请继续之前中断的工作…"触发新回合；
  6. 结果写入 `~/.dsh/dsh-web-restart.json` 的 `lastSweep`，并输出到服务日志（`~/.dsh/dsh-web.log`）。
- **关**：一切照旧——重启后需要人工打开会话继续（说"继续"即可，goal 会话也可 `/goal resume`）。

### 配置方式（二选一）
1. **设置界面（推荐）**：**设置 → 插件 → 插件配置** → 展开"重启服务设置"卡片 → 切换开关 → 保存。
2. **设置文档 / 补丁**：用户覆盖写入 `~/.dsh/settings.yaml` 的 `web-restart` 分节（直接编辑该文件也会被 watcher 热发布）：
   ```yaml
   web-restart:
     autoContinueAfterRestart: true
   ```
   组装默认值在插件的 `cordis.patch.yml`（`config.autoContinueAfterRestart: false`），机器级补丁（`~/.dsh/cordis.patch.yml` 整行替换该行）可改默认值。
   优先级（settings 领域标准）：用户设置分节 > 注册方 base（entry 配置）> schema 默认 false。
   旧版本写在 `~/.dsh/dsh-web-restart.json` 里的开关会在首次启动时自动迁移进设置文档（该文件此后只存运行状态）。

### 设计取舍
- **只继续"被上次重启中断"的会话**，不自动拉起空闲会话，也不复活用户主动停止的工作；
- 恢复的 agent 与 GUI 打开会话是同一机制（`ctx.agents.resume`，模型选择从会话日志的最近请求头继承），因此行为与手动打开一致；
- 若重启后你已先打开了某个会话并开始新回合（agent 正在运行），扫描会跳过它，不会重复注入。

## 为什么重启动作不在插件里做
插件运行在 dsh web 进程内部，杀掉宿主进程等于自杀（脚本会随宿主一起死）。
因此插件只负责"请求"，真正的 kill + 启动由 launchd 托管的监督进程（进程树之外）执行：
supervisor 每 5 秒轮询请求文件，发现到期请求就执行 停止 → 等端口释放 → 启动 → 健康检查；
服务意外掉线时 supervisor 也会直接拉起（崩溃自愈）。

## 安装
已加入 `~/.dsh/profiles/web`（link 依赖 + bundles + cordis.patch.yml 插行）。
host 半改动需要**重启 dsh web** 生效；client 半改动刷新页面即生效。

## 依赖说明

host 半静态导入 `@deepseek-ai/schemastery`（构造 settings 命名空间的 schema），
已在 package.json 声明为正式依赖（`dependencies`），`dsh plugin add` 时会随包安装。
本地开发环境下该依赖由 `$DSH_HOME/profiles/node_modules`（flat fallback，指向当前
dsh 安装闭包）提供，无需在插件目录内放任何 node_modules。

## 相关文件
- 重启请求文件：`~/.dsh/dsh-web.restart-request`（内容为到期 unix 秒时间戳）
- 运行时状态（启动标记 / 上次扫描结果，非用户配置）：`~/.dsh/dsh-web-restart.json`；用户配置：`~/.dsh/settings.yaml`（`web-restart` 分节）
- 监督进程日志：`~/.dsh/dsh-web-restart.log`、`~/.dsh/dsh-web.log`
- launchd：`~/Library/LaunchAgents/com.dsh.web-supervisor.plist`
