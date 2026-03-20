# DuiJie - 客户项目对接平台

> 基于 voiceRoom 现有微服务架构，遵循核心规则体系构建

---

## 一、现有系统分析

### 1.1 服务器环境

| 项目 | 值 |
|------|-----|
| OS | Ubuntu 24.04.1 LTS |
| 域名 | `app.on1z.com` |
| IP | `160.202.253.143` |
| Node | v20.20.0 |
| 数据库 | MySQL 8.0+（`voice_room_db`） |
| 进程管理 | PM2 |
| 项目根目录 | `/var/www/voiceRoom/` |

### 1.2 现有项目结构

```
/var/www/voiceRoom/
├── AGENTS.md                 # AI 协作规范（入口文件）
├── .gitignore
├── docs/
│   ├── PORTS.md              # 端口分配表
│   ├── README.md
│   ├── 改造进度报告.md
│   └── 00-核心架构/          # 架构详细文档
├── frontend/                  # 25+ 前端模块（React + TS）
│   ├── dashReact/
│   ├── loginReact/
│   └── ...
├── server/                    # 26+ 后端模块（Express + MySQL）
│   ├── leadMarket/           # 示例：五层原子架构
│   ├── login/
│   └── ...
├── scripts/                   # 自动化脚本
├── 核心规则/                  # 46 个规则文件（项目红线）
├── 核心规则-通用/             # 通用规则模板（可复制到新项目）
└── 历史文档/
```

### 1.3 现有架构规范摘要

#### 前端规范
- **React 18+ / TypeScript**，Bun 构建
- **内联样式**，禁止 CSS 文件和 Tailwind
- **features 模块 100% 独立**，仅 `ui` 模块可跨模块导入
- **signals/computed/actions/effects** 状态管理模式
- **Cookie 管理状态**，禁止 localStorage/sessionStorage
- **standalone.cjs** 动态注入配置（`window.__ENV__`）
- 组件 ≤300 行，Hooks/Utils ≤150 行

#### 后端规范
- **五层架构**：Routes → Controllers → Services → Repositories → Database
- **一个文件 = 一个方法**，≤20 行/文件
- **Event Bus 解耦**：Service 通过事件通信，不直接调用 Socket
- **Cookie 安全**：httpOnly + secure + sameSite
- **JWT_SECRET 从数据库 `system_config` 表获取**，禁止硬编码
- **参数化查询**，禁止 SQL 拼接

#### 端口规范
- 前端服务：1000-1499（+5 递增）
- 后端服务：1500-1999（+5 递增）

#### 数据库规范
- 表命名：`{模块前缀}_业务名称`
- 必须字段：`id`、`created_at`、`updated_at`、`is_deleted`
- 禁止跨模块 JOIN

### 1.4 现有模块清单（部分）

| 模块 | 前端端口 | 后端端口 | 说明 |
|------|---------|---------|------|
| login | 1100 | 1600 | 登录认证 |
| home | 1115 | 1615 | 首页 |
| leadMarket | - | 1620 | 引导市场 |
| wallet | 1160 | 1705 | 钱包 |
| membership | 1150 | 1625 | 会员 |
| admin | 1200 | - | 管理后台 |

---

## 二、DuiJie 产品定位

**DuiJie（对接）** 是 voiceRoom 平台的**客户项目管理与交付对接模块**。作为一个新的微服务模块接入现有体系，而非独立项目。

### 核心目标
- 管理外部客户信息
- 跟踪项目进度与里程碑
- 任务分配与执行
- 客户沟通记录
- 文件交付管理

### 用户角色

| 角色 | 说明 |
|------|------|
| **管理员** | 已有 voiceRoom 平台用户，通过 SSO 登录，管理项目和客户 |
| **成员** | 已有平台用户，被分配任务，执行交付 |
| **客户（后期）** | 外部用户，查看项目进度、确认里程碑、下载交付物 |

---

## 三、模块设计

### 3.1 模块命名与端口

遵循现有端口规范（+5 递增），在可用范围内分配：

| 模块 | 前端端口 | 后端端口 | 说明 |
|------|---------|---------|------|
| duijie | **1300** | **1800** | 对接主模块（项目+客户+任务+文件+消息） |

