# DuiJie（对接）— 客户项目对接平台

> 版本：v1.1.18 | 最后更新：2026-03-26
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
| GitHub | https://github.com/moyua527/1 |
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

### 默认账户（full-init.sql 种子数据）

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | admin |
| test | test123 | member |
| yonghu | yonghu123 | member |

### 线上实际账户

| 用户名 | 昵称 | 角色 |
|--------|------|------|
| admin | 管理员 | admin |
| business | 业务员 | business |
| tech | 技术员 | tech |
| member | 成员 | member |

### 注册邀请码

| 项目 | 值 |
|------|------|
| 默认邀请码 | `duijie2024` |
| 管理入口 | 用户管理页顶部「注册邀请码」卡片 |

---

## 三、功能模块

### 3.1 用户认证与注册

- **登录/注册 Tab 切换**：统一页面，顶部 Tab 切换
- **注册方式 Tab**：手机号注册 / 邮箱注册，二选一
- **注册表单**：手机号或邮箱（必填）+ 昵称（必填）+ 性别 + 类型（个人/企业）+ 所在地（省份+城市）+ 密码（≥6位）+ 确认密码 + 邀请码
- **企业用户扩展字段**：选择"企业"类型时显示职位输入框（必填）
- **自动生成用户名**：手机号注册以手机号为用户名，邮箱注册自动生成
- **密码强度指示器**：三级评分（弱/中/强），基于长度+大写+数字+特殊字符
- **邀请码机制**：管理员可在用户管理页开启/关闭/修改邀请码
- **用户协议**：登录/注册前需勾选同意《用户服务协议》和《隐私保护政策》，点击可查看全文弹窗，未勾选时显示红色提示
- **找回密码**：登录页"忘记密码？"入口 → 两步流程：第1步选择手机号/邮箱验证身份（发送验证码），第2步输入新密码+确认密码（含密码强度指示器）→ 重置成功自动跳转登录
- **个人资料**：侧边栏点击头像 → 查看个人信息（昵称/邮箱/手机/性别/角色/注册时间/邀请码），点击「编辑资料」按钮进入编辑模式修改昵称/邮箱/手机号/密码

### 3.2 仪表盘（Dashboard）

- 统计卡片：项目数、客户数、合同总额、任务数、待跟进数、**合同笔数**、**转化率**
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
- **创建时添加成员**：新建项目弹窗支持多选团队成员（复选框列表 + 头像 + 昵称 + 角色标签），创建后自动添加为 editor 角色
- **客户自动入组**：创建项目时自动将关联客户的 user_id 添加为项目成员（viewer 角色）
- **关联应用（小程序模块）**：新建项目时可选填应用名称 + 应用链接，项目详情自动显示应用Tab
- 项目详情（Tab 页签，**URL 持久化**）：
  - **概览**：项目信息网格 + 项目成员列表（**点击查看成员详细信息弹窗**）+ 进度条 + 描述
  - **任务**：任务列表 + 内联添加 + 状态切换下拉（viewer/client 只读）
  - **里程碑**：创建 / 编辑 / 删除 + 截止日期 + 完成切换（viewer/client 只读）
  - **文件**：上传 + 列表 + 下载 + 删除
  - **消息**：实时聊天（Socket.IO）+ 发送者昵称显示
  - **应用**（条件Tab）：当项目关联了应用链接时显示，iframe 内嵌外部应用 + 支持新窗口打开
- 项目编辑、软删除

### 3.4 客户管理（Client）

- 客户列表：阶段筛选 Tab（**URL 持久化** + **横向滚动**）+ 搜索 + 客户评分 + **客户类型标签（企业/个人）**
- 新建客户：**客户类型（企业/个人）**、渠道、阶段、名称、公司（企业客户显示）、邮箱、电话、职位级别、部门、工作职能、**对接人分配**
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
  - **企业成员管理**（仅企业客户显示，CRUD，姓名/职位/部门/电话/邮箱）

### 3.5 商机管理（Opportunity）

- 看板式销售管道：线索 → 验证 → 方案 → 谈判 → 赢单 / 丢单
- 商机卡片显示：标题、关联客户、预计金额、成交概率、预计成交日期、负责人
- 一键移阶段（卡片底部快捷按钮）
- **拖拽换阶段**：HTML5 Drag & Drop 在列间拖动商机卡片切换阶段
- 管道总额、赢单金额、**赢单率统计卡片**
- 新建/编辑/删除商机
- **数据隔离 3 级**：admin 全部 / sales_manager 团队（递归下属）/ business 自己

