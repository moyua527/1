# DuiJie（对接）— 客户项目对接平台

> 版本：v1.0.52 | 最后更新：2026-03-22
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
| 图表 | Recharts |
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
| **sales_manager** | 销售经理 | 管理团队，查看下属数据（通过 manager_id 树形结构），分配客户 |
| **business** | 业务员 | 客户管理（仅自己负责/创建的）、商机管理、项目/任务、站内消息 |
| **marketing** | 市场 | 线索录入（潜在/意向客户），看营销数据，不看合同金额 |
| **tech** | 技术人员 | 项目/任务、站内消息 |
| **support** | 客服 | 已签约客户的服务支持、工单处理、跟进记录 |
| **member** | 成员 | 项目/客户/任务（仅参与的项目范围内），无销售漏斗 |
| **viewer** | 只读 | 只能查看客户/商机/跟进数据，不能修改任何内容 |
| **client** | 客户 | 查看关联项目进度、确认里程碑、下载交付物、工单提交 |

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
- 销售漏斗（admin / sales_manager / business）
- 跟进提醒（admin / sales_manager / business / support）
- 最近活动（admin / sales_manager / business）
- 数据报表页面（趋势图表）
- **Recharts 图表**：任务趋势面积图、任务状态饼图、新增客户柱状图、商机阶段分布图
- **时间筛选**：7天 / 30天 / 90天 快捷切换
- **字段级权限**：marketing / viewer 看不到合同金额
- **数据隔离**：admin 全部 / sales_manager 团队 / business 个人 / marketing 线索 / support 签约客户

### 3.3 项目管理（Project）

- 项目列表：筛选（状态/客户）、搜索、分页、响应式网格
- 新建项目：名称、描述、**客户关联（必填）**、日期、预算
- **创建权限**：仅 admin / sales_manager 可创建项目
- **数据隔离**：继承客户隔离逻辑（admin/viewer 全部 / sales_manager 团队 / business 自己客户 / marketing 线索客户 / support 签约客户 / client 关联项目 / 其他角色仅成员项目）
- **编辑权限**：admin / sales_manager / business / tech 可编辑（后端校验归属）
- **删除权限**：仅 admin
- 项目详情（Tab 页签，**URL 持久化**）：
  - **概览**：项目信息网格 + 项目成员列表（**点击查看成员详细信息弹窗**）+ 进度条 + 描述
  - **任务**：任务列表 + 内联添加 + 状态切换下拉（viewer/client 只读）
  - **里程碑**：创建 / 编辑 / 删除 + 截止日期 + 完成切换（viewer/client 只读）
  - **文件**：上传 + 列表 + 下载 + 删除
  - **消息**：实时聊天（Socket.IO）+ 发送者昵称显示
- 项目编辑、软删除

### 3.4 客户管理（Client）

- 客户列表：阶段筛选 Tab（**URL 持久化** + **横向滚动**）+ 搜索 + 客户评分
- 新建客户：渠道、阶段、名称、公司、邮箱、电话、职位级别、部门、工作职能、**对接人分配**
- CSV 导入/导出
- **对接人分配**：创建/编辑时可选择负责业务员，卡片和详情页显示对接人
- **数据隔离 3 级**：admin 全部 / sales_manager 团队（递归下属）/ business 自己 / marketing 仅线索 / support 仅签约
- 客户详情页：
  - 基本信息编辑（含对接人分配）
  - 联系人管理（CRUD）
  - 合同管理（CRUD）
  - 跟进记录（电话/微信/拜访/邮件）（支持编辑/删除）
  - 标签管理
  - 客户评分（A-E 等级）
  - 变更历史日志
  - AI 跟进建议

### 3.5 商机管理（Opportunity）

- 看板式销售管道：线索 → 验证 → 方案 → 谈判 → 赢单 / 丢单
- 商机卡片显示：标题、关联客户、预计金额、成交概率、预计成交日期、负责人
- 一键移阶段（卡片底部快捷按钮）
- **拖拽换阶段**：HTML5 Drag & Drop 在列间拖动商机卡片切换阶段
- 管道总额、赢单金额统计
- 新建/编辑/删除商机
- **数据隔离 3 级**：admin 全部 / sales_manager 团队（递归下属）/ business 自己

