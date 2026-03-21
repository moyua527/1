# DuiJie（对接）— 客户项目对接平台

> 版本：v1.0.13 | 最后更新：2026-03-21
>
> 线上地址：http://160.202.253.143:8080

---

## 一、项目概述

DuiJie 是一个**客户项目管理与交付对接平台**，用于管理外部客户信息、跟踪项目进度、任务分配、文件交付和团队沟通。支持多角色权限控制、实时消息、移动端自适应、用户自助注册等 CRM 标准功能。

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite 6 |
| 后端 | Node.js + Express 4 |
| 数据库 | MySQL 8.0+（`duijie_db`） |
| 实时通信 | Socket.IO 4 |
| 认证 | JWT（Bearer Token） |
| 图标 | Lucide React |
| 样式 | 纯内联样式（无 CSS 文件、无 Tailwind） |
| 进程管理 | PM2（生产环境） |
| Web 服务器 | Nginx（反向代理） |

### 端口分配

| 服务 | 开发端口 | 生产端口 |
|------|---------|---------|
| 前端开发服务器 | 1300 | — |
| 后端 API 服务器 | 1800 | 1800 |
| Nginx 反向代理 | — | 8080 |

### 仓库与部署

| 项目 | 地址 |
|------|------|
| GitHub | https://github.com/moyua527/1.git |
| 线上环境 | http://160.202.253.143:8080 |
| 服务器 | Ubuntu 24.04 / 160.202.253.143 |

---

## 二、用户角色与权限

| 角色 | 说明 | 权限范围 |
|------|------|----------|
| **admin** | 管理员 | 全部功能，含用户管理、销售漏斗、数据报表、邀请码管理 |
| **member** | 成员 | 项目/客户/任务（仅参与的项目范围内），无销售漏斗 |
| **client** | 客户 | 查看关联项目进度、确认里程碑、下载交付物 |

### 默认账户

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | admin |
| test | test123 | member |
| yonghu | yonghu123 | client |

### 注册邀请码

| 项目 | 值 |
|------|------|
| 默认邀请码 | `duijie2024` |
| 管理入口 | 用户管理页顶部「注册邀请码」卡片 |

---

## 三、功能模块

### 3.1 用户认证与注册

- **登录/注册 Tab 切换**：统一页面，顶部 Tab 切换
- **注册表单**：用户名（字母/数字/下划线，≥3位）+ 昵称（选填）+ 邮箱（选填）+ 手机号（选填）+ 密码（≥6位）+ 确认密码 + 邀请码
- **密码强度指示器**：三级评分（弱/中/强），基于长度+大写+数字+特殊字符
- **邀请码机制**：管理员可在用户管理页开启/关闭/修改邀请码
- **个人资料设置**：侧边栏点击头像 → 弹窗编辑昵称/邮箱/手机号/密码

### 3.2 仪表盘（Dashboard）

- 统计卡片：项目数、客户数、合同总额、任务数、待跟进数
- 销售漏斗（仅 admin）
- 跟进提醒（仅 admin）
- 最近活动（仅 admin）
- 数据报表页面（趋势图表）
- **数据隔离**：member 仅看到关联项目的统计数据

### 3.3 项目管理（Project）

- 项目列表：筛选（状态/客户）、搜索、分页、响应式网格
- 新建项目：名称、描述、客户关联、日期、预算
- 项目详情（Tab 页签，**URL 持久化**）：
  - **概览**：项目信息网格 + 项目成员列表（**点击查看成员详细信息弹窗**）+ 进度条 + 描述
  - **任务**：任务列表 + 内联添加 + 状态切换下拉
  - **里程碑**：创建 + 完成切换
  - **文件**：上传 + 列表 + 下载 + 删除
  - **消息**：实时聊天（Socket.IO）+ 发送者昵称显示
- 项目编辑、软删除

### 3.4 客户管理（Client）

