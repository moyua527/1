# DuiJie（对接）— 客户项目对接平台

> 版本：v1.0.3 | 最后更新：2025-01-19

---

## 一、项目概述

DuiJie 是一个**客户项目管理与交付对接平台**，用于管理外部客户信息、跟踪项目进度、任务分配、文件交付和团队沟通。

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite |
| 后端 | Node.js + Express |
| 数据库 | MySQL 8.0+（`voice_room_db`） |
| 实时通信 | Socket.IO |
| 认证 | JWT（Bearer Token + httpOnly Cookie） |
| 图标 | Lucide React |
| 样式 | 纯内联样式（无CSS文件、无Tailwind） |

### 端口分配

| 服务 | 端口 |
|------|------|
| 前端开发服务器 | 1300 |
| 后端 API 服务器 | 1800 |

### 仓库地址

- GitHub：https://github.com/moyua527/1.git

---

## 二、用户角色与权限

| 角色 | 说明 | 权限范围 |
|------|------|----------|
| **admin** | 管理员 | 全部功能，含用户管理、销售漏斗、数据报表 |
| **member** | 成员 | 项目/客户/任务（仅参与的项目范围内），无销售漏斗 |
| **client** | 客户（后期） | 查看项目进度、确认里程碑、下载交付物 |

### 默认账户

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | admin |
| test | test123 | member |
| yonghu | yonghu123 | member |

---

## 三、功能模块

### 3.1 仪表盘（Dashboard）

- 统计卡片：项目数、客户数、合同总额、任务数、待跟进数
- 销售漏斗（仅 admin）
- 跟进提醒（仅 admin）
- 最近活动（仅 admin）
- 数据报表页面（趋势图表）

### 3.2 项目管理（Project）

- 项目列表：筛选（状态/客户）、搜索、分页
- 新建项目：名称、描述、客户关联、日期、预算
- 项目详情（Tab 页签）：
  - **概览**：项目信息网格（状态/客户/开始日期/结束日期/预算/创建时间/任务数）+ 项目成员列表（角色标识）+ 进度条 + 描述
  - **任务**：任务列表 + 内联添加 + 状态切换下拉
  - **里程碑**：创建 + 完成切换
  - **文件**：上传 + 列表 + 下载 + 删除
  - **消息**：实时聊天（Socket.IO）+ 发送者昵称显示
- 项目编辑、软删除

### 3.3 客户管理（Client）

- 客户列表：阶段筛选 Tab（潜在/意向/签约/合作中/流失）+ 搜索 + 客户评分
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

### 3.4 任务看板（TaskBoard）

- 三列看板：待办 / 进行中 / 已完成
- 拖拽切换状态（HTML5 Drag & Drop）
- 拖拽时列高亮反馈
- 每列底部内联添加任务表单（标题 + 优先级选择）
- 任务卡片显示：标题、优先级 Badge、截止日期
- 按项目切换视图

### 3.5 文件管理（File）

- 文件上传（multipart/form-data，限制 50MB）
- 文件列表（按项目）
- 文件下载
- 文件删除（软删除）

### 3.6 消息沟通（Message）

- 项目内实时消息（Socket.IO）
- 消息气泡 + 发送者头像/昵称
- 连接状态指示灯
- Enter 发送、Shift+Enter 换行

### 3.7 用户管理（User，仅 admin）

- 用户列表
- 创建用户（用户名、密码、昵称、角色）
- 编辑用户
- 删除用户

### 3.8 数据报表（Report）

- 数据趋势图表
- 仅 admin/member 可见

---

## 四、API 接口清单

所有接口前缀：`/api`，通过 Bearer Token 或 Cookie 携带 JWT 认证。

### 4.1 认证（Auth）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/auth/login` | 登录 | 公开 |
| POST | `/api/auth/logout` | 登出 | 公开 |
| GET | `/api/auth/me` | 当前用户 | 认证 |

### 4.2 仪表盘（Dashboard）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/dashboard/stats` | 统计数据 | 认证 |
| GET | `/api/dashboard/report` | 报表数据 | 认证 |