### 3.6 任务看板（TaskBoard）

- 三列看板：待办 / 进行中 / 已完成
- 拖拽切换状态（HTML5 Drag & Drop）+ 列高亮反馈
- 每列底部内联添加任务表单（标题 + 优先级选择）
- 任务卡片显示：标题、优先级 Badge、截止日期
- 按项目切换视图

### 3.7 文件管理（File）

- **独立文件管理页**：全局文件列表（跨项目）、搜索、上传 / 下载 / 删除
- 文件上传（multipart/form-data，限制 50MB）
- 文件列表（按项目 + 全局）、文件类型图标区分
- 文件下载、文件删除（软删除）

### 3.8 消息沟通（Message）

- **项目消息**：项目内实时消息（Socket.IO）、消息气泡 + 发送者头像/昵称、连接状态指示灯
- **站内消息（Direct Message）**：用户间一对一聊天、对话列表 + 未读计数、已读回执（双勾）、5秒轮询刷新、搜索用户发起新对话
- Enter 发送

### 3.9 用户管理（User，仅 admin）

- 用户列表 + 创建/编辑/删除 + **搜索** + **角色筛选**
- **9 种角色选择**：admin / sales_manager / business / marketing / tech / support / member / viewer / client
- **上级经理分配**：通过 manager_id 建立团队层级树，用户卡片显示上级
- **注册审批制**：系统邀请码注册 → 待审批（is_active=0），管理员点击「审批激活」后可登录
- **待审批筛选**：Tab 栏显示「待审批(N)」标签，快速定位未激活用户
- **邀请链接管理**：生成带预设角色+有效期的一次性邀请链接，复制/查看状态/删除
- **注册邀请码管理卡片**：查看（眼睛图标显示/隐藏）+ 复制 + 修改 + 关闭邀请码
- **注册角色区分**：个人邀请码→client角色（直接激活）/ 系统邀请码→member（需审批）/ 邀请链接→预设角色（直接激活）

### 3.10 客户门户（Client Portal）

- **客户专属仪表盘**：我的项目（含进度条）、待确认里程碑、我的合同、最新交付文件、未读消息数
- **项目查看**：查看关联项目进度、里程碑、文件下载
- **合同查看**：客户可在仪表盘查看自己的合同状态和金额
- **消息限制**：客户只能与项目相关人员（项目成员+创建者）通信
- **工单提交**：客户可提交需求/问题/咨询工单，与工作人员沟通

### 3.11 工单系统（Ticket）

- 工单类型：需求 / 问题 / 咨询 / 其他
- 优先级：低 / 中 / 高 / 紧急
- 状态流转：待处理 → 处理中 → 已解决 → 已关闭
- 工单详情：描述、回复列表、状态变更、分配处理人
- **满意度评价**：工单解决后客户可评分（1-5星）+ 评价内容
- **自动流转**：工作人员回复自动将工单从「待处理」变为「处理中」
- 关联项目（选填）
- 客户只能查看自己提交的工单，工作人员可看全部
- **满意度评价**：工单解决后客户可评分（1-5星）+ 评价内容
- **自动流转**：工作人员回复自动将工单从「待处理」变为「处理中」
- 关联项目（选填）
- 客户只能查看自己提交的工单，工作人员可看全部

### 3.12 数据报表（Report）

- 数据趋势图表
- admin / sales_manager / business / marketing 可见

### 3.13 全局通知系统（Notification）

- 导航栏铃铛图标 + 未读计数徽章
- 下拉通知列表（最新 20 条）
- 点击单条标记已读 + 跳转链接
- 异步触发：工单回复、任务分配等场景自动生成通知

### 3.14 审计日志（Audit Log，仅 admin）

- 自动记录关键操作（创建/更新/删除/登录/登出）
- 记录用户、操作类型、对象类型、IP 地址
- 管理员查看页：操作类型筛选 + 对象类型筛选 + 分页

### 3.15 系统配置（Settings，仅 admin）

- 系统名称、欢迎消息、最大上传大小、任务默认优先级、跟进提醒天数等
- 键值对形式存储，统一管理