- 客户列表：阶段筛选 Tab（**URL 持久化** + **横向滚动**）+ 搜索 + 客户评分
- 新建客户：渠道、阶段、名称、公司、邮箱、电话、职位级别、部门、工作职能
- CSV 导入/导出
- 客户详情页：
  - 基本信息编辑
  - 联系人管理（CRUD）
  - 合同管理（CRUD）
  - 跟进记录（电话/微信/拜访/邮件）
  - 标签管理
  - 客户评分（A-E 等级）
  - 变更历史日志
  - AI 跟进建议

### 3.5 任务看板（TaskBoard）

- 三列看板：待办 / 进行中 / 已完成
- 拖拽切换状态（HTML5 Drag & Drop）+ 列高亮反馈
- 每列底部内联添加任务表单（标题 + 优先级选择）
- 任务卡片显示：标题、优先级 Badge、截止日期
- 按项目切换视图

### 3.6 文件管理（File）

- 文件上传（multipart/form-data，限制 50MB）
- 文件列表（按项目）
- 文件下载、文件删除（软删除）

### 3.7 消息沟通（Message）

- 项目内实时消息（Socket.IO）
- 消息气泡 + 发送者头像/昵称
- 连接状态指示灯
- Enter 发送、Shift+Enter 换行

### 3.8 用户管理（User，仅 admin）

- 用户列表 + 创建/编辑/删除
- **注册邀请码管理卡片**：查看（眼睛图标显示/隐藏）+ 复制 + 修改 + 关闭邀请码

### 3.9 数据报表（Report）

- 数据趋势图表
- 仅 admin/member 可见

### 3.10 移动端适配

- **响应式布局**：侧边栏 → 抽屉式（overlay + 遮罩 + 自动收起）
- **自适应网格**：客户/项目卡片根据屏幕宽度自动调整列数
- **弹窗适配**：Modal 最大宽度 `calc(100vw - 24px)`
- **横向滚动**：客户阶段 Tab、任务看板列
- **内容间距**：移动端自动缩小 padding
- **自定义 Hook**：`useIsMobile(breakpoint=768)` 检测移动端

---

## 四、API 接口清单

所有接口前缀：`/api`，通过 Bearer Token 携带 JWT 认证。

### 4.1 认证（Auth）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/auth/login` | 登录 | 公开 |
| POST | `/api/auth/register` | 注册（支持邀请码） | 公开 |
| GET | `/api/auth/register-config` | 注册配置（是否需要邀请码） | 公开 |
| POST | `/api/auth/logout` | 登出 | 公开 |
| GET | `/api/auth/me` | 当前用户信息 | 认证 |
| PUT | `/api/auth/profile` | 更新个人资料 | 认证 |

### 4.2 系统配置（System）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/system/invite-code` | 获取邀请码 | 认证 |
| PUT | `/api/system/invite-code` | 修改邀请码 | 认证 |

### 4.3 仪表盘（Dashboard）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/dashboard/stats` | 统计数据 | 认证 |
| GET | `/api/dashboard/report` | 报表数据 | 认证 |

### 4.4 项目管理（Project）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/projects` | 创建项目 | 认证 |
| GET | `/api/projects` | 项目列表 | 认证 |
| GET | `/api/projects/:id` | 项目详情（含成员） | 认证 |
| PUT | `/api/projects/:id` | 更新项目 | 认证 |
| DELETE | `/api/projects/:id` | 删除项目 | 认证 |

### 4.5 客户管理（Client）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/clients` | 创建客户 | staff |
| GET | `/api/clients` | 客户列表 | staff |
| GET | `/api/clients/:id` | 客户详情 | staff |
| PUT | `/api/clients/:id` | 更新客户 | staff |
| DELETE | `/api/clients/:id` | 删除客户 | staff |
| POST | `/api/clients/import` | 批量导入 | staff |
| GET | `/api/clients/:id/logs` | 变更日志 | staff |
| GET | `/api/clients/:id/score` | 客户评分 | staff |
| GET | `/api/client-scores` | 全部评分 | staff |

### 4.6 联系人（Contact）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/contacts` | 创建联系人 | staff |
| GET | `/api/clients/:clientId/contacts` | 联系人列表 | staff |
| PUT | `/api/contacts/:id` | 更新联系人 | staff |
| DELETE | `/api/contacts/:id` | 删除联系人 | staff |