> 如后续拆分子模块可沿用 1305/1310... 和 1805/1810... 递增

### 3.2 前端模块结构

遵循 `前端-模块独立.md` 规范：

```
frontend/duijieReact/
├── src/
│   ├── features/
│   │   ├── dashboard/              # 仪表盘
│   │   │   ├── signals/
│   │   │   ├── computed/
│   │   │   ├── actions/
│   │   │   ├── components/
│   │   │   │   ├── StatCards.tsx
│   │   │   │   ├── RecentProjects.tsx
│   │   │   │   └── TaskOverview.tsx
│   │   │   ├── services/
│   │   │   └── index.tsx
│   │   │
│   │   ├── project/                # 项目管理
│   │   │   ├── signals/
│   │   │   ├── computed/
│   │   │   ├── actions/
│   │   │   ├── components/
│   │   │   │   ├── ProjectList.tsx
│   │   │   │   ├── ProjectCard.tsx
│   │   │   │   ├── ProjectDetail.tsx
│   │   │   │   ├── ProjectForm.tsx
│   │   │   │   └── MilestoneTimeline.tsx
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── index.tsx
│   │   │
│   │   ├── client/                 # 客户管理
│   │   │   ├── signals/
│   │   │   ├── components/
│   │   │   │   ├── ClientList.tsx
│   │   │   │   ├── ClientCard.tsx
│   │   │   │   ├── ClientDetail.tsx
│   │   │   │   └── ClientForm.tsx
│   │   │   ├── services/
│   │   │   └── index.tsx
│   │   │
│   │   ├── task/                   # 任务看板
│   │   │   ├── signals/
│   │   │   ├── components/
│   │   │   │   ├── TaskBoard.tsx       # 看板视图
│   │   │   │   ├── TaskColumn.tsx
│   │   │   │   ├── TaskCard.tsx
│   │   │   │   └── TaskForm.tsx
│   │   │   ├── services/
│   │   │   └── index.tsx
│   │   │
│   │   ├── file/                   # 文件交付
│   │   │   ├── components/
│   │   │   │   ├── FileList.tsx
│   │   │   │   └── FileUploader.tsx
│   │   │   ├── services/
│   │   │   └── index.tsx
│   │   │
│   │   ├── message/                # 沟通消息
│   │   │   ├── signals/
│   │   │   ├── components/
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   └── MessageInput.tsx
│   │   │   ├── services/
│   │   │   └── index.tsx
│   │   │
│   │   └── ui/                     # 共享 UI 组件（唯一可跨模块导入）
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── Input.tsx
│   │       ├── Badge.tsx
│   │       ├── Avatar.tsx
│   │       └── ProgressBar.tsx
│   │
│   ├── bootstrap.ts               # 配置加载（window.__ENV__）
│   ├── main.tsx                    # 入口
│   └── App.tsx                     # 路由（≤150行，只做路由）
│
├── standalone.cjs                  # 动态配置注入 + 静态资源服务
├── db-config.cjs                   # 从 MySQL 读取配置
├── package.json
└── tsconfig.json
```

### 3.3 后端模块结构

遵循 `后端-五层架构.md` 规范（一个文件一个方法）：