### 3.16 移动端适配

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
| GET | `/api/system/config` | 获取全部配置 | admin |
| PUT | `/api/system/config` | 更新配置 | admin |

### 4.3 仪表盘（Dashboard）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/dashboard/stats` | 统计数据 | 认证 |
| GET | `/api/dashboard/report` | 报表数据 | 认证 |
| GET | `/api/dashboard/chart` | 图表数据（支持 days 参数） | 认证 |

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
| PUT | `/api/follow-ups/:id` | 编辑跟进 | staff |
| DELETE | `/api/follow-ups/:id` | 删除跟进 | staff |

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
| PUT | `/api/milestones/:id` | 更新里程碑 | 认证 |
| DELETE | `/api/milestones/:id` | 删除里程碑 | 认证 |
| PATCH | `/api/milestones/:id/toggle` | 切换完成 | 认证 |

### 4.12 文件（File）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/files/upload` | 上传文件 | 认证 |
| GET | `/api/files/all` | 全局文件列表 | 认证 |
| GET | `/api/files` | 项目文件列表 | 认证 |
| DELETE | `/api/files/:id` | 删除文件 | 认证 |
| GET | `/api/files/:id/download` | 下载文件 | 认证 |

### 4.13 消息（Message）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/messages` | 发送消息 | 认证 |
| GET | `/api/messages` | 消息列表 | 认证 |

### 4.14 商机管理（Opportunity）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/opportunities` | 创建商机 | staff |
| GET | `/api/opportunities` | 商机列表 | staff |
| PUT | `/api/opportunities/:id` | 更新商机 | staff |
| DELETE | `/api/opportunities/:id` | 删除商机 | staff |

### 4.15 站内消息（Direct Message）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/dm/conversations` | 对话列表 | 认证 |
| GET | `/api/dm/users` | 可聊天用户列表 | 认证 |
| GET | `/api/dm/:userId/history` | 聊天记录（自动标记已读） | 认证 |
| POST | `/api/dm/send` | 发送消息 | 认证 |

### 4.16 工单（Ticket）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/tickets` | 创建工单 | 认证 |
| GET | `/api/tickets` | 工单列表（client仅自己的） | 认证 |
| GET | `/api/tickets/:id` | 工单详情+回复 | 认证 |
| PUT | `/api/tickets/:id` | 更新状态/分配 | staff |
| POST | `/api/tickets/:id/reply` | 回复工单 | 认证 |
| POST | `/api/tickets/:id/rate` | 评价工单 | 提交者 |

### 4.17 AI 建议

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/clients/:clientId/ai-suggestion` | AI 跟进建议 | staff |

### 4.18 用户管理（User）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/users` | 用户列表 | admin |
| POST | `/api/users` | 创建用户 | admin |
| PUT | `/api/users/:id` | 更新用户 | admin |
| DELETE | `/api/users/:id` | 删除用户 | admin |

### 4.19 审计日志（Audit Log）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/audit-logs` | 审计日志列表（支持筛选/分页） | admin |

### 4.20 通知（Notification）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/notifications` | 通知列表 | 认证 |
| PATCH | `/api/notifications/:id/read` | 标记已读 | 认证 |

---

## 五、数据库表结构

数据库：`duijie_db`，共 21 张表。

| 表名 | 说明 |
|------|------|
| `voice_users` | 用户表（id, username, password, nickname, email, phone, avatar, role, client_id, manager_id） |
| `system_config` | 系统配置（JWT_SECRET, INVITE_CODE） |
| `duijie_clients` | 客户表（含 assigned_to 对接人字段） |
| `duijie_opportunities` | 商机表（title, client_id, amount, probability, stage, assigned_to） |
| `duijie_direct_messages` | 站内消息表（sender_id, receiver_id, content, read_at） |
| `duijie_tickets` | 工单表（title, content, type, priority, status, project_id, assigned_to, rating） |
| `duijie_ticket_replies` | 工单回复表（ticket_id, content, created_by） |
| `duijie_projects` | 项目表 |
| `duijie_tasks` | 任务表 |
| `duijie_milestones` | 里程碑表 |
| `duijie_files` | 文件表 |
| `duijie_messages` | 项目消息表 |
| `duijie_project_members` | 项目成员关联表 |
| `duijie_contacts` | 联系人表 |
| `duijie_contracts` | 合同表 |
| `duijie_follow_ups` | 跟进记录表 |
| `duijie_tags` | 标签表 |
| `duijie_client_tags` | 客户标签关联表 |
| `duijie_client_logs` | 客户变更日志表 |
| `duijie_notifications` | 通知表（user_id, type, title, content, link, is_read） |
| `duijie_audit_logs` | 审计日志表（user_id, username, action, entity_type, entity_id, detail, ip） |