### 4.3 项目管理（Project）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/projects` | 创建项目 | 认证 |
| GET | `/api/projects` | 项目列表 | 认证 |
| GET | `/api/projects/:id` | 项目详情（含成员） | 认证 |
| PUT | `/api/projects/:id` | 更新项目 | 认证 |
| DELETE | `/api/projects/:id` | 删除项目 | 认证 |

### 4.4 客户管理（Client）

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

### 4.5 联系人（Contact）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/contacts` | 创建联系人 | staff |
| GET | `/api/clients/:clientId/contacts` | 联系人列表 | staff |
| PUT | `/api/contacts/:id` | 更新联系人 | staff |
| DELETE | `/api/contacts/:id` | 删除联系人 | staff |

### 4.6 合同（Contract）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/contracts` | 创建合同 | staff |
| GET | `/api/clients/:clientId/contracts` | 合同列表 | staff |
| PUT | `/api/contracts/:id` | 更新合同 | staff |
| DELETE | `/api/contracts/:id` | 删除合同 | staff |

### 4.7 跟进记录（Follow-up）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/follow-ups` | 创建跟进 | staff |
| GET | `/api/clients/:clientId/follow-ups` | 跟进列表 | staff |

### 4.8 标签（Tag）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/tags` | 创建标签 | staff |
| GET | `/api/tags` | 标签列表 | staff |
| DELETE | `/api/tags/:id` | 删除标签 | staff |
| GET | `/api/clients/:clientId/tags` | 客户标签 | staff |
| PUT | `/api/clients/:clientId/tags` | 设置客户标签 | staff |

### 4.9 任务管理（Task）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/tasks` | 创建任务 | staff |
| GET | `/api/tasks` | 任务列表 | staff |
| PUT | `/api/tasks/:id` | 更新任务 | staff |
| PATCH | `/api/tasks/:id/move` | 移动状态 | staff |

### 4.10 里程碑（Milestone）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/milestones` | 创建里程碑 | 认证 |
| GET | `/api/milestones` | 里程碑列表 | 认证 |
| PATCH | `/api/milestones/:id/toggle` | 切换完成 | 认证 |

### 4.11 文件（File）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/files/upload` | 上传文件 | 认证 |
| GET | `/api/files` | 文件列表 | 认证 |
| DELETE | `/api/files/:id` | 删除文件 | 认证 |
| GET | `/api/files/:id/download` | 下载文件 | 认证 |

### 4.12 消息（Message）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/messages` | 发送消息 | 认证 |
| GET | `/api/messages` | 消息列表 | 认证 |

### 4.13 AI 建议

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/clients/:clientId/ai-suggestion` | AI跟进建议 | staff |

### 4.14 用户管理（User）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/users` | 用户列表 | admin |
| POST | `/api/users` | 创建用户 | admin |
| PUT | `/api/users/:id` | 更新用户 | admin |
| DELETE | `/api/users/:id` | 删除用户 | admin |

---

## 五、数据库表结构

数据库：`voice_room_db`，共 15 张表。

| 表名 | 说明 |
|------|------|
| `voice_users` | 用户表（id, username, password, nickname, avatar, role, client_id） |
| `system_config` | 系统配置（JWT_SECRET 等） |
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
| `/users` | UserManagement | 用户管理 | admin |

---

## 七、项目结构