```
server/duijie/
├── atomic/
│   ├── controllers/
│   │   ├── project/
│   │   │   ├── createController.js
│   │   │   ├── listController.js
│   │   │   ├── detailController.js
│   │   │   ├── updateController.js
│   │   │   └── deleteController.js
│   │   ├── client/
│   │   │   ├── createController.js
│   │   │   ├── listController.js
│   │   │   ├── detailController.js
│   │   │   └── updateController.js
│   │   ├── task/
│   │   │   ├── createController.js
│   │   │   ├── listController.js
│   │   │   ├── updateController.js
│   │   │   └── moveController.js       # 看板拖拽
│   │   ├── milestone/
│   │   │   ├── createController.js
│   │   │   ├── listController.js
│   │   │   └── toggleController.js
│   │   ├── file/
│   │   │   ├── uploadController.js
│   │   │   ├── listController.js
│   │   │   └── deleteController.js
│   │   ├── message/
│   │   │   ├── sendController.js
│   │   │   └── listController.js
│   │   └── dashboard/
│   │       └── statsController.js
│   │
│   ├── services/
│   │   ├── project/
│   │   │   ├── createProject.js
│   │   │   ├── listProjects.js
│   │   │   ├── getProjectDetail.js
│   │   │   ├── updateProject.js
│   │   │   └── deleteProject.js
│   │   ├── client/
│   │   │   ├── createClient.js
│   │   │   ├── listClients.js
│   │   │   ├── getClientDetail.js
│   │   │   └── updateClient.js
│   │   ├── task/
│   │   │   ├── createTask.js
│   │   │   ├── listTasks.js
│   │   │   ├── updateTask.js
│   │   │   └── moveTask.js
│   │   ├── milestone/
│   │   │   ├── createMilestone.js
│   │   │   ├── listMilestones.js
│   │   │   └── toggleMilestone.js
│   │   ├── file/
│   │   │   ├── uploadFile.js
│   │   │   ├── listFiles.js
│   │   │   └── deleteFile.js
│   │   ├── message/
│   │   │   ├── sendMessage.js
│   │   │   └── listMessages.js
│   │   └── dashboard/
│   │       └── getStats.js
│   │
│   ├── repositories/
│   │   ├── project/
│   │   │   ├── createRepo.js
│   │   │   ├── findAllRepo.js
│   │   │   ├── findByIdRepo.js
│   │   │   ├── updateRepo.js
│   │   │   └── softDeleteRepo.js
│   │   ├── client/
│   │   │   ├── createRepo.js
│   │   │   ├── findAllRepo.js
│   │   │   ├── findByIdRepo.js
│   │   │   └── updateRepo.js
│   │   ├── task/
│   │   │   ├── createRepo.js
│   │   │   ├── findByProjectRepo.js
│   │   │   ├── updateRepo.js
│   │   │   └── updateStatusRepo.js
│   │   ├── milestone/
│   │   │   ├── createRepo.js
│   │   │   ├── findByProjectRepo.js
│   │   │   └── toggleRepo.js
│   │   ├── file/
│   │   │   ├── createRepo.js
│   │   │   ├── findByProjectRepo.js
│   │   │   └── deleteRepo.js
│   │   ├── message/
│   │   │   ├── createRepo.js
│   │   │   └── findByProjectRepo.js
│   │   └── dashboard/
│   │       └── statsRepo.js
│   │
│   ├── routes/
│   │   └── index.js                    # 路由映射
│   │
│   └── middleware/
│       └── auth.js                     # JWT 认证（从 Cookie）
│
├── events/
│   ├── index.js                        # EventBus 实例
│   └── eventTypes.js                   # 事件常量
│
├── listeners/
│   ├── projectListener.js
│   ├── taskListener.js
│   └── messageListener.js
│
├── socket/
│   └── index.js                        # Socket.io 实时消息
│
├── config/
│   └── db.js                           # MySQL 连接池
│
├── uploads/                            # 文件上传目录
├── standalone.js                       # 零逻辑入口（≤60行）
├── index.js                            # 对外暴露
├── package.json
└── .env
```

---

## 四、数据库设计

### 4.1 表命名

遵循 `数据库-命名规范.md`，使用 `duijie_` 前缀：

### 4.2 表结构

#### `duijie_clients` — 客户表

```sql
CREATE TABLE duijie_clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '客户名称',
  company VARCHAR(200) COMMENT '公司名称',
  email VARCHAR(200) COMMENT '邮箱',
  phone VARCHAR(50) COMMENT '电话',
  avatar VARCHAR(500) COMMENT '头像URL',
  notes TEXT COMMENT '备注',
  created_by INT NOT NULL COMMENT '创建者（voice_users.id）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_created_by (created_by),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对接-客户表';
```

#### `duijie_projects` — 项目表

```sql
CREATE TABLE duijie_projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL COMMENT '项目名称',
  description TEXT COMMENT '项目描述',
  client_id INT NOT NULL COMMENT '关联客户',
  status ENUM('planning','in_progress','review','completed','on_hold') DEFAULT 'planning' COMMENT '状态',
  progress TINYINT DEFAULT 0 COMMENT '进度百分比',
  start_date DATE COMMENT '开始日期',
  end_date DATE COMMENT '结束日期',
  budget DECIMAL(12,2) DEFAULT 0 COMMENT '预算',
  tags VARCHAR(500) COMMENT '标签（JSON数组）',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_client_id (client_id),
  INDEX idx_status (status),
  INDEX idx_created_by (created_by),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对接-项目表';
```