---

## 六、前端路由

| 路径 | 组件 | 说明 | 权限 |
|------|------|------|------|
| `/` | Dashboard | 仪表盘首页 | 认证 |
| `/projects` | ProjectList | 项目列表 | 认证 |
| `/projects/:id` | ProjectDetail | 项目详情（5 Tab） | 认证 |
| `/clients` | ClientList | 客户列表 | staff |
| `/clients/:id` | ClientDetail | 客户详情 | staff |
| `/opportunities` | OpportunityList | 商机管道看板 | staff |
| `/tasks` | TaskBoard | 任务看板 | staff |
| `/messaging` | Messaging | 站内消息聊天 | 认证 |
| `/tickets` | TicketPage | 工单系统（提交/列表/详情/回复/评价） | 认证 |
| `/report` | Report | 数据报表 | staff |
| `/files` | FileManager | 文件管理 | 认证 |
| `/users` | UserManagement | 用户管理 + 邀请码管理 | admin |
| `/audit` | AuditLog | 审计日志 | admin |
| `/settings` | SystemSettings | 系统配置 | admin |

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
│           │   ├── components/ClientDetail.tsx
│           │   └── services/api.ts       # 客户/商机 API 封装
│           ├── opportunity/           # 商机管理（看板式销售管道）
│           │   └── index.tsx
│           ├── messaging/             # 站内消息（一对一聊天）
│           │   └── index.tsx
│           ├── ticket/                # 工单系统（提交/列表/详情/回复/评价）
│           │   └── index.tsx
│           ├── task/                  # 任务看板
│           │   └── index.tsx
│           ├── file/                  # 文件管理（独立页）
│           │   └── index.tsx
│           ├── milestone/             # 里程碑
│           │   └── services/api.ts
│           ├── message/               # 消息沟通
│           │   └── components/MessagePanel.tsx
│           ├── audit/                 # 审计日志（admin）
│           │   └── index.tsx
│           ├── settings/              # 系统配置（admin）
│           │   └── index.tsx
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
│               ├── NotificationBell.tsx  # 通知铃铛组件
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
│   │   ├── routes/index.js            # 路由映射（75 个端点）
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT 认证中间件
│   │   │   ├── roleGuard.js           # 角色权限守卫
│   │   │   └── auditMiddleware.js     # 审计日志自动记录中间件
│   │   ├── utils/
│   │   │   └── auditLog.js            # 审计日志工具函数
│   │   └── controllers/               # 21 个模块
│   │       ├── ai/                    # AI 建议（1）
│   │       ├── audit/                 # 审计日志（1）：list
│   │       ├── auth/                  # 认证（6）：login, register, registerConfig, logout, me, profile
│   │       ├── client/                # 客户（9）
│   │       ├── contact/               # 联系人（4）
│   │       ├── contract/              # 合同（4）
│   │       ├── dashboard/             # 仪表盘（3）：stats, report, chart
│   │       ├── dm/                    # 站内消息（4）：conversations, history, send, users
│   │       ├── file/                  # 文件（5）：upload, list, listAll, delete, download
│   │       ├── followUp/              # 跟进（4）：create, list, update, delete
│   │       ├── message/               # 项目消息（2）
│   │       ├── milestone/             # 里程碑（5）：create, list, update, delete, toggle
│   │       ├── notification/          # 通知（2）：list, markRead
│   │       ├── opportunity/           # 商机（4）：create, list, update, delete
│   │       ├── ticket/                # 工单（6）：create, list, detail, update, reply, rate
│   │       ├── project/               # 项目（5）
│   │       ├── system/                # 系统配置（1）：invite-code + config getAll/updateAll
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

## 八、RBAC 数据隔离与权限矩阵

### 数据可见范围

