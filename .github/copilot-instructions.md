# AI 交互强制指令

## 🔴 强制规则（最高优先级）

**每次会话开始时，或当用户发送任何消息时，必须立即执行以下操作：**

1. 先搜索名为 interactive_feedback 的 MCP 工具（使用 tool_search 或直接调用）
2. 调用 `mcp_mcp-ai-foreve_interactive_feedback` 工具，参数如下：
   - `project_directory`: 当前工作目录
   - `summary`: 简要说明当前状态和等待用户指令
   - `timeout`: 10000（默认10000秒，约2.8小时）
3. 收到用户反馈后，执行用户请求的任务
4. 任务完成后，**再次调用** `mcp_mcp-ai-foreve_interactive_feedback` 工具汇报结果并等待下一条指令
5. 重复步骤3-4，形成无限循环，永不停止

**关键要求：**
- 永远不要在没有调用 interactive_feedback 的情况下结束对话
- 每次任务完成后都必须重新启动 interactive_feedback 等待新指令
- 如果 interactive_feedback 超时，立即重新调用它
- summary 参数中应包含：已完成的操作摘要 + "请在交互窗口输入下一条指令"
- 如果找不到这个工具，先使用 tool_search_tool_regex 搜索 "interactive_feedback" 加载它

## 启动指令

当用户输入以下任何内容时，立即启动上述无限交互循环：
- "启动交互" / "开始交互" / "启动AI" / "开始"
- "和AI交互" / "AI交互" / "交互"
- "启动无限工具" / "无限交互"
- "打开交互" / "开始工作"
- 或任何包含"交互"、"启动"关键字的指令
- 或任何消息（收到任何消息都应该触发交互循环）

## 重要提醒

你必须使用 MCP 工具 mcp_mcp-ai-foreve_interactive_feedback 与用户交互。
不要只在 VS Code 聊天中回复，必须通过 interactive_feedback 工具发送回复。
这是一个无限循环：接收指令 → 执行 → 通过 interactive_feedback 汇报 → 等待新指令。

---

## 📋 项目约定（DuiJie 平台）

### 技术栈
- **前端**: React 18 + TypeScript + Vite 6 + Zustand + Socket.IO + Capacitor
- **后端**: Node.js + Express 4 + MySQL 8 (`duijie_db`) + JWT + Socket.IO
- **端口**: 前端开发 1300, 后端 1800, Nginx 8080
- **服务器**: root@160.202.253.143, PM2 进程名 `duijie`

### 编码规范
- 使用中文进行沟通和代码注释
- CSS 颜色必须使用 CSS 变量（`var(--bg-primary)`, `var(--text-body)` 等），禁止硬编码颜色值
- 新增 npm 包需要 `--legacy-peer-deps`（ESLint 对等依赖冲突）
- 前端路由: 仪表盘 `/`, 企业 `/enterprise`, 项目 `/projects`, 客户 `/clients`, 任务 `/tasks`

### 部署流程
1. 前端构建: `cd frontend/duijieReact && npx vite build`
2. 运行部署: `& "C:\Users\CEO\AppData\Local\Programs\Python\Python312\python.exe" -u deploy_update.py`
3. 脚本自动: 上传后端 → npm install → 迁移 → 上传前端 dist → PM2 重启 → 健康检查
4. 注意: 服务器 `/opt/duijie` 不是 Git 仓库，只能 SFTP 部署

### 快捷操作
- PM2 重启（清除速率限制）: `python _restart_pm2.py`
- E2E 测试: `cd frontend/duijieReact && npx playwright test --headed`

### 工作模式
- 用户提出需求后直接实现，无需过多讨论
- 实现后立即部署到生产验证
- 使用深色模式，注意颜色兼容性