#### `duijie_tasks` — 任务表

```sql
CREATE TABLE duijie_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL COMMENT '关联项目',
  title VARCHAR(200) NOT NULL COMMENT '任务标题',
  description TEXT COMMENT '任务描述',
  status ENUM('todo','in_progress','done') DEFAULT 'todo' COMMENT '状态',
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium' COMMENT '优先级',
  assignee_id INT COMMENT '负责人（voice_users.id）',
  due_date DATE COMMENT '截止日期',
  sort_order INT DEFAULT 0 COMMENT '排序（看板拖拽）',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_project_id (project_id),
  INDEX idx_status (status),
  INDEX idx_assignee_id (assignee_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对接-任务表';
```

#### `duijie_milestones` — 里程碑表

```sql
CREATE TABLE duijie_milestones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL COMMENT '关联项目',
  title VARCHAR(200) NOT NULL COMMENT '里程碑标题',
  description TEXT COMMENT '描述',
  due_date DATE COMMENT '目标日期',
  is_completed TINYINT(1) DEFAULT 0 COMMENT '是否完成',
  completed_at TIMESTAMP NULL COMMENT '完成时间',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_project_id (project_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对接-里程碑表';
```

#### `duijie_files` — 文件表

```sql
CREATE TABLE duijie_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL COMMENT '关联项目',
  name VARCHAR(300) NOT NULL COMMENT '文件名',
  original_name VARCHAR(300) COMMENT '原始文件名',
  size BIGINT DEFAULT 0 COMMENT '文件大小(bytes)',
  mime_type VARCHAR(100) COMMENT 'MIME类型',
  path VARCHAR(500) NOT NULL COMMENT '存储路径',
  version INT DEFAULT 1 COMMENT '版本号',
  uploaded_by INT NOT NULL COMMENT '上传者',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_project_id (project_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对接-文件表';
```

#### `duijie_messages` — 消息表

```sql
CREATE TABLE duijie_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL COMMENT '关联项目',
  sender_id INT NOT NULL COMMENT '发送者',
  content TEXT NOT NULL COMMENT '消息内容',
  type ENUM('text','file','system') DEFAULT 'text' COMMENT '消息类型',
  is_client_visible TINYINT(1) DEFAULT 1 COMMENT '客户是否可见',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_project_id (project_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对接-消息表';
```

### 4.3 system_config 配置项

```sql
INSERT INTO system_config (config_key, config_value) VALUES
('DUIJIE_FRONTEND_PORT', '1300'),
('DUIJIE_BACKEND_PORT', '1800');
```

### 4.4 system_modules 注册

```sql
INSERT INTO system_modules (module_name, module_type, port, status) VALUES
('duijie', 'frontend', 1300, 'active'),
('duijie', 'backend', 1800, 'active');
```

---

## 五、API 接口设计

所有接口前缀：`/api`，通过 Cookie 携带 JWT 认证。

### 5.1 仪表盘

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard/stats` | 统计数据（项目数、任务数、客户数等） |

### 5.2 项目管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/projects` | 创建项目 |
| GET | `/api/projects` | 项目列表（支持 ?status=&client_id=&page=&limit=） |
| GET | `/api/projects/:id` | 项目详情 |
| PUT | `/api/projects/:id` | 更新项目 |
| DELETE | `/api/projects/:id` | 删除项目（软删除） |

### 5.3 客户管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/clients` | 创建客户 |
| GET | `/api/clients` | 客户列表 |
| GET | `/api/clients/:id` | 客户详情（含关联项目） |
| PUT | `/api/clients/:id` | 更新客户 |

### 5.4 任务管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/tasks` | 创建任务 |
| GET | `/api/tasks?project_id=` | 任务列表（按项目） |
| PUT | `/api/tasks/:id` | 更新任务 |
| PATCH | `/api/tasks/:id/move` | 移动任务状态（看板拖拽） |