### 3.6 任务看板（TaskBoard）

- 四列看板：待办 / 进行中 / 待验收 / 验收通过
- 拖拽切换状态（HTML5 Drag & Drop）+ 列高亮反馈
- **新建任务弹窗**：项目选择、标题、描述、优先级、初始状态、**指派人（项目成员列表）**、**截止日期**、附件上传
- **任务详情弹窗**：编辑标题/描述/状态/优先级/指派人/截止日期、附件管理、删除任务
- 任务卡片显示：标题、优先级 Badge、截止日期、指派人、附件数
- 搜索 + 项目筛选 + 优先级筛选

### 3.7 文件管理（File）

- **独立文件管理页**：全局文件列表（跨项目）、搜索、上传 / 下载 / 删除（支持无项目关联的全局文件上传）
- 文件上传（multipart/form-data，限制 50MB）
- 文件列表（按项目 + 全局）、文件类型图标区分
- 文件下载、文件删除（软删除）
- **文件在线预览**：图片（jpg/png/gif/webp/svg）、PDF（iframe）、视频（mp4/webm）、音频（mp3/wav）、文本/JSON 直接在弹窗内预览，不支持的类型仅显示下载按钮

### 3.8 消息沟通（Message）

- **项目消息**：项目内实时消息（Socket.IO）、消息气泡 + 发送者头像/昵称、连接状态指示灯
- **站内消息（Direct Message）**：用户间一对一聊天、对话列表 + 未读计数、推拉结合模式（WebSocket推送通知+客户端主动拉取内容，重连后自动补拉）、智能心跳（RTT检测动态调整间隔 15s/30s/60s）、搜索用户发起新对话
- **消息撤回**：双击自己发送的2分钟内消息可撤回，撤回后显示“XX撤回了一条消息”
- Enter 发送

### 3.9 用户管理（User，仅 admin）

- **表格式用户列表**：列包含复选框、用户ID、姓名（头像+昵称+用户名）、联系方式（手机脱敏+邮箱脱敏）、角色（颜色标签）、状态（颜色标签）、注册时间、最近登录时间、操作按钮
- **统计卡片**：顶部 4 张统计卡片（总用户/已启用/待审批/已禁用）
- **筛选栏**：搜索框（姓名/账号/手机号/邮箱）+ 角色下拉筛选 + 状态下拉筛选 + 结果计数
- **分页器**：每页 10 条，支持页码跳转、省略号、上下翻页
- **批量操作**：复选框多选 → 批量启用/批量禁用（二次确认）
- **操作列按钮**：查看详情（Eye）、编辑（Edit2）、重置密码（KeyRound，重置为 123456 需确认）、启用/禁用（Power，需确认）、审批激活（CheckCircle2）、删除（Trash2，需确认）
- **用户详情弹窗**：分组展示——基础信息（ID/用户名/昵称/性别/手机/邮箱）、权限信息（角色/状态/上级/邀请码）、操作记录（注册时间/最近登录/最后修改/地区码）
- **新增用户表单**：分组显示——基础信息（昵称/手机号/邮箱）、账号信息（用户名*/密码*）、权限信息（角色*/上级经理）；手机号/邮箱实时格式校验
- **编辑用户表单**：分组显示——基础信息（昵称/手机号/邮箱）、账号安全（新密码）、权限信息（角色/上级经理）；修改角色需二次确认
- **CSV 导出**：导出筛选后的用户列表为 CSV 文件（含 BOM 支持中文）
- **最近登录记录**：登录成功时自动记录 last_login_at 时间戳
- **空状态提示**：无用户时显示友好提示「暂无用户，去新增」
- **状态颜色标签**：启用=绿色、待审批=黄色、禁用=灰色
- **危险操作二次确认**：删除、禁用、重置密码、修改角色均弹出确认对话框
- **9 种角色选择**：admin / sales_manager / business / marketing / tech / support / member / viewer / client
- **上级经理分配**：通过 manager_id 建立团队层级树
- **注册审批制**：系统邀请码注册 → 待审批（is_active=0），管理员点击「审批激活」后可登录
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

### 3.12 数据报表（Report）