| 角色 | 项目 | 客户 | 商机 | 任务 | 合同/跟进 | 金额 | 站内消息 | 仪表盘 |
|------|------|------|------|------|----------|------|----------|--------|
| admin | 全部 | 全部 | 全部 | 全部 | 全部 | ✅ | ✅ | 全部 + 漏斗 |
| sales_manager | 团队 | 团队（递归下属） | 团队 | 团队 | 团队 | ✅ | ✅ | 团队 + 漏斗 |
| business | 全部 | 负责/创建的 | 负责/创建的 | 全部 | 负责客户的 | ✅ | ✅ | 个人 |
| marketing | — | 仅线索（潜在/意向） | — | — | — | ❌ | ✅ | 线索统计 |
| tech | 全部 | — | — | 全部 | — | — | ✅ | 基础 |
| support | 全部 | 仅签约/合作中 | — | — | 负责客户的 | — | ✅ | 签约统计 |
| member | 参与的 | 关联项目的 | — | 关联的 | 关联的 | — | ✅ | 仅关联 |
| viewer | — | 全部只读 | 全部只读 | — | 全部只读 | ❌ | — | 全部只读 |
| client | 关联的 | — | — | — | — | — | ✅ 仅对接人 | 专属门户 |

### 操作权限（查看/编辑/删除分离）

| 操作 | admin | sales_manager | business | marketing | support | viewer |
|------|-------|--------------|----------|-----------|---------|--------|
| 创建客户 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 编辑客户 | ✅ | ✅ 下属的 | ✅ 自己的 | ✅ 自己的 | ✅ 负责的 | ❌ |
| 删除客户 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 创建商机 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 删除商机 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 创建合同 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 删除合同 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 导入客户 | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |

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
| v1.0.14~36 | 2026-03-21 | UI 优化、搜索功能、用户管理增强、文案调整 |
| v1.0.37 | 2026-03-21 | 撤回文案修改，恢复"客户管理"命名 |
| v1.0.38 | 2026-03-21 | CRM 功能增强：对接人分配 + 数据隔离、商机管道看板、站内消息聊天 |
| v1.0.39 | 2026-03-21 | 客户门户增强：专属仪表盘、合同查看、消息限制、工单系统（含满意度评价） |
| v1.0.40 | 2026-03-21 | CRM 标准角色体系：9 角色（+sales_manager/marketing/support/viewer）、manager_id 团队层级、3 级数据隔离、操作权限分离（查看/编辑/删除）、字段级权限（marketing 不可见金额） |
| v1.0.41~42 | 2026-03-21 | UI 优化、细节调整 |
| v1.0.43 | 2026-03-22 | Phase1a: 任务详细信息计算 |
| v1.0.44 | 2026-03-22 | Phase1b: 跟进记录编辑/删除 |
| v1.0.45 | 2026-03-22 | Phase2a: 全局通知系统（通知数 + 未读数 + 标记已读） |
| v1.0.46 | 2026-03-22 | Phase2a: 通知系统前端集成 |
| v1.0.47 | 2026-03-22 | Phase2b: 跟进记录增强（编辑/删除/日期） |
| v1.0.48 | 2026-03-22 | Phase3a: 商机看板数据切换 |
| v1.0.49 | 2026-03-22 | Phase3b: 仪表盘 Recharts 图表升级（柱状图 + 饼图 + 时间轴） |
| v1.0.50 | 2026-03-22 | Phase4a: 日志系统（自动记录 + 管理员查看 + 分页） |
| v1.0.51 | 2026-03-22 | Phase4b: 文档管理页面（全局列表 + 搜索 + 上传/下载/删除） |
| v1.0.52 | 2026-03-22 | Phase4c: 系统配置管理页面（全局设置键值对管理） |

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
| 后端控制器模块 | 21 个 |
| API 端点 | 85+ 个 |
| 数据库表 | 21 张 |
| 用户角色 | 9 种（admin / sales_manager / business / marketing / tech / support / member / viewer / client） |
| 前端功能模块 | 17 个 |
| 共享 UI 组件 | 11 个 |
| 前端路由 | 14 条 |
| 版本迭代 | 53 个（v1.0.0 ~ v1.0.52） |