### 4.7 合同（Contract）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/contracts` | 创建合同 | staff |
| GET | `/api/clients/:clientId/contracts` | 合同列表 | staff |
| PUT | `/api/contracts/:id` | 更新合同 | staff |
| DELETE | `/api/contracts/:id` | 删除合同 | staff |

### 4.8 跟进记录（Follow-up）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/follow-ups` | 创建跟进 | staff |
| GET | `/api/clients/:clientId/follow-ups` | 跟进列表 | staff |

### 4.9 标签（Tag）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/tags` | 创建标签 | staff |
| GET | `/api/tags` | 标签列表 | staff |
| DELETE | `/api/tags/:id` | 删除标签 | staff |
| GET | `/api/clients/:clientId/tags` | 客户标签 | staff |
| PUT | `/api/clients/:clientId/tags` | 设置客户标签 | staff |

### 4.10 任务管理（Task）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/tasks` | 创建任务 | staff |
| GET | `/api/tasks` | 任务列表 | staff |
| PUT | `/api/tasks/:id` | 更新任务 | staff |
| PATCH | `/api/tasks/:id/move` | 移动状态 | staff |

### 4.11 里程碑（Milestone）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/milestones` | 创建里程碑 | 认证 |
| GET | `/api/milestones` | 里程碑列表 | 认证 |
| PATCH | `/api/milestones/:id/toggle` | 切换完成 | 认证 |

### 4.12 文件（File）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/files/upload` | 上传文件 | 认证 |
| GET | `/api/files` | 文件列表 | 认证 |
| DELETE | `/api/files/:id` | 删除文件 | 认证 |
| GET | `/api/files/:id/download` | 下载文件 | 认证 |

### 4.13 消息（Message）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/messages` | 发送消息 | 认证 |
| GET | `/api/messages` | 消息列表 | 认证 |

### 4.14 AI 建议

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/clients/:clientId/ai-suggestion` | AI 跟进建议 | staff |

### 4.15 用户管理（User）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/users` | 用户列表 | admin |
| POST | `/api/users` | 创建用户 | admin |
| PUT | `/api/users/:id` | 更新用户 | admin |
| DELETE | `/api/users/:id` | 删除用户 | admin |

---

## 五、数据库表结构

数据库：`duijie_db`，共 15 张表。

| 表名 | 说明 |
|------|------|
| `voice_users` | 用户表（id, username, password, nickname, email, phone, avatar, role, client_id） |
| `system_config` | 系统配置（JWT_SECRET, INVITE_CODE） |
| `duijie_clients` | 客户表 |
| `duijie_projects` | 项目表 |
| `duijie_tasks` | 任务表 |
| `duijie_milestones` | 里程碑表 |
| `duijie_files` | 文件表 |
| `duijie_messages` | 消息表 |
| `duijie_project_members` | 项目成员关联表 |
| `duijie_contacts` | 联系人表 |
| `duijie_contracts` | 合同表 |
| `duijie_follow_ups` | 跟进记录表 |
| `duijie_tags` | 标签表 |
| `duijie_client_tags` | 客户标签关联表 |
| `duijie_client_logs` | 客户变更日志表 |

---

## 六、前端路由

| 路径 | 组件 | 说明 | 权限 |
|------|------|------|------|
| `/` | Dashboard | 仪表盘首页 | 认证 |
| `/projects` | ProjectList | 项目列表 | 认证 |
| `/projects/:id` | ProjectDetail | 项目详情（5 Tab） | 认证 |
| `/clients` | ClientList | 客户列表 | staff |
| `/clients/:id` | ClientDetail | 客户详情 | staff |
| `/tasks` | TaskBoard | 任务看板 | staff |
| `/report` | Report | 数据报表 | staff |
| `/users` | UserManagement | 用户管理 + 邀请码管理 | admin |

---

## 七、项目结构