- **导出PDF**：点击“导出PDF”按钮调用浏览器打印，支持保存为PDF文件（打印时自动隐藏侧边栏/导航）
- **销售漏斗**：潜在 → 意向 → 签约 → 合作中 各阶段客户数可视化漏斗图
- **渠道分布**：各获客渠道客户数量柱状图
- **跟进趋势**：近N个月跟进记录数量折线图
- **新增客户趋势**：近N个月新增客户数量柱状图
- **合同金额趋势**：近N个月合同金额/笔数柱状图
- **统计卡片**：客户总数、新增客户、跟进次数、合同金额、**合同笔数**、**转化率**
- **时间筛选**：近 3/6/12 个月快捷切换
- admin / sales_manager / business / marketing 可见

### 3.13 全局通知系统（Notification）

- 导航栏铃铛图标 + 未读计数徽章
- 下拉通知列表（最新 30 条）+ 通知详情查看
- **分类视图**：全部 / 项目 / 任务 / 审批 / 系统 Tab 切换，支持分类未读数展示
- 点击单条标记已读 + 跳转链接
- **全部已读**：一键标记全部通知为已读
- 异步触发：工单回复、任务分配等场景自动生成通知
- **WebSocket 实时推送**：通知创建后通过 Socket.IO 即时推送到用户端，无需轮询；保留 2 分钟兜底轮询作为降级方案
- Socket 认证：连接后发送 JWT Token 加入 `user:<id>` 房间，确保通知精准投递
- **移动端推送底座**：移动端可注册设备令牌，通知创建后在站内消息之外尝试调用 FCM 推送（未配置 `FCM_SERVER_KEY` 时自动跳过）

### 3.13.1 个人工作台（Workspace）

- **我的待办**：展示当前用户负责的未完成任务，按优先级和截止时间排序
- **即将到期**：展示 3 天内到期的任务，突出今日/紧急状态
- **我的项目**：展示我参与项目的近期动态、进行中任务数、完成进度
- **待审批**：企业创建者/管理员可直接看到待处理的加入企业申请
- **聚合接口**：`GET /api/dashboard/workspace`

### 3.14 审计日志（Audit Log，仅 admin）

- 自动记录关键操作（创建/更新/删除/登录/登出）
- 记录用户、操作类型、对象类型、IP 地址
- 管理员查看页：操作类型筛选 + 对象类型筛选 + **日期范围筛选** + **关键词搜索**（操作详情/用户名/昵称） + 分页
- **导出CSV**：按当前筛选条件导出全部日志为 CSV 文件（含 BOM 支持 Excel 中文显示）
- **双视图**：支持表格 / 时间轴切换，时间轴按日期分组展示事件流

### 3.15 系统配置（Settings，仅 admin）

- **配置分组展示**：基础设置（系统名称/欢迎消息/上传限制/默认语言）、通知设置（邮件通知/系统通知/消息提醒/任务到期通知）、显示设置（主题色/语言/分页数/日期格式）、业务设置（任务优先级/跟进提醒/合同到期提醒/客户阶段/商机阶段）、安全设置（邀请码/登录尝试次数/会话超时/密码最小长度/IP白名单）
- 键值对形式存储，分组卡片式统一管理

### 3.16 PWA 离线支持

- **Web App Manifest**：支持“添加到主屏幕”，standalone 模式运行，自定义图标和主题色
- **Service Worker**：HTML导航 network-first（确保部署后立即生效）、哈希静态资源 cache-first、API/WebSocket 不缓存
- **离线降级**：网络不可用时从缓存加载页面，确保基本可用性
- **自动更新**：新版本部署后自动清理旧缓存，`skipWaiting` + `clients.claim` 确保即时生效

### 3.17 合作方管理（Partner，仅 admin）

- **合作方列表**：卡片式展示，显示名称、地址、状态（在线/离线）、API Key（脱敏+显示/隐藏切换）、备注
- **添加/编辑合作方**：名称、程序地址（URL）、API Key、权限选择（clients:read/write, projects:read/write, webhook）、备注
- **API Key 管理**：创建时自动生成、复制、重置（二次确认）、脱敏显示
- **打开程序**：配置地址后可直接在 DuiJie 内通过 iframe 打开合作方程序，支持全屏/刷新/新窗口打开
- **嵌入容错**：对方禁止 iframe 嵌入时自动显示友好提示 + 新窗口打开按钮
- **启用/禁用**：一键切换合作方状态
- **开放 API**：合作方通过 `X-API-Key` Header 调用 DuiJie 开放接口（客户查询/创建、项目查询、Webhook 接收）
- **代理请求**：DuiJie 后端可代理请求到合作方 API（`/api/partners/:id/fetch`），解决跨域问题
- **连接测试**：测试 DuiJie 到合作方接口的连通性