### 5.5 里程碑

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/milestones` | 创建里程碑 |
| GET | `/api/milestones?project_id=` | 里程碑列表 |
| PATCH | `/api/milestones/:id/toggle` | 切换完成状态 |

### 5.6 文件

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/files/upload` | 上传文件（multipart/form-data） |
| GET | `/api/files?project_id=` | 文件列表 |
| DELETE | `/api/files/:id` | 删除文件 |
| GET | `/api/files/:id/download` | 下载文件 |

### 5.7 消息

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/messages` | 发送消息 |
| GET | `/api/messages?project_id=` | 消息列表（分页） |

---

## 六、前端路由

在 `App.tsx` 中定义（≤150行，只做路由）：

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | Dashboard | 仪表盘首页 |
| `/projects` | ProjectList | 项目列表 |
| `/projects/:id` | ProjectDetail | 项目详情（Tab: 概览/任务/文件/沟通） |
| `/clients` | ClientList | 客户列表 |
| `/clients/:id` | ClientDetail | 客户详情 |
| `/tasks` | TaskBoard | 任务看板（全局视图） |

---

## 七、UI 设计要点

- **内联样式**（遵循现有规范，禁止 CSS 文件和 Tailwind）
- **CSS 变量主题**（从 `前端-主题系统.md` 获取，支持深色/浅色切换）
- **Lucide React 图标**
- **布局**：侧边导航 + 顶部栏 + 内容区
- **状态色彩体系**：

| 状态 | 颜色 | 用途 |
|------|------|------|
| 规划/审核 | 蓝色 | `var(--color-info)` |
| 进行中 | 黄色 | `var(--color-warning)` |
| 已完成 | 绿色 | `var(--color-success)` |
| 紧急 | 红色 | `var(--color-danger)` |
| 暂停/待办 | 灰色 | `var(--color-muted)` |

---

## 八、开发阶段

| 阶段 | 内容 | 输出 |
|------|------|------|
| **P0 - 基础骨架** | 模块初始化、standalone.js、数据库建表、路由、布局 | 可运行的空壳 |
| **P1 - 项目管理** | 项目 CRUD + 列表 + 详情页 | 核心功能可用 |
| **P2 - 客户管理** | 客户 CRUD + 项目关联 | 客户体系完整 |
| **P3 - 任务看板** | 任务 CRUD + 看板拖拽 + 里程碑时间线 | 执行跟踪可用 |
| **P4 - 文件与消息** | 文件上传下载 + 消息沟通 + Socket 实时推送 | 交付协作可用 |
| **P5 - 仪表盘** | 统计图表 + 数据聚合 | 全局概览 |

---

## 九、部署方案

```bash
# 1. 在服务器上创建模块目录
mkdir -p /var/www/voiceRoom/frontend/duijieReact
mkdir -p /var/www/voiceRoom/server/duijie

# 2. 本地开发 → 推送到服务器（遵循 指南-本地推送.md）

# 3. 安装依赖
cd /var/www/voiceRoom/server/duijie && npm install
cd /var/www/voiceRoom/frontend/duijieReact && bun install && bun run build

# 4. 注册到 PM2
pm2 start /var/www/voiceRoom/server/duijie/standalone.js --name duijie-backend
pm2 start /var/www/voiceRoom/frontend/duijieReact/standalone.cjs --name duijie-frontend
pm2 save

# 5. 运行测试
bash scripts/templates/test-module.sh duijie
```

---

## 十、注意事项与红线

### 必须遵守
- ✅ 每个后端文件 ≤20 行，一个文件一个方法
- ✅ 前端组件 ≤300 行
- ✅ JWT_SECRET 从 `system_config` 获取
- ✅ Cookie 认证（httpOnly + secure + sameSite）
- ✅ 参数化 SQL 查询
- ✅ 内联样式 + CSS 变量
- ✅ standalone.cjs 动态注入配置
- ✅ EventBus 解耦

### 严格禁止
- ❌ localStorage / sessionStorage
- ❌ 硬编码 URL / 端口 / 密钥
- ❌ Tailwind CSS / 外部 CSS 文件
- ❌ 跨模块 import（ui 模块除外）
- ❌ SQL 字符串拼接
- ❌ Service 直接调用 Socket
- ❌ 修改后不测试