```
DuiJie/
├── DESIGN.md                          # 原始设计文档
├── PROJECT.md                         # 项目文档（本文件）
├── .gitignore
│
├── frontend/duijieReact/              # 前端（React 18 + TS + Vite）
│   ├── index.html                     # 入口 HTML（含 viewport meta）
│   ├── vite.config.ts                 # Vite 配置（host: true 支持局域网）
│   ├── package.json
│   ├── dist/                          # 生产构建产物
│   └── src/
│       ├── App.tsx                    # 路由定义
│       ├── bootstrap.ts              # API 封装 + Token 管理
│       ├── main.tsx                   # 入口
│       └── features/
│           ├── auth/                  # 登录 + 注册（Tab 切换）
│           │   ├── index.tsx          # 登录/注册表单 + 密码强度
│           │   └── services/api.ts    # login, register, registerConfig
│           ├── dashboard/             # 仪表盘
│           │   ├── index.tsx
│           │   └── Report.tsx
│           ├── project/               # 项目管理
│           │   ├── index.tsx
│           │   └── components/ProjectDetail.tsx
│           ├── client/                # 客户管理
│           │   ├── index.tsx
│           │   └── components/ClientDetail.tsx
│           ├── task/                  # 任务看板
│           │   └── index.tsx
│           ├── file/                  # 文件管理
│           │   └── components/FileList.tsx
│           ├── milestone/             # 里程碑
│           │   └── components/MilestoneList.tsx
│           ├── message/               # 消息沟通
│           │   └── components/MessagePanel.tsx
│           ├── user/                  # 用户管理 + 邀请码管理
│           │   └── index.tsx
│           └── ui/                    # 共享 UI 组件
│               ├── Avatar.tsx
│               ├── Badge.tsx
│               ├── Button.tsx
│               ├── ConfirmDialog.tsx
│               ├── Input.tsx
│               ├── Layout.tsx         # 响应式布局（抽屉侧边栏）
│               ├── Modal.tsx          # 响应式弹窗
│               ├── ProgressBar.tsx
│               ├── Toast.tsx
│               └── useIsMobile.ts     # 移动端检测 Hook
│
├── server/duijie/                     # 后端（Express + MySQL）
│   ├── standalone.js                  # 服务入口
│   ├── config/db.js                   # MySQL 连接池
│   ├── .env                           # 环境变量（gitignore）
│   ├── package.json
│   ├── atomic/
│   │   ├── routes/index.js            # 路由映射（57 个端点）
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT 认证中间件
│   │   │   └── roleGuard.js           # 角色权限守卫
│   │   └── controllers/               # 15 个模块
│   │       ├── ai/                    # AI 建议（1）
│   │       ├── auth/                  # 认证（6）：login, register, registerConfig, logout, me, profile
│   │       ├── client/                # 客户（9）
│   │       ├── contact/               # 联系人（4）
│   │       ├── contract/              # 合同（4）
│   │       ├── dashboard/             # 仪表盘（2）
│   │       ├── file/                  # 文件（4）
│   │       ├── followUp/              # 跟进（2）
│   │       ├── message/               # 消息（2）
│   │       ├── milestone/             # 里程碑（3）
│   │       ├── project/               # 项目（5）
│   │       ├── system/                # 系统配置（1）：invite-code get/update
│   │       ├── tag/                   # 标签（4）
│   │       ├── task/                  # 任务（4）
│   │       └── user/                  # 用户（4）
│   ├── socket/index.js                # Socket.IO 实时消息
│   ├── listeners/                     # 事件监听器
│   ├── uploads/                       # 文件上传目录
│   └── scripts/
│       └── full-init.sql              # 数据库完整初始化脚本（含种子数据）
│
└── backups/                           # 数据库备份（gitignore）
```

---

## 八、RBAC 数据隔离

| 角色 | 项目 | 客户 | 任务 | 合同/跟进 | 仪表盘统计 |
|------|------|------|------|----------|-----------|
| admin | 全部 | 全部 | 全部 | 全部 | 全部 + 销售漏斗 |
| member | 创建的 + 参与的 | 关联项目的 | 关联项目的 | 关联项目客户的 | 仅关联数据 |
| client | 关联的 | — | — | — | 仅自己项目 |