### 3.18 企业管理（Enterprise）

- **创建企业**：用户自行创建企业，创建者自动成为最高管理员（creator角色）
- **角色权限体系**：三级角色 creator > admin > member
  - **创建者**：编辑企业信息、删除企业、管理成员角色、审批加入申请、管理部门/成员
  - **管理员**：审批加入申请、管理部门/成员
  - **普通成员**：只读查看企业信息
- **完整工商信息**：统一社会信用代码、18位）、法定代表人、注册资本、成立日期、经营范围、企业类型（11种）、官网、行业、规模、联系方式
- **成员角色徽章**：成员卡片显示角色标签（紫色创建者/蓝色管理员/灰色成员）+ 左侧色条
- **角色管理**：创建者可通过下拉菜单切换成员角色（admin/member）
- **加入企业**：搜索企业名称后提交加入申请，管理者审批后成为普通成员
- **部门管理**：CRUD + 子部门、组织架构树展示
- **成员管理**：添加/编辑/删除成员、手机号导入已注册账号、工号/职位/部门/入职日期
- **系统管理员视角**：系统admin可查看所有企业信息（只读），展开查看企业详情和成员列表，不可移除企业人员
- **前端组件架构**：模块化拆分为11个文件
  - `constants.ts` - 样式常量、选项列表、角色配置
  - `useEnterprise.ts` - 自定义Hook（状态管理+API调用）
  - `EnterpriseCard.tsx` - 企业信息卡片
  - `MemberList.tsx` - 成员列表Tab
  - `DepartmentList.tsx` - 部门管理Tab
  - `OrgTree.tsx` - 组织架构树Tab
  - `JoinRequests.tsx` - 加入申请审批Tab
  - `AdminAllEnterprises.tsx` - 系统管理员全部企业视图
  - `EmptyState.tsx` - 空状态（创建/加入企业）
  - `EnterpriseModals.tsx` - 编辑企业/成员/部门弹窗
  - `index.tsx` - 主编排器

### 3.19 API 自动化测试

- **框架**：Jest + supertest
- **运行**：`cd server/duijie && npm test`
- **架构**：`app.js` 导出可测试Express实例，`standalone.js` 为启动层
- **测试用例**（24个）：
  - `auth.test.js`：登录验证（空凭据/错误密码拒绝）、Token认证、角色权限守卫
  - `enterprise.test.js`：企业CRUD全流程（创建/查询/更新/删除）、部门CRUD、成员CRUD、系统管理员权限

### 3.20 统一输入校验层

- **框架**：express-validator
- **校验中间件**：`validate.js` 统一处理校验错误，返回400+中文错误信息
- **校验规则**：`validators.js` 集中定义，覆盖16个关键路由
  - 认证：登录（用户名/密码必填）、注册（手机号/邮箱格式）、个人资料
  - 企业：创建/更新（名称必填、信用代码18位、邮箱/电话格式）
  - 成员：添加/更新（姓名必填、电话/邮箱格式）、角色变更（admin/member枚举）
  - 部门：添加/更新（名称必填、parent_id整数）
  - 客户/项目/消息：名称/标题/内容必填+长度限制

### 3.21 结构化日志系统

- **框架**：winston
- **配置**：`config/logger.js`
- **日志级别**：error > warn > info > debug（环境变量 `LOG_LEVEL` 控制）
- **输出**：
  - 控制台：彩色格式化输出
  - `logs/error.log`：仅错误级别，5MB轮转，保留5份
  - `logs/combined.log`：全部级别，10MB轮转，保留5份
- **覆盖范围**：运行时文件中48处console调用替换为分级logger

### 3.22 数据库迁移系统

- **迁移表**：`schema_migrations`（version唯一键 + applied_at时间戳）
- **迁移运行器**：`scripts/migrate.js`，自动检测并执行未运行的迁移
- **迁移文件**：`migrations/` 目录，按版本号排序的 `.sql` 文件
- **运行**：`cd server/duijie && npm run migrate`
- **部署集成**：`deploy_update.py` 自动上传迁移文件并执行运行器