```
DuiJie/
├── DESIGN.md                          # 原始设计文档
├── PROJECT.md                         # 项目进度文档（本文件）
├── .gitignore
│
├── frontend/duijieReact/              # 前端（React 18 + TS + Vite）
│   ├── src/
│   │   ├── App.tsx                    # 路由定义
│   │   ├── bootstrap.ts              # API 封装 + Token 管理
│   │   ├── main.tsx                   # 入口
│   │   └── features/
│   │       ├── auth/                  # 登录认证
│   │       │   ├── index.tsx
│   │       │   └── services/api.ts
│   │       ├── dashboard/             # 仪表盘
│   │       │   ├── index.tsx
│   │       │   ├── Report.tsx
│   │       │   └── services/api.ts
│   │       ├── project/               # 项目管理
│   │       │   ├── index.tsx
│   │       │   ├── components/ProjectDetail.tsx
│   │       │   └── services/api.ts
│   │       ├── client/                # 客户管理
│   │       │   ├── index.tsx
│   │       │   ├── components/ClientDetail.tsx
│   │       │   └── services/api.ts
│   │       ├── task/                  # 任务看板
│   │       │   ├── index.tsx
│   │       │   └── services/api.ts
│   │       ├── file/                  # 文件管理
│   │       │   ├── components/FileList.tsx
│   │       │   └── services/api.ts
│   │       ├── milestone/             # 里程碑
│   │       │   ├── components/MilestoneList.tsx
│   │       │   └── services/api.ts
│   │       ├── message/               # 消息沟通
│   │       │   ├── components/MessagePanel.tsx
│   │       │   └── services/api.ts
│   │       ├── user/                  # 用户管理
│   │       │   └── index.tsx
│   │       └── ui/                    # 共享 UI 组件
│   │           ├── Avatar.tsx
│   │           ├── Badge.tsx
│   │           ├── Button.tsx
│   │           ├── ConfirmDialog.tsx
│   │           ├── Input.tsx
│   │           ├── Layout.tsx
│   │           ├── Modal.tsx
│   │           ├── ProgressBar.tsx
│   │           └── Toast.tsx
│   ├── vite.config.ts
│   └── package.json
│
├── server/duijie/                     # 后端（Express + MySQL）
│   ├── standalone.js                  # 服务入口
│   ├── config/db.js                   # MySQL 连接池
│   ├── .env                           # 环境变量
│   ├── atomic/
│   │   ├── routes/index.js            # 路由映射（51个端点）
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT 认证中间件
│   │   │   └── roleGuard.js           # 角色权限守卫
│   │   ├── controllers/               # 14 个模块，51 个控制器
│   │   │   ├── ai/                    # AI 建议（1）
│   │   │   ├── auth/                  # 认证（3）
│   │   │   ├── client/                # 客户（9）
│   │   │   ├── contact/               # 联系人（4）
│   │   │   ├── contract/              # 合同（4）
│   │   │   ├── dashboard/             # 仪表盘（2）
│   │   │   ├── file/                  # 文件（4）
│   │   │   ├── followUp/              # 跟进（2）
│   │   │   ├── message/               # 消息（2）
│   │   │   ├── milestone/             # 里程碑（3）
│   │   │   ├── project/               # 项目（5）
│   │   │   ├── tag/                   # 标签（4）
│   │   │   ├── task/                  # 任务（4）
│   │   │   └── user/                  # 用户（4）
│   │   ├── services/                  # 业务逻辑层
│   │   └── repositories/              # 数据访问层
│   ├── socket/index.js                # Socket.IO 实时消息
│   ├── uploads/                       # 文件上传目录
│   └── scripts/
│       ├── full-init.sql              # 数据库完整初始化脚本
│       ├── backup-db.js               # 自动备份脚本
│       ├── init-db.sql                # 表结构定义
│       ├── migrate-rbac.js            # RBAC 迁移脚本
│       └── seed-clients.sql           # 客户种子数据
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

## 九、版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0.0 | 2025-01-18 | 初始版本：完整功能实现 |
| v1.0.1 | 2025-01-18 | 多会话支持 + 数据库备份脚本 |
| v1.0.2 | 2025-01-19 | 成员仪表盘数据隔离 + 项目详情增强 |
| v1.0.3 | 2025-01-19 | 任务看板创建表单 + 消息发送者名称修复 |

---

## 十、快速启动

```bash
# 1. 初始化数据库（XAMPP MySQL）
mysql -u root < server/duijie/scripts/full-init.sql

# 2. 启动后端
cd server/duijie && node standalone.js

# 3. 启动前端
cd frontend/duijieReact && npx vite

# 4. 访问
# http://localhost:1300
# 登录：admin / admin123

# 5. 数据库备份
node server/duijie/scripts/backup-db.js
```

---

## 十一、统计数据

| 指标 | 数值 |
|------|------|
| 后端控制器 | 51 个 |
| API 端点 | 51 个 |
| 数据库表 | 15 张 |
| 前端功能模块 | 10 个 |
| 共享 UI 组件 | 9 个 |
| 前端路由 | 8 条 |