---

## 九、生产环境部署架构

```
浏览器  →  Nginx (:8080)
              ├─ /             → 前端静态文件（dist/）
              ├─ /api/         → Node.js 后端 (:1800)
              ├─ /socket.io/   → WebSocket 代理
              └─ /uploads/     → 文件上传代理
                    ↓
              PM2 管理 Node.js 进程（standalone.js）
                    ↓
              MySQL 8.0（duijie_db）
```

### 服务器信息

| 项目 | 值 |
|------|------|
| 系统 | Ubuntu 24.04 LTS |
| IP | 160.202.253.143 |
| Node.js | v20.x |
| MySQL | 8.0.45 |
| 数据库名 | duijie_db |
| 数据库用户 | duijie |
| 进程管理 | PM2（开机自启） |
| Web 服务器 | Nginx → 端口 8080 |
| 后端端口 | 1800（内部） |

### 部署命令（更新部署）

```bash
# SSH 登录
ssh root@160.202.253.143

# 拉取最新代码
cd /opt/duijie && git pull origin main

# 安装依赖（如有变更）
cd server/duijie && npm install --production

# 重建前端（如有变更）
cd /opt/duijie/frontend/duijieReact && npm install && npx vite build

# 重启后端
pm2 restart duijie

# 查看日志
pm2 logs duijie
```

---

## 十、版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0.0 | 2025-01-18 | 初始版本：完整 CRM 功能实现 |
| v1.0.1 | 2025-01-18 | 多会话支持 + 数据库备份脚本 |
| v1.0.2 | 2025-01-19 | 成员仪表盘数据隔离 + 项目详情增强 |
| v1.0.3 | 2025-01-19 | 任务看板创建表单 + 消息发送者名称修复 |
| v1.0.4 | 2025-01-19 | 项目文档 PROJECT.md |
| v1.0.5 | 2025-01-19 | 客户阶段筛选 URL 持久化 |
| v1.0.6 | 2025-01-19 | 项目详情 Tab URL 持久化 |
| v1.0.7 | 2025-01-19 | 项目成员点击查看信息弹窗 |
| v1.0.8 | 2025-01-19 | 个人资料编辑（侧边栏点击 + PUT /api/auth/profile） |
| v1.0.9 | 2025-01-19 | CRM 标准个人资料设置（邮箱/手机号/安全设置） |
| v1.0.10 | 2026-03-21 | 移动端适配：侧边栏抽屉 + Modal 适配 + 网格自适应 + Tab 横向滚动 |
| v1.0.11 | 2026-03-21 | 局域网访问支持（Vite host: true） |
| v1.0.12 | 2026-03-21 | 用户自助注册功能（登录/注册 Tab 切换） |
| v1.0.13 | 2026-03-21 | CRM 标准注册增强：邮箱/手机号/邀请码/密码强度 + 邀请码管理 + 服务器部署 |

---

## 十一、快速启动

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/moyua527/1.git DuiJie && cd DuiJie

# 2. 初始化数据库
mysql -u root < server/duijie/scripts/full-init.sql

# 3. 配置后端环境变量
cat > server/duijie/.env << EOF
PORT=1800
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=duijie_db
EOF

# 4. 启动后端
cd server/duijie && npm install && node standalone.js

# 5. 启动前端（新终端）
cd frontend/duijieReact && npm install && npx vite

# 6. 访问 http://localhost:1300
# 登录：admin / admin123
```

### 手机测试（同一 WiFi）

Vite 已配置 `host: true`，启动后终端会显示局域网 IP 地址，手机浏览器直接访问即可。

---

## 十二、统计数据

| 指标 | 数值 |
|------|------|
| 后端控制器 | 57 个 |
| API 端点 | 57 个 |
| 数据库表 | 15 张 |
| 前端功能模块 | 10 个 |
| 共享 UI 组件 | 10 个 |
| 前端路由 | 8 条 |
| 版本迭代 | 14 个（v1.0.0 ~ v1.0.13） |