### 3.23 前端全局状态管理

- **框架**：Zustand
- **Store**：`stores/useUserStore.ts`
- **管理内容**：用户信息、登录状态检查、登出、资料更新
- **持久化**：自动同步 localStorage 缓存（`cached_user`）
- **使用方式**：App.tsx 初始化 + Layout.tsx 读取用户 + useEnterprise 读取角色
- **优势**：消除 App/Layout 中重复的 localStorage 读写逻辑，单一数据源

### 3.24 前端性能优化

- **路由级代码分割**：React.lazy + Suspense，14个页面模块独立打包，首屏JS体积从988KB降至414KB（减少58%）
- **骨架屏组件**：`Skeleton` / `SkeletonCard` / `SkeletonList` / `SkeletonDashboard`，替代转圈加载提升感知速度
- **全局命令面板**：`Ctrl+K` 快捷键打开，支持页面跳转、快捷操作，模糊搜索 + 键盘导航 + 角色过滤
- **虚拟滚动**：审计日志表格使用 `@tanstack/react-virtual` 虚拟化渲染，每页200条仅渲染可视区域 DOM，60fps 滚动
- **乐观更新**：任务看板拖拽、商机移阶段操作即时更新 UI，后台异步提交，失败自动回滚

### 3.25 实时数据同步

- **WebSocket 数据广播**：后端在项目/客户/任务/商机/工单/文件的增删改操作后，通过 Socket.IO 广播 `data_changed` 事件
- **广播工具**：`atomic/utils/broadcast.js`，统一 `broadcast(entity, action, meta)` 接口，已接入12个写操作控制器
- **前端自动刷新**：`useLiveData` Hook 监听 `data_changed` 事件，匹配当前页面关注的实体类型后自动 refetch
- **Tab 焦点刷新**：用户从其他标签页切回时，自动拉取最新数据（5秒节流防抖）
- **已接入页面**：仪表盘、项目管理、客户管理、任务看板、商机管理、工单系统、文件管理
- **路由预加载**：登录后利用 `requestIdleCallback` 后台预加载所有路由 chunk，消除导航切换时的 JS 下载延迟

### 3.26 权限组件化 (RBAC)

- **配置文件**：`stores/permissions.tsx`，统一定义35个权限项和9种角色的映射
- **纯函数**：`can(role, permission)` — 任何位置可调用
- **Hook**：`usePermission(permission)` — 自动读取当前用户角色
- **组件**：`<Can action="project:edit">内容</Can>` — 声明式条件渲染
- **已接入模块**：App路由、Dashboard、项目管理、客户管理、商机管理、任务看板、工单系统、员工分配过滤
- **优势**：新增角色或调整权限只需修改配置文件，无需全局搜索替换

### 3.27 项目级权限（双身份模型）

- **第一身份（平台角色）**：`voice_users.role`，决定全局菜单可见性和操作权限（admin/member/tech/business…）
- **第二身份（项目企业角色）**：企业可创建自定义角色（如"项目经理"/"开发组长"），分配给成员并绑定到具体项目
- **数据库**：`duijie_project_members.enterprise_role_id` 关联 `enterprise_roles` 表的 8 个权限字段
- **权限判断流程**：项目内操作先查项目级企业角色权限，无角色则降级为平台角色判断
- **后端**：`projectPerms.js` 工具函数 `getProjectPerms(userId, projectId)`，`GET /api/projects/:id/my-perms` 接口
- **前端**：`useProjectPerms` Hook 获取当前用户在项目中的有效权限，`ProjectDetail` 根据项目角色动态控制编辑/删除/任务管理按钮
- **成员管理UI**：添加成员时可选企业角色，已有成员可修改角色，成员列表和详情显示角色标签
- **使用场景**：member 在项目外只有查看权限，被分配"项目经理"角色后在该项目内可编辑项目、管理任务

### 3.28 安全防护系统

**应用层防护：**
- **密码 bcrypt 哈希**：所有密码存储和验证均使用 bcrypt（兼容明文旧数据自动升级）
- **TOTP 两步验证（2FA）**：支持用户在个人资料中生成验证器密钥、启用/关闭动态验证码校验；登录/验证码登录在密码或验证码校验成功后进入二次验证挑战流程
- **登录暴力破解防护**：登录 15 分钟/10 次，注册 1 小时/5 次
- **API 速率限制**：全局每 IP 每 15 分钟最多 300 次
- **Helmet 安全响应头**：X-Content-Type-Options、X-Frame-Options、X-XSS-Protection
- **CORS 白名单**：仅允许已知来源
- **XSS 输入过滤**：所有 API 请求的 body/query 自动 sanitize
- **Bot/爬虫检测**：封禁异常 User-Agent（scrapy/sqlmap/nikto 等）+ 攻击路径拦截
- **错误信息脱敏**：生产环境不暴露内部错误详情
- **SQL 参数化查询**：全部使用 `?` 占位符，防止 SQL 注入
- **JWT 认证**：Bearer Token + HttpOnly Cookie 双模式

**Nginx 层防护：**
- **Nginx 限速**：API 每秒 10 次（burst 20），登录每秒 1 次（burst 3）
- **连接数限制**：每 IP 最多 30 个并发连接
- **隐藏服务器版本**：`server_tokens off`
- **攻击路径封禁**：.env/.git/wp-admin/phpmyadmin 等直接返回 444
- **爬虫 UA 封禁**：scrapy/curl/wget/sqlmap/nmap 等直接 403
- **超时保护**：代理连接 10s、读写 30s

**服务器层防护：**
- **fail2ban 自动封禁**：SSH 暴力破解（5次/10分钟→封 1小时）、Nginx 限速触发（10次/分钟→封 10分钟）、恶意爬虫（5次/分钟→封 24小时）

### 3.20 移动端适配

- **响应式布局**：侧边栏 → 抽屉式（overlay + 遮罩 + 自动收起）
- **自适应网格**：客户/项目卡片根据屏幕宽度自动调整列数
- **弹窗适配**：Modal 最大宽度 `calc(100vw - 24px)`
- **横向滚动**：客户阶段 Tab、任务看板列
- **内容间距**：移动端自动缩小 padding
- **自定义 Hook**：`useIsMobile(breakpoint=768)` 检测移动端
- **Capacitor 推送桥接**：登录后原生 App 自动尝试注册 Push 权限并把设备令牌回传后端；退出登录时自动注销设备令牌
- **Android 预留配置**：`android/app/build.gradle` 已兼容 `google-services.json` 存在时自动启用 Google Services 插件

---

## 四、API 接口清单

所有接口前缀：`/api`，通过 Bearer Token 携带 JWT 认证。

### 4.1 认证（Auth）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/auth/login` | 登录 | 公开 |
| POST | `/api/auth/send-code` | 发送验证码（手机/邮箱） | 公开 |
| POST | `/api/auth/login-by-code` | 验证码登录 | 公开 |
| POST | `/api/auth/verify-code` | 校验验证码 | 公开 |
| POST | `/api/auth/register` | 注册（支持邀请码） | 公开 |
| GET | `/api/auth/register-config` | 注册配置（是否需要邀请码） | 公开 |
| POST | `/api/auth/forgot-password` | 找回密码-发送验证码 | 公开 |
| POST | `/api/auth/reset-password` | 找回密码-重置密码 | 公开 |
| POST | `/api/auth/logout` | 登出 | 公开 |
| GET | `/api/auth/me` | 当前用户信息 | 认证 |
| PUT | `/api/auth/profile` | 更新个人资料 | 认证 |
| POST | `/api/auth/2fa/login/verify` | 登录二次验证（challenge_token + TOTP） | 公开 |
| GET | `/api/auth/2fa/status` | 查询当前用户 2FA 状态 | 认证 |
| POST | `/api/auth/2fa/setup` | 生成验证器密钥 | 认证 |
| POST | `/api/auth/2fa/enable` | 启用 2FA | 认证 |
| POST | `/api/auth/2fa/disable` | 关闭 2FA | 认证 |

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
| GET | `/api/dashboard/workspace` | 个人工作台聚合数据（待办/项目动态/待审批/即将到期） | 认证 |
| GET | `/api/dashboard/report` | 报表数据 | 认证 |
| GET | `/api/dashboard/chart` | 图表数据（支持 days 参数） | 认证 |

### 4.4 项目管理（Project）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/projects` | 创建项目 | 认证 |
| GET | `/api/projects/export` | 导出项目列表（CSV） | 认证 |
| GET | `/api/projects` | 项目列表（admin 全量；business 按负责客户或参与项目；其余角色：JWT 含 `clientId` 时可见该客户下全部项目，否则仅参与/创建的项目） | 认证 |
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
| GET | `/api/tasks/export` | 导出任务列表（CSV） | staff |
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
| PATCH | `/api/dm/:id/recall` | 撤回消息（2分钟内） | 认证 |

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
| PATCH | `/api/notifications/:id/read` | 标记已读（id=all全部已读） | 认证 |
| POST | `/api/notifications/devices` | 注册移动设备令牌 | 认证 |
| POST | `/api/notifications/devices/unregister` | 注销移动设备令牌 | 认证 |

### 4.21 合作方管理（Partner）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/partners` | 合作方列表 | admin |
| POST | `/api/partners` | 创建合作方 | admin |
| PUT | `/api/partners/:id` | 更新合作方 | admin |
| DELETE | `/api/partners/:id` | 删除合作方 | admin |
| POST | `/api/partners/:id/reset-key` | 重置 API Key | admin |
| POST | `/api/partners/:id/test` | 测试连通性 | admin |
| POST | `/api/partners/:id/fetch` | 代理请求到合作方 | admin |

### 4.22 合作方开放接口（Open API）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/open/clients` | 查询客户列表 | X-API-Key + clients:read |
| GET | `/api/open/clients/:id` | 查询单个客户 | X-API-Key + clients:read |
| POST | `/api/open/clients` | 创建客户 | X-API-Key + clients:write |
| GET | `/api/open/projects` | 查询项目列表 | X-API-Key + projects:read |
| GET | `/api/open/projects/:id` | 查询单个项目 | X-API-Key + projects:read |
| POST | `/api/open/webhook` | 接收 Webhook 事件 | X-API-Key + webhook |

项目列表、详情、导出与企业项目接口均返回双方企业字段：`internal_client_id`、`internal_client_name`、`internal_client_company`、`client_id`、`client_name`、`client_company`。

---

## 五、数据库表结构

数据库：`duijie_db`，共 25 张表。

| 表名 | 说明 |
|------|------|
| `voice_users` | 用户表（id, username, password, nickname, email, phone, avatar, role, client_id, manager_id, last_login_at, totp_secret, totp_enabled） |
| `system_config` | 系统配置（JWT_SECRET, INVITE_CODE） |
| `duijie_clients` | 客户/企业表（assigned_to, credit_code, legal_person, registered_capital, established_date, business_scope, company_type, website） |
| `duijie_opportunities` | 商机表（title, client_id, amount, probability, stage, assigned_to） |
| `duijie_direct_messages` | 站内消息表（sender_id, receiver_id, content, read_at, is_recalled） |
| `duijie_tickets` | 工单表（title, content, type, priority, status, project_id, assigned_to, rating） |
| `duijie_ticket_replies` | 工单回复表（ticket_id, content, created_by） |
| `duijie_projects` | 项目表（internal_client_id, client_id, status, progress, app_name, app_url） |
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
| `duijie_notifications` | 通知表（user_id, type, category, title, content, link, is_read） |
| `duijie_audit_logs` | 审计日志表（user_id, username, action, entity_type, entity_id, detail, ip） |
| `duijie_client_members` | 企业成员表（client_id, user_id, name, role[creator/admin/member], position, department_id, phone, email） |
| `duijie_departments` | 部门表（client_id, name, parent_id, sort_order） |
| `duijie_join_requests` | 加入企业申请表（client_id, user_id, status[pending/approved/rejected]） |
| `duijie_device_tokens` | 移动设备令牌表（user_id, platform, device_token, app_version, is_active, last_seen_at） |

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
│   │       ├── dm/                    # 站内消息（5）：conversations, history, send, users, recall
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

## 十、快速启动

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

## 十一、统计数据

| 指标 | 数值 |
|------|------|
| 后端控制器模块 | 21 个 |
| API 端点 | 90+ 个 |
| 数据库表 | 22 张 |
| 用户角色 | 9 种（admin / sales_manager / business / marketing / tech / support / member / viewer / client） |
| 前端功能模块 | 17 个 |
| 共享 UI 组件 | 11 个 |
| 前端路由 | 14 条 |
| 版本迭代 | 103 个（v1.0.0 ~ v1.1.2，详见 CHANGELOG.md） |
