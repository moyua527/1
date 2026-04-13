# DuiJie（对接）— 客户项目对接平台

> 版本：v1.4.28 | 最后更新：2026-04-12
>
> 线上地址：http://160.202.253.143:8080

> 扩展文档：`ARCHITECTURE_GUIDE.md`（系统架构、模块关系、前端页面框架与项目管理操作说明）

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
| 邮件服务 | Nodemailer + SMTP（163 邮箱） |
| 进程管理 | PM2（生产环境） |
| Web 服务器 | Nginx（反向代理） |
| 容器化 | Docker + docker-compose |
| CI/CD | GitHub Actions（APK 构建 + 后端测试 + 生产部署） |

- **列表搜索防抖**：需求看板、客户管理、联系人、知识库文章列表、站内消息「添加好友」用户搜索等输入框采用 300ms debounce（`useDebounce`），输入仍即时显示，过滤或请求在防抖后执行。

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
| **admin** | 管理员 | 全部功能，含用户管理、数据报表、邀请码管理、系统配置 |
| **member** | 成员 | 基本业务功能：项目/客户/任务（具体能力由企业权限和项目权限决定） |

> 注：代码中 `permissions.tsx` 现在只保留 admin 和 member 两个平台基线权限。具体业务能力通过**企业权限**（企业内自定义角色）和**项目权限**（项目内自定义角色）两层叠加控制。权限判定优先级：项目角色 > 企业角色 > 基础角色。

### 项目角色系统

企业内所有项目共享一套项目角色（`project_roles` 表，通过 `enterprise_id` 关联），支持自定义角色名称、颜色和 **60 项细粒度权限开关**，按 17 个分组管理：

| 分组 | 权限数 | 包含字段 |
|------|--------|----------|
| 项目信息管理 | 4 | can_edit_project_name / desc / status, can_delete_project |
| 关联客户企业 | 3 | can_send_client_request, can_cancel_client_link, can_change_client_link |
| 我方成员管理 | 5 | can_add_member, can_assign_member_legacy/ent/proj_role, can_remove_member |
| 修改成员角色 | 3 | can_update_member_legacy/ent/proj_role |
| 客户方成员 | 3 | can_view_client_users, can_add/remove_client_member |
| 加入审批 | 3 | can_view_join_requests, can_approve_join, can_reject_join |
| 角色管理 | 5 | can_create_role, can_edit_role_name/color/perms, can_delete_role |
| 任务创建 | 2 | can_create_task, can_create_task_with_attachment |
| 任务删除与恢复 | 3 | can_delete_task, can_view_task_trash, can_restore_task |
| 任务状态流转 | 7 | can_move_task_accept/dispute/supplement/submit_review/reject/approve/resubmit |
| 任务编辑 | 5 | can_edit_task_title/desc/priority/deadline, can_assign_task |
| 任务附件 | 2 | can_upload/delete_task_attachment |
| 审核要点 | 3 | can_add/respond/confirm_review_point |
| 任务预设标题 | 4 | can_view_title_options, can_record/delete_title_history, can_edit_title_presets |
| 报表 | 2 | can_view_report, can_export_data |
| 应用/集成 | 2 | can_manage_app_config, can_manage_app_integration |

- 企业首次使用时自动创建 3 个默认角色：**负责人**（全部 60 项权限）、**编辑者**（任务相关 27 项）、**查看者**（无权限）
- 项目级也有 3 个默认角色：**创建者**（全部权限，不可编辑/删除）、**项目编辑**、**项目查看**；`ensureDefaultProjectRoles` 按 `role_key` 检查缺失的默认角色并自动补充，旧项目访问时也会自动补齐
- 企业角色（enterprise_roles）仍保留 16 个旧字段，在代码层自动映射展开为 60 个字段
- 权限判定优先级：项目角色 > 企业角色（映射展开） > 企业管理人员 > 遗留角色回退
- 企业设置页"项目角色"Tab 提供角色 CRUD 管理界面，以色块圆圈网格展示，点击查看权限详情
- 企业级 API：`GET/POST /api/my-enterprise/project-roles`、`PUT/DELETE /api/my-enterprise/project-roles/:roleId`
- 项目级兼容 API：`GET /api/projects/:id/roles`（自动合并企业级角色）

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
| business | 业务员 | member |
| tech | 技术员 | member |
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
- **注册后引导**：新用户注册后显示「项目邀请码入口」页面（ProjectOnboarding），可输入邀请码搜索并申请加入项目；无需先创建/加入企业即可开始协作
- **项目邀请链接**：支持 `/join/:code` 路由，分享链接让外部人员直接加入项目；未登录时自动保存链接，登录后自动跳转
- **登录方式 Tab**：「账号密码」和「邮箱登录」两种方式切换；账号密码模式输入用户名+密码；邮箱登录模式输入邮箱+验证码（SMTP 实时发送）
- **注册流程**：第一步邮箱验证（输入邮箱→发送验证码→输满6位自动验证）→ 第二步设置昵称（2~6字符）、用户名（英文+数字，3~20位，用于登录）、密码（英文+数字，至少8位）
- **账号字段规则**：昵称（显示名，不限字体，上限6字符）、用户名（登录用，只能英文+数字，可修改）、个人ID（系统生成，不可修改）、密码（英文+数字，修改时不能与旧密码相同）
- **邀请码机制**：管理员可在用户管理页开启/关闭/修改邀请码
- **用户协议**：登录/注册前需勾选同意《用户服务协议》和《隐私保护政策》，点击可查看全文弹窗，未勾选时显示红色提示
- **找回密码**：登录页"忘记密码？"入口 → 两步流程：第1步选择手机号/邮箱验证身份（发送验证码），第2步输入新密码+确认密码（含密码强度指示器）→ 重置成功自动跳转登录
- **SMTP 邮件验证码**：邮箱类型验证码（登录/注册/找回密码）通过 SMTP 实际发送邮件（163 邮箱），包含品牌化 HTML 邮件模板；SMTP 未配置时自动降级为日志记录，不影响业务流程
- **个人资料**：侧边栏点击头像 → 查看个人信息（昵称/邮箱/手机/性别/职位/部门/工号/角色/注册时间/邀请码），点击「编辑资料」按钮进入编辑模式修改昵称/邮箱/手机号/密码；移动端"我的"页点击头像卡片进入微信风格个人资料页，支持头像上传、昵称编辑弹窗、性别选择底部弹窗、手机号脱敏展示，跳转绑定手机/邮箱
- **用户设置三Tab**：「账号与安全」（密码/设备/绑定手机邮箱/登录日志）、「偏好设置」（外观主题/声音提示及音量/语言时区）、「通知设置」（按模块分组：需求管理/项目管理/客户管理/系统安全，每组独立开关+计数器）
- **登录日志**：自动记录每次登录（密码/验证码）的时间、IP、设备名、登录方式、成功/失败状态；PC端账号设置直接展示最近10条，移动端账号安全→登录日志子页；数据库 `duijie_login_logs` 表，API `GET /api/auth/login-logs`
- **邀请注册流程**：管理员生成邀请链接 → 品牌化落地页（`/invite/:token`）展示邀请人信息 → 分步注册（邮箱验证→填写姓名和密码→同意协议）→ 注册成功自动登录跳转；兼容旧`/?invite=`格式
- **侧边栏悬浮反馈**：桌面端左侧导航项、个人资料入口与登出按钮支持鼠标悬浮高亮，当前激活项保持选中态不被 hover 覆盖
- **侧边栏分组折叠**：四大分组（工作台/协作业务/组织管理/系统）标题可点击折叠/展开，带 chevron 指示器和平滑动画，折叠状态持久化到 localStorage
- **侧边栏收藏功能**：鼠标悬停导航项时出现星标按钮，点击可将页面固定到侧栏顶部「收藏」区；移动端服务页同步支持收藏（星标始终可见），收藏列表持久化到 localStorage

### 3.2 首页（Dashboard）

- **项目概况卡片**：总项目、规划中、进行中、已完成（点击跳转项目列表）
- **业务概况卡片**：客户总数（需 `dashboard:clients` 权限）、总需求、待办需求（需 `dashboard:tasks` 权限）
- **工作台区块**（WorkspaceSection）：我的待办（按优先级排序，最多10条）、即将到期（3天内到期的任务）、我的项目（最近更新的参与项目，含进度条）、待审批（企业加入申请+项目客户关联请求）
- **数据趋势图表**（Recharts 懒加载）：需求趋势面积图（新建/完成）、需求状态分布饼图、新增客户柱状图、商机阶段分布图（数量+金额双轴）
- **时间筛选**：7天 / 30天 / 90天 快捷切换，图表自动补全缺失日期
- **销售漏斗**：客户阶段分布（潜在/意向/签约/合作中/流失），带进度条和点击筛选
- **跟进提醒**：过期跟进数 + 3天内需跟进数，红/黄色警告卡片
- **最近动态**：最近跟进记录（5条）+ 最近合同（5条，含状态标签）
- **客户端视图**：client 角色显示独立 ClientDashboard
- **移动端适配**：项目概况/业务概况用紧凑数字网格布局，左上角九宫格快捷导航菜单
- **数据隔离**：admin 全部 / member 按企业权限与项目权限控制可见范围

### 3.3 项目管理（Project）

- 项目列表：筛选（状态/客户）、搜索、分页、响应式网格
- **项目ID加入**：项目卡片显示项目ID并支持一键复制；列表页支持通过项目ID搜索项目并提交加入申请
- 新建项目：名称、描述、**客户关联（必填）**、日期、预算、**固定功能名称预设（每行一个，用于任务标题快速选择）**
- **创建权限**：admin 可直接创建；member 需具备企业权限 `can_create_project`
- **数据隔离**：admin 全部 / member 仅参与的项目（企业权限可扩展可见范围）
- **创建时添加成员**：新建项目弹窗支持多选团队成员（复选框列表 + 头像 + 昵称 + 角色标签），创建后自动添加为 editor 角色
- **客户自动入组**：创建项目时自动将关联客户的 user_id 添加为项目成员（viewer 角色）
- **关联应用（小程序模块）**：新建项目时可选填应用名称 + 应用链接，项目详情自动显示应用Tab
- **任务标题预设维护**：项目详情的编辑项目弹窗支持维护固定功能名称列表，任务创建时可直接作为预设标题使用
- 项目详情（Tab 页签，**URL 持久化**，5 个标签：需求/资料库/待办/消息/设置，多开标签行含「首页」按钮回到项目列表，**各标签页有新内容时显示红点提示**，**项目标签支持拖拽排序**）：
  - **设置页**内含：项目概览、项目备注、项目成员、角色管理、关联应用、加入申请、编辑项目、删除项目
  - **项目概览**：6项统计卡片（总需求/已完成/已逾期/成员/文件/消息）、需求状态饼图+完成率环形图、代办进度条、最近动态时间线；API `GET /api/projects/:id/overview`
  - **角色管理**（条件Tab，项目创建者或有角色管理权限时显示）：项目级自定义角色 CRUD，60 项细粒度权限，由项目创建者直接在项目内管理，独立于企业
  - **任务**：任务列表 + 内联添加 + 状态切换下拉（无编辑权限时只读）+ **任务标题双模式选择器（固定功能名 / 自由输入历史）** + **历史标题自动记忆与删除** + 项目内任务变更实时刷新 + 创建时间精确到秒 + 图片附件缩略图预览/文件直链下载 + 任务描述区支持 Ctrl+V 粘贴图片/文件且不会重复添加
  - **文件**：上传 + 列表 + 下载 + 删除
  - **消息**：实时聊天（Socket.IO）+ 发送者昵称显示
  - **应用**（条件Tab）：当项目关联了应用链接时显示，iframe 内嵌外部应用 + 支持新窗口打开
- **加入审批**：项目管理成员可查看项目加入申请并执行批准 / 拒绝
- 项目编辑、软删除

### 3.4 客户管理（Client）

- 客户列表：**阶段下拉筛选**（URL 持久化）+ 搜索（客户名称/公司/电话/邮箱/渠道） + 客户评分 + **客户类型标签（企业/个人）** + 响应式网格卡片
- 新建客户：**客户类型（企业/个人）**、客户名称、公司（企业客户必填）、邮箱、电话、渠道（必填）、阶段、**对接人分配**；企业客户额外支持**搜索平台已注册企业**并发送添加请求
- 编辑客户：在新建字段基础上增加 **职位级别、部门、工作职能、备注**，且邮箱/电话/职位级别/部门/工作职能为必填
- CSV 导入/导出
- **对接人分配**：创建/编辑时可选择负责业务员，卡片和详情页显示对接人
- **数据隔离**：admin 全部 / member 按企业权限控制可见范围
- 客户详情页：
  - 基本信息编辑（含对接人分配）
  - 联系人管理（CRUD）
  - 合同管理（CRUD）
  - 跟进记录（电话/微信/拜访/邮件/其他）（支持编辑/删除）
  - 标签管理
  - 客户评分（A-E 等级，五维度雷达：跟进活跃/合同价值/阶段进展/联系人/信息完整）
  - 变更历史日志
  - AI 跟进建议
  - **企业成员管理**（仅企业客户显示，CRUD，姓名/职位/角色/部门/电话/邮箱）
  - **合作企业资料 Tab**（仅企业客户显示）：通过 `GET /api/enterprises/:id/profile` 获取合作企业的组织数据
    - **组织成员**：卡片式展示对方企业成员（姓名/职位/角色/部门/电话），点击查看详情弹窗
    - **部门架构**：树状展示对方企业部门结构，显示各部门成员数
    - **共享项目**：列出两个企业之间的关联项目，可点击跳转项目详情
    - **企业工商信息**：展示行业、规模、统一社会信用代码、法定代表人、注册资本、成立日期、经营范围、网站等
  - **访问控制**：合作企业资料仅在双方有项目关联或审批通过的客户请求时可见

### 3.5 商机管理（Opportunity）（未在前端导航中展示，API 保留）

- 看板式销售管道：线索 → 验证 → 方案 → 谈判 → 赢单 / 丢单
- 商机卡片显示：标题、关联客户、预计金额、成交概率、预计成交日期、负责人
- 一键移阶段（卡片底部快捷按钮）
- **拖拽换阶段**：HTML5 Drag & Drop 在列间拖动商机卡片切换阶段
- 管道总额、赢单金额、**赢单率统计卡片**
- 新建/编辑/删除商机
- **数据隔离**：admin 全部 / member 按企业权限控制可见范围

### 3.6 需求看板（TaskBoard）

- **卡片网格布局**：响应式网格展示全部项目的需求（非列式看板），六种状态：已提出 / 待补充 / 执行中 / 待验收 / 验收不通过 / 验收通过
- **状态切换**：在项目「需求」Tab 中通过工作流操作切换（调用 `/tasks/:id/move`），全局看板为只读展示
- **新建任务弹窗**：项目选择、**任务标题双模式选择器（固定功能名 / 自由输入历史）**、描述、优先级、初始状态、**指派人（项目成员列表）**、**截止日期**、附件上传（拖拽 + 点击 + Ctrl+V 粘贴）
- **任务标题历史**：按用户 + 项目维度记录自由输入标题，创建成功后自动写入历史，可在选择器中复用和删除
- **任务详情弹窗/页面**：查看标题/描述/状态/优先级/截止日期/附件、**扩展属性编辑**（自定义字段）、创建人/创建时间（精确到秒）、**催办按钮**（向负责人发送应用内+推送通知，30分钟冷却防骚扰）；移动端点击卡片打开独立详情页面（`TaskDetailPage`），桌面端打开模态弹窗（`TaskDetailModal`）
- **仿微信图片上传预览**：**项目内需求 Tab 创建流程**中，选择图片后先进入全屏预览（`ImageUploadPreview`），底部工具栏提供"编辑"/"原图"/"确定"三选项，支持左右切换多图、底部缩略图条，可选进入图片编辑器（画笔/文字/裁剪/马赛克）
- **需求导出 Excel**：导出当前账号可见范围内的任务列表为 Excel，可按项目过滤
- 任务卡片显示：标题、项目名+状态 Badge、优先级 Badge、截止日期、指派人、附件缩略图/文件链接
- 搜索 + 项目筛选 + 优先级筛选 + 状态筛选

### 3.7 文件管理（File）

- **全局文件管理页**（`/files`）：跨项目全局文件列表、搜索（文件名/项目名）、分类筛选（图片/文档/表格/音视频/其他）+ 分类计数、上传/下载/删除（支持无项目文件）、多选批量删除、移动端菜单
- **项目资料库**（项目详情 Tab）：
  - **分类筛选**：图片/文档/网址/表格/音视频/其他，用于列表筛选；上传类型由「添加」弹窗内的类型按钮决定；「管理」模式用于多选删除
  - **网址书签**：添加网址（标题 + URL + 引导备注），以 `text/x-url` 存储
  - **文字笔记**：添加文字内容（标题 + 正文），以 `text/x-note` 存储
  - **资料组**：支持多种类型内容（网址/文字/文件/图片）；创建时可设置可见性（全部可见/指定成员）；仅创建人可添加/删除内容、修改可见性、删除资料组
- 文件上传（multipart/form-data，单文件最大 100MB；前端多选后逐个请求上传）
- 文件列表（按项目 + 全局）、文件类型图标区分
- 文件下载、文件删除（软删除）
- **文件在线预览**：图片（jpg/png/gif/webp/svg/bmp）、PDF、视频（mp4/webm）、音频（mp3/wav/ogg）、文本/JSON/CSV 通过 iframe 内嵌预览，不支持的类型仅显示下载按钮

### 3.8 消息（Message）

- **项目消息**：项目内实时消息（Socket.IO）、消息气泡 + 发送者头像/昵称、连接状态指示灯（桌面端显示，移动端隐藏）、支持发送文字/图片/文件、图片发送前支持裁剪编辑、拖拽/粘贴图片上传、历史消息滚动加载（每次30条）
- **站内私信（Direct Message）**：用户间一对一聊天、对话列表 + 未读计数（红点+数字）、推拉结合模式（WebSocket推送通知+客户端主动拉取内容，重连后自动补拉）、智能心跳（RTT检测动态调整间隔 15s/30s/60s）
- **好友系统**：搜索用户（ID/手机号/用户名）→ 申请添加好友 → 对方同意/拒绝；好友列表展示；好友申请列表 + Tab 切换（私信/群聊/好友申请）
- **群聊**：创建群聊（群名 + 从好友列表选择成员）、群消息列表、群内发送文字消息、退出群聊（需确认）、群成员数显示、实时群消息推送（WebSocket `new_group_msg`）
- **消息撤回**：双击自己发送的2分钟内消息可撤回（私信和群聊均有2分钟时间限制），撤回后显示"XX撤回了一条消息"
- **用户备注名**：每个用户可为其他用户设置私有备注名（类似微信/QQ），备注名在项目成员、消息、私信、企业成员、群聊、搜索结果等全局优先显示；成员信息弹窗支持设置/修改/清除备注名；`user_nicknames` 表 + `useNicknameStore` 全局缓存
- **键盘操作**：Enter 发送，Shift+Enter 换行

### 3.9 用户管理（User，仅 admin）

- **表格式用户列表**：列包含复选框、用户（头像+昵称+用户名）、联系方式（手机脱敏+邮箱脱敏）、角色（颜色标签）、状态（颜色标签）、注册时间、最近登录时间、操作菜单（MoreVertical）
- **统计卡片**：顶部 6 张统计卡片（总账号/管理员/成员/已启用/待审批/已禁用）
- **筛选栏**：搜索框（姓名/账号/手机号/邮箱）+ 角色下拉筛选 + 状态下拉筛选 + 结果计数
- **分页器**：每页 10 条，支持页码跳转、省略号、上下翻页
- **批量操作**：复选框多选 → 批量启用/批量禁用（二次确认）
- **操作菜单**：MoreVertical 下拉菜单 → 查看详情（User图标）、编辑（Edit2）、重置密码（KeyRound，重置为 123456 需确认）、启用/禁用（Power，需确认）、审批激活（CheckCircle2，仅待审批用户显示）、删除（Trash2，需确认）
- **用户详情 Drawer**：分组展示——基础信息（用户ID/用户名/手机号/邮箱/性别/地区码）、权限信息（上级/邀请码）、操作记录（注册时间/最近登录/最后修改）；顶部展示头像+昵称+角色与状态标签
- **新增用户表单**：分组显示——基础信息（昵称/手机号/邮箱）、账号信息（用户名*/密码*）、权限信息（角色*/上级经理）；手机号/邮箱实时格式校验
- **编辑用户表单**：分组显示——基础信息（昵称/手机号/邮箱）、账号安全（新密码）、权限信息（角色/上级经理）；修改角色需二次确认
- **CSV 导出**：导出筛选后的用户列表为 CSV 文件（含 BOM 支持 Excel 中文显示）
- **最近登录记录**：登录成功时自动记录 last_login_at 时间戳
- **空状态提示**：无用户时显示「暂无用户数据」+引导新增按钮
- **状态颜色标签**：启用=绿色、待审批=黄色、禁用=灰色
- **危险操作二次确认**：删除、禁用、重置密码、修改角色均弹出确认对话框
- **2 种平台角色选择**：admin / member
- **上级经理分配**：通过 manager_id 关联上级（限 admin 角色用户）
- **邀请链接管理**：用户管理页「邀请链接」按钮 → 弹窗内生成平台成员注册链接（固定为 member）+ 有效期，支持复制/查看状态/删除
- **注册邀请码管理**：在系统设置页（非用户管理页）查看/复制/修改/关闭系统邀请码
- **角色修改即时生效**：管理员修改用户角色/状态后立即清除 auth 中间件缓存，后续请求按最新角色判定

### 3.10 客户门户（Client Portal）

- **客户专属仪表盘**（`ClientDashboard` 组件，client 角色登录后首页自动切换）：4 张统计卡片（我的项目/进行中/已完成/未读消息），点击跳转对应页面
- **我的项目**：卡片列表展示关联项目，显示项目名称、状态标签、进度条百分比、截止日期
- **我的合同**：合同列表（标题、状态标签、金额、签约日期~到期日期），仅关联合同 >0 时显示
- **最新交付文件**：文件列表展示（文件名、项目名、日期、大小），点击直接下载
- **工单系统**：客户通过独立的 `/tickets` 路由提交需求/问题/咨询工单（详见 3.11）

### 3.11 工单系统（Ticket）

- **工单类型**：需求（requirement） / 问题（bug） / 咨询（question） / 其他（other）
- **优先级**：低 / 中 / 高 / 紧急
- **状态流转**：待处理（open） → 处理中（processing） → 已解决（resolved） → 已关闭（closed）；工作人员手动点击「开始处理」「标记解决」按钮切换状态
- **新建工单**：标题、详细描述、类型、优先级、关联项目（选填）、附件上传（拖拽+点击+Ctrl+V粘贴+多文件）
- **工单详情**：描述、附件下载、回复列表（支持文字+附件）、状态变更按钮、分配处理人（下拉选择工作人员）
- **满意度评价**：工单已解决后，提交者可评分（1-5星）+ 评价内容；评价结果在工单详情和列表中展示
- **列表筛选**：状态 Tab 筛选（全部/待处理/处理中/已解决/已关闭）+ 各状态计数
- **权限控制**：客户只能查看自己提交的工单，工作人员（`ticket:staff` 权限）可看全部
- **实时更新**：通过 `useLiveData(['ticket'])` 监听工单变更事件

### 3.12 数据报表（Report）（通过首页 Dashboard API 提供，无独立路由）

- **导出PDF**：点击“导出PDF”按钮调用浏览器打印，支持保存为PDF文件（打印时自动隐藏侧边栏/导航）
- **销售漏斗**：潜在 → 意向 → 签约 → 合作中 → 流失 五阶段客户数，水平进度条 + 阶段间转化率
- **渠道分布**：各获客渠道客户数量水平条形图 + 百分比
- **跟进趋势**：选定时间范围内跟进记录数量竖向柱状图
- **新增客户趋势**：选定时间范围内新增客户数量竖向柱状图
- **合同金额趋势**：按月合同金额（万元）/笔数竖向柱状图
- **统计卡片**：6 张卡片 --- 客户总数、新增客户、跟进次数、合同金额、合同笔数、转化率（合作中/潜在）
- **时间筛选**：5 档快捷切换（近7天/近30天/近90天/近半年/近一年）
- admin 全部可见 / member 按企业权限控制可见范围

### 3.13 全局通知系统（Notification）

- **导航栏铃铛**：铃铛图标 + 未读计数徽章（超过99显示99+）
- **下拉通知面板**（`NotificationBell`）：最新 30 条通知列表 + 通知详情查看 + 跳转链接
- **分类 Tab**：3 个主分类（全部/项目/系统），各Tab显示分类未读数徽章；「项目」Tab 内按项目分组，每个项目下按子分类（需求/项目动态/审批/系统/安全）聚合展示
- **点击标记已读**：点击单条通知自动标记已读 + 打开详情
- **全部已读**：一键标记全部通知为已读
- **单条删除 / 清空全部**：支持删除单条通知或清空所有通知（清空需二次确认）
- **通知中心独立页面**（`/notifications`）：全部 / 未读筛选 + PageHeader + 完整列表展示
- **异步触发**：工单回复、任务分配、加入申请/审批、项目更新、跟进提醒等场景自动生成通知
- **WebSocket 实时推送**：通知创建后通过 Socket.IO `new_notification` 事件即时推送到用户端，无需轮询；保留 2 分钟兜底轮询作为降级方案
- **Socket 认证**：连接后发送 JWT Token 加入 `user:<id>` 房间，确保通知精准投递
- **移动端推送底座**（`MobilePushBridge`）：Capacitor 环境下注册设备令牌到 `/api/notifications/devices`，通知创建后尝试调用 FCM 推送（未配置 `FCM_SERVER_KEY` 时自动跳过）；支持推送点击跳转到对应链接

### 3.13.1 个人工作台（Workspace）

- **我的待办**：展示当前用户负责的未完成任务，按优先级和截止时间排序
- **即将到期**：展示 3 天内到期的任务，突出今日/紧急状态
- **我的项目**：展示我参与项目的近期动态、进行中任务数、完成进度
- **待审批**：企业创建者/管理员可直接看到待处理的加入企业申请
- **聚合接口**：`GET /api/dashboard/workspace`

### 3.13.2 知识库（Knowledge Base）

- **文章管理**：创建/编辑/删除文章，支持标题、正文、分类（下拉选择）、标签（逗号分隔）；文章状态分「草稿」和「已发布」；全屏编辑器模式 + 查看模式
- **分类管理**：扁平分类列表（`parent_id` 字段预留层级能力），支持新增/删除分类；桌面端左侧分类侧栏快速筛选，移动端横向滚动分类 Tab
- **全文搜索**：标题、内容、标签模糊搜索（防抖 300ms），支持状态（全部/已发布/草稿）和分类组合筛选
- **阅读统计**：每篇文章记录浏览次数（`view_count`），列表和详情页展示
- **移动端详情页**（`KnowledgeDetailPage`）：独立路由 `/knowledge/:id`，sticky 顶栏 + 编辑按钮 + 标签/分类/浏览数展示
- **分页**：每页 20 条，底部页码导航
- **权限控制**：企业内所有成员可查看，有权限的成员可创建编辑
- **数据库**：`duijie_kb_categories`（分类表）、`duijie_kb_articles`（文章表，FULLTEXT 索引）
- **API**：`/api/kb/categories`（CRUD）、`/api/kb/articles`（CRUD + 搜索 + 分页）

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
- **Service Worker v5**：HTML导航 network-first（确保部署后立即生效）、哈希静态资源 cache-first、API/WebSocket 不缓存、**缓存条目上限 100 条自动清理**
- **离线降级**：网络不可用时从缓存加载页面，确保基本可用性
- **自动更新**：新版本部署后自动清理旧缓存，`skipWaiting` + `clients.claim` 确保即时生效

### 3.17 合作方管理（Partner，仅 admin）

- **合作方列表**：卡片式展示，显示名称、程序地址、状态标签（在线/离线）、API Key（脱敏+显示/隐藏切换+复制）、备注、调用次数
- **添加/编辑合作方**：名称*、程序地址（URL）*、备注；权限字段（`permissions`）后端支持但前端表单暂未展示
- **API Key 管理**：创建时自动生成并复制到剪贴板、重置（二次确认 ConfirmDialog）、脱敏显示
- **打开程序**：配置地址后可直接在 DuiJie 内通过 iframe 打开合作方程序，工具栏支持返回/刷新/新窗口打开/全屏切换
- **嵌入容错**：对方禁止 iframe 嵌入时自动显示友好提示 + 新窗口打开按钮 + 重试按钮
- **开放 API**：合作方通过 `X-API-Key` Header 调用 DuiJie 开放接口（客户查询/创建、项目查询、Webhook 接收）
- **代理请求**：DuiJie 后端可代理请求到合作方 API（`/api/partners/:id/fetch`），解决跨域问题
 
### 3.18 企业管理（Enterprise）

- **创建企业**：用户自行创建企业，创建者自动成为最高管理员（creator角色）
- **角色权限体系**：三级角色 creator > admin > member
  - **创建者**：编辑企业信息、删除企业、管理成员角色、审批加入申请、管理部门/成员
  - **管理员**：审批加入申请、管理部门/成员
  - **普通成员**：只读查看企业信息
- **完整工商信息**：统一社会信用代码、18位）、法定代表人、注册资本、成立日期、经营范围、企业类型（11种）、官网、行业、规模、联系方式
- **成员角色徽章**：成员卡片显示角色标签（紫色创建者/蓝色管理员/灰色成员）+ 左侧色条
- **角色管理**：创建者可通过下拉菜单切换成员角色（admin/member）
- **加入企业双通道**：加入企业弹窗支持先选择企业，再决定是否填写推荐码；不填推荐码时保持原有申请→审批流程
- **推荐码直入**：企业创建者/管理员可查看并重置企业推荐码；用户填写正确推荐码后可直接加入企业，同时后台生成通知与审计日志
- **企业搜索联想**：加入企业弹窗默认以下拉框展示平台可加入企业；输入企业名称关键字时实时按包含关系筛选并自动联想，无需点击搜索；单字按包含该字匹配，多字中文按“整词包含或每个字都包含”匹配；输入筛选结果下拉最多显示 5 条
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
- **测试文件**（25个）：`auth` / `enterprise` / `invite` / `file` / `opportunity` / `client` / `contract` / `partner` / `search` / `system` / `isolation` / `ticket` / `followUp` / `task` / `dashboard` / `project` / `user` / `dm` / `knowledge` / `loginLogs` / `message` / `notification` / `contact` / `ai` / `tag`

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
- **Tab 懒加载**：ProjectDetail 各 Tab（TaskTab/TodoTab/FileTab/SettingsTab/OverviewTab/StatsTab/ActivityTab）独立 chunk 按需加载（主 bundle 从 218KB 降至 39KB）
- **图表独立打包**：Recharts 单独 vendor-charts chunk（约 400KB），独立缓存不随业务代码变化
- **图片懒加载**：列表中的缩略图使用 `loading="lazy"` 延迟加载
- **API 聚合**：项目详情页 4 个串行请求合并为 1 个 `/api/projects/:id/bundle`
- **Dashboard 并行查询**：9 个串行 SQL 改为 `Promise.all` 并行执行
- **渐进式渲染**：长列表使用 `useProgressiveRender` 分批渲染，避免首屏卡顿
- **骨架屏组件**：`Skeleton` / `SkeletonCard` / `SkeletonList` / `SkeletonDashboard`，替代转圈加载提升感知速度
- **离线提示横幅**：`OfflineBanner` 组件在网络断开时显示明确提示
- **列表搜索防抖**：所有搜索输入框统一 300ms debounce（`useDebounce`）
- **全局命令面板 + 高级搜索**：`Ctrl+K` 快捷键打开，支持页面跳转、快捷操作、模糊搜索 + 键盘导航 + 角色过滤；输入 2 字以上自动调用后端 `/api/search` 跨项目/客户/需求/文件全文搜索，结果高亮匹配关键词；支持类型筛选芯片（全部/项目/客户/需求/文件）、搜索历史记录（最近 8 条/可清空）、300ms 防抖和请求取消
- **虚拟滚动**：审计日志表格使用 `@tanstack/react-virtual` 虚拟化渲染，每页200条仅渲染可视区域 DOM，60fps 滚动
- **乐观更新**：任务看板拖拽、商机移阶段操作即时更新 UI，后台异步提交，失败自动回滚
- **路由级错误边界**：`ErrorBoundary` 组件包裹路由，单个页面崩溃不影响其他页面，提供重试按钮

### 3.25 实时数据同步

- **WebSocket 数据广播**：后端在项目/客户/任务/商机/工单/文件的增删改操作后，通过 Socket.IO 广播 `data_changed` 事件
- **广播工具**：`atomic/utils/broadcast.js`，统一 `broadcast(entity, action, meta)` 接口，已接入12个写操作控制器
- **前端自动刷新**：`useLiveData` Hook 监听 `data_changed` 事件，匹配当前页面关注的实体类型后自动 refetch
- **Tab 焦点刷新**：用户从其他标签页切回时，自动拉取最新数据（5秒节流防抖）
- **已接入页面**：仪表盘、项目管理、客户管理、任务看板、商机管理、工单系统、文件管理
- **路由预加载**：登录后利用 `requestIdleCallback` 后台预加载所有路由 chunk，消除导航切换时的 JS 下载延迟

### 3.26 权限组件化 (RBAC)

- **配置文件**：`stores/permissions.tsx`，统一定义平台基线权限映射（当前平台角色只有 admin / member）
- **纯函数**：`can(role, permission)` — 任何位置可调用
- **Hook**：`usePermission(permission)` — 自动读取当前用户角色
- **组件**：`<Can action="project:edit">内容</Can>` — 声明式条件渲染
- **已接入模块**：App路由、Dashboard、项目管理、客户管理、商机管理、任务看板、工单系统、员工分配过滤
- **优势**：新增角色或调整权限只需修改配置文件，无需全局搜索替换

### 3.27 项目级权限（双身份模型）

- **第一身份（平台角色）**：`voice_users.role`，决定全局菜单可见性和操作权限（当前只有 admin 和 member）
- **第二身份（企业角色）**：成员加入企业后，可被分配企业自定义角色（如"销售主管"/"项目经理"/"开发组长"）
- **第三层（项目角色）**：项目中的权限不是直接挂在平台角色下，而是挂在企业角色下，通过项目成员表绑定到具体项目
- **数据库**：`duijie_project_members.enterprise_role_id` 关联 `enterprise_roles` 表的 8 个权限字段
- **权限判断流程**：项目内操作先查项目绑定的企业角色权限，无角色则降级为平台角色基线权限
- **后端**：`projectPerms.js` 工具函数 `getProjectPerms(userId, projectId)`，`GET /api/projects/:id/my-perms` 接口
- **前端**：`useProjectPerms` Hook 获取当前用户在项目中的有效权限，`ProjectDetail` 根据项目角色动态控制编辑/删除/任务管理按钮
- **成员管理UI**：添加成员时可选企业角色，已有成员可修改角色，成员列表和详情显示角色标签
- **使用场景**：member 在项目外只有查看权限，被分配"项目经理"角色后在该项目内可编辑项目、管理任务

### 3.28 安全防护系统

**应用层防护：**
- **密码 bcrypt 哈希**：所有密码存储和验证均使用 bcrypt（兼容明文旧数据自动升级）
- **会话管理**：用户可查看所有活跃会话（`/api/auth/sessions`），支持注销单个或全部会话
- **登录日志**：记录每次登录的IP、方式、状态（`/api/auth/login-logs`）
- **登录暴力破解防护**：登录 15 分钟/10 次，注册 1 小时/5 次
- **API 速率限制**：全局每 IP 每 15 分钟最多 600 次（MySQL 持久化存储，PM2 重启不丢失）
- **端点级速率限制**：验证码发送 3 次/60秒（按手机号/邮箱）、找回密码 5 次/15分钟、重置密码 5 次/15分钟
- **Helmet 安全响应头**：X-Content-Type-Options、X-Frame-Options、X-XSS-Protection
- **CORS 白名单**：仅允许已知来源
- **XSS 输入过滤**：所有 API 请求的 body/query 自动 sanitize
- **Bot/爬虫检测**：封禁异常 User-Agent（scrapy/sqlmap/nikto 等）+ 攻击路径拦截
- **错误信息脱敏**：生产环境不暴露内部错误详情
- **SQL 参数化查询**：全部使用 `?` 占位符，防止 SQL 注入
- **JWT 认证**：Access Token（2小时）+ Refresh Token（30天，HttpOnly Cookie）双令牌模式，自动轮转，前端 401 自动刷新

**Nginx 层防护：**
- **Gzip 压缩**：level 6，覆盖 JS/CSS/JSON/SVG/XML，`gzip_vary` 启用
- **Permissions-Policy 安全头**：禁用 camera/microphone/geolocation
- **Nginx 限速**：API 每秒 10 次（burst 20），登录每秒 1 次（burst 3）
- **连接数限制**：每 IP 最多 30 个并发连接
- **隐藏服务器版本**：`server_tokens off`
- **攻击路径封禁**：.env/.git/wp-admin/phpmyadmin 等直接返回 444
- **爬虫 UA 封禁**：scrapy/curl/wget/sqlmap/nmap 等直接 403
- **超时保护**：代理连接 10s、读写 30s

**服务器层防护：**
- **fail2ban 自动封禁**：SSH 暴力破解（5次/10分钟→封 1小时）、Nginx 限速触发（10次/分钟→封 10分钟）、恶意爬虫（5次/分钟→封 24小时）

### 3.29 可观测性与监控

- **请求ID跟踪**：每个API请求自动生成 8 字节 hex Request ID，通过 `X-Request-Id` 响应头返回，日志格式 `POST /api/xxx 200 45ms [a1b2c3d4]`
- **响应计时**：自动记录每个请求耗时，大于 2 秒标记为 warn 级别
- **健康端点增强**：`GET /api/health` 返回数据库连接状态、进程内存（RSS/Heap）、运行时间、WebSocket 连接数/峰值连接数
- **未捕获异常安全网**：`unhandledRejection` 记录日志但不退出、`uncaughtException` 记录日志后触发优雅关闭

### 3.30 进程管理与优雅关闭

- **优雅关闭**：收到 SIGTERM/SIGINT 信号后依次关闭 HTTP Server → Socket.IO → MySQL 连接池，10 秒强制退出
- **PM2 进程管理**：`ecosystem.config.js` 配置内存限制、日志轮转、优雅关闭

### 3.31 内存缓存系统

- **工具类**：`atomic/utils/memoryCache.js`，Map + TTL 实现，全局单例，默认 60 秒 TTL
- **功能**：get/set/del/invalidate（前缀批量删除）/clear，每分钟自动清理过期条目
- **已应用**：auth 中间件用户查询缓存（30秒），profile/enterprise 写操作后自动失效

### 3.32 WebSocket 工程化（Socket.IO）

- **心跳配置**：`pingInterval: 25000`、`pingTimeout: 20000`、`maxHttpBufferSize: 1MB`
- **连接级事件速率限制**：每连接每分钟最多 60 个事件，超出静默丢弃
- **认证反馈**：`auth_ok` / `auth_error` 事件告知客户端认证结果
- **权限控制**：未认证连接禁止 `join_project`
- **连接监控**：实时连接计数 + 峰值连接数，通过 `/api/health` 暴露

### 3.33 GitHub Actions 部署工作流

- **文件**：`.github/workflows/deploy.yml`，手动触发（`workflow_dispatch`）
- **流程**：Pre-deploy 测试（MySQL服务+迁移+npm test）→ 构建前端 → SFTP 上传后端/前端/Nginx → npm install → 迁移 → PM2 重启 → 健康检查
- **跳过测试**：支持 `skip_tests` 输入参数直接部署
- **所需 Secrets**：`SERVER_HOST`、`SERVER_USER`、`SERVER_PASSWORD`

### 3.34 Vite 构建优化

- **代码分割**：`manualChunks` 配置 3 个 vendor chunk：
  - `vendor-react`（React/ReactDOM/React Router，~166KB）
  - `vendor-ui`（Zustand/Socket.IO Client，~42KB）
  - `vendor-charts`（Recharts，~400KB）
- **缓存命中率**：vendor chunk 仅在依赖版本变化时失效，业务代码更新不影响 vendor 缓存

### 3.35 移动端适配

- **响应式布局**：侧边栏 → 抽屉式（overlay + 遮罩 + 自动收起）
- **自适应网格**：客户/项目卡片根据屏幕宽度自动调整列数
- **弹窗适配**：Modal 最大宽度 `calc(100vw - 24px)`
- **移动端独立详情页面**：需求（`TaskDetailPage`）、代办/里程碑（`MilestoneDetailPage`）、知识库文章（`KnowledgeDetailPage`）在移动端点击卡片打开独立子页面（带返回按钮，支持侧滑返回），桌面端保持弹窗模式
- **企业成员系统移动端优化**：成员列表卡片信息区、成员详情弹窗、添加/编辑成员弹窗在窄屏下自动切换为单列布局；手机号导入区、角色新增按钮、底部操作按钮在手机端全宽显示，避免字段和按钮被挤压或显示不完整
- **安全区与导航优化**：Android 原生 WebView 预留系统状态栏安全区，避免刘海/状态栏遮挡页面内容；移动端顶部导航在详情页显示触摸返回按钮，配合原生返回键优先回到上一页而不是直接退出应用
- **设置子页面侧滑返回修复**：通过 `history.pushState` 拦截系统返回手势，确保侧滑先退回设置列表而非直接退到首页
- **仪表盘/项目管理移动端优化**：项目管理顶部搜索区、状态筛选、项目卡片与新建项目弹窗改为窄屏友好布局；仪表盘统计卡片、趋势图表、工作区块、最近跟进/合同列表在手机端改为单列或可换行显示，避免横向挤压
- **横向滚动**：客户阶段 Tab、任务看板列
- **内容间距**：移动端自动缩小 padding
- **自定义 Hook**：`useIsMobile(breakpoint=768)` 检测移动端
- **Capacitor 推送桥接**：登录后原生 App 自动尝试注册 Push 权限并把设备令牌回传后端（Firebase Admin SDK）；退出登录时自动注销设备令牌
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
| POST | `/api/auth/logout` | 登出（清除所有refresh token） | 公开 |
| POST | `/api/auth/refresh` | 刷新访问令牌（Refresh Token轮转） | 公开 |
| GET | `/api/auth/me` | 当前用户信息 | 认证 |
| PUT | `/api/auth/profile` | 更新个人资料 | 认证 |
| POST | `/api/auth/avatar` | 上传头像 | 认证 |
| PUT | `/api/auth/change-password` | 修改密码 | 认证 |
| POST | `/api/auth/guide-done` | 标记新手引导完成 | 认证 |
| GET | `/api/auth/sessions` | 会话列表 | 认证 |
| DELETE | `/api/auth/sessions/all` | 清除所有会话 | 认证 |
| DELETE | `/api/auth/sessions/:id` | 删除指定会话 | 认证 |
| GET | `/api/auth/login-logs` | 登录日志 | 认证 |

### 4.2 系统配置（System）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/system/invite-code` | 获取邀请码 | 认证 |
| PUT | `/api/system/invite-code` | 修改邀请码 | 认证 |
| GET | `/api/system/config` | 获取全部配置 | admin |
| PUT | `/api/system/config` | 更新配置 | admin |

### 4.3 首页（Dashboard）

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
| GET | `/api/projects/export` | 导出项目列表（Excel） | 认证 |
| POST | `/api/projects/import` | 导入项目 | 认证 |
| GET | `/api/projects/team-users` | 团队用户列表 | 认证 |
| GET | `/api/projects/search-by-code` | 按邀请码搜索项目 | 认证 |
| POST | `/api/projects/join-request` | 申请加入项目 | 认证 |
| POST | `/api/projects/join-by-invite` | 通过邀请加入 | 认证 |
| GET | `/api/projects` | 项目列表 | 认证 |
| GET | `/api/projects/trash` | 回收站项目 | 认证 |
| PATCH | `/api/projects/:id/restore` | 恢复已删除项目 | 认证 |
| GET | `/api/projects/:id` | 项目详情（含成员） | 认证 |
| GET | `/api/projects/:id/bundle` | 项目聚合数据（详情+成员+统计） | 认证 |
| GET | `/api/projects/:id/overview` | 项目概览统计 | 项目成员 |
| GET | `/api/projects/:id/stats` | 项目统计数据 | 项目成员 |
| GET | `/api/projects/:id/activity` | 项目动态列表 | 项目成员 |
| PUT | `/api/projects/:id` | 更新项目 | 项目成员 |
| DELETE | `/api/projects/:id` | 删除项目 | 项目成员 |
| POST | `/api/projects/:id/cover` | 上传项目封面 | 项目成员 |
| DELETE | `/api/projects/:id/cover` | 删除项目封面 | 项目成员 |
| GET | `/api/projects/:id/my-perms` | 当前用户在项目中的权限 | 认证 |
| POST | `/api/projects/:id/members` | 添加项目成员 | 项目成员 |
| PUT | `/api/projects/:id/members/:memberId` | 更新成员角色 | 项目成员 |
| DELETE | `/api/projects/:id/members/:userId` | 移除项目成员 | 项目成员 |
| GET | `/api/projects/:id/available-users` | 可添加的用户列表 | 项目成员 |
| GET | `/api/projects/:id/search-users` | 搜索项目内用户 | 项目成员 |
| PATCH | `/api/projects/:id/nickname` | 设置项目内昵称 | 项目成员 |
| PATCH | `/api/projects/:id/member-remark` | 设置成员备注 | 项目成员 |
| GET | `/api/projects/:id/roles` | 项目角色列表 | 项目成员 |
| POST | `/api/projects/:id/roles` | 创建角色 | 项目成员 |
| PUT | `/api/projects/:id/roles/:roleId` | 更新角色 | 项目成员 |
| DELETE | `/api/projects/:id/roles/:roleId` | 删除角色 | 项目成员 |
| GET | `/api/projects/:id/join-requests` | 加入申请列表 | 项目成员 |
| POST | `/api/projects/:id/join-requests/:requestId/approve` | 审批通过 | 项目成员 |
| POST | `/api/projects/:id/join-requests/:requestId/reject` | 拒绝申请 | 项目成员 |
| POST | `/api/projects/:id/invite` | 邀请成员 | 项目成员 |
| POST | `/api/projects/:id/invite-token` | 生成邀请令牌 | 项目成员 |
| GET | `/api/projects/:id/task-title-options` | 任务标题选项 | 项目成员 |
| POST | `/api/projects/:id/task-title-history` | 记录标题历史 | 项目成员 |
| DELETE | `/api/projects/:id/task-title-history/:historyId` | 删除标题历史 | 项目成员 |
| PATCH | `/api/projects/:id/task-title-presets` | 编辑预设标题 | 项目成员 |
| POST | `/api/projects/:id/client-request` | 发起客户关联请求 | 项目成员 |
| GET | `/api/projects/:id/client-available-users` | 可添加的客户方用户 | 项目成员 |
| POST | `/api/projects/:id/client-members` | 添加客户方成员 | 项目成员 |
| DELETE | `/api/projects/:id/client-members/:userId` | 移除客户方成员 | 项目成员 |
| GET | `/api/projects/client-requests` | 客户关联请求列表 | 认证 |
| GET | `/api/projects/client-requests/sent` | 已发送的客户请求 | 认证 |
| POST | `/api/projects/client-requests/:id/approve` | 审批客户请求 | 认证 |
| POST | `/api/projects/client-requests/:id/reject` | 拒绝客户请求 | 认证 |

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

- **草稿箱**：支持「保存草稿」/「加载草稿」/「删除草稿」

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/drafts` | 草稿列表 | 认证 |
| POST | `/api/drafts` | 保存草稿 | 认证 |
| DELETE | `/api/drafts/:id` | 删除草稿 | 认证 |
| POST | `/api/tasks` | 创建任务 | staff |
| GET | `/api/tasks/export` | 导出任务列表（Excel） | 认证 |
| GET | `/api/tasks/trash` | 回收站任务 | staff |
| GET | `/api/tasks` | 任务列表 | 认证 |
| GET | `/api/tasks/:id` | 任务详情 | 认证 |
| PUT | `/api/tasks/:id` | 更新任务 | staff |
| PATCH | `/api/tasks/:id/move` | 移动状态 | staff |
| POST | `/api/tasks/:id/remind` | 催办负责人（30分钟冷却） | staff |
| DELETE | `/api/tasks/:id` | 删除任务 | staff |
| PATCH | `/api/tasks/:id/restore` | 恢复已删除任务 | staff |
| POST | `/api/tasks/:id/attachments` | 上传任务附件 | staff |
| DELETE | `/api/tasks/attachments/:attachmentId` | 删除附件 | staff |
| GET | `/api/tasks/attachments/:attachmentId/download` | 下载附件 | 认证 |
| GET | `/api/tasks/:id/review-points` | 审核要点列表 | 认证 |
| POST | `/api/tasks/:id/review-points` | 添加审核要点 | staff |
| PUT | `/api/tasks/review-points/:pointId` | 更新审核要点 | staff |
| PUT | `/api/tasks/review-points/:pointId/respond` | 回复审核要点 | staff |
| PUT | `/api/tasks/review-points/:pointId/confirm` | 确认审核要点 | staff |

### 4.10.1 工时汇报（Timesheet）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/timesheets` | 工时列表（支持项目/日期/用户筛选） | 认证 |
| GET | `/api/timesheets/summary` | 工时统计（按用户/项目汇总） | 认证 |
| POST | `/api/timesheets` | 记录工时 | 认证 |
| PUT | `/api/timesheets/:id` | 更新工时（仅自己的） | 认证 |
| DELETE | `/api/timesheets/:id` | 删除工时（仅自己的） | 认证 |

### 4.10.2 扩展属性（Custom Fields）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/projects/:projectId/custom-fields` | 项目自定义字段列表 | 项目成员 |
| POST | `/api/projects/:projectId/custom-fields` | 添加自定义字段 | 项目成员 |
| PUT | `/api/custom-fields/:id` | 更新字段定义 | 认证 |
| DELETE | `/api/custom-fields/:id` | 删除字段（同时清除值） | 认证 |
| GET | `/api/tasks/:taskId/custom-values` | 获取任务自定义字段值 | 认证 |
| PUT | `/api/tasks/:taskId/custom-values` | 批量设置字段值 | 认证 |

### 4.10.3 项目模板（Project Template）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/project-templates` | 模板列表（全局+企业） | 认证 |
| POST | `/api/project-templates` | 创建模板（可从项目提取） | 认证 |
| DELETE | `/api/project-templates/:id` | 删除模板（创建者/管理员） | 认证 |

### 4.11 里程碑/代办（Milestone）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/milestones` | 创建里程碑 | 认证 |
| GET | `/api/milestones` | 里程碑列表 | 认证 |
| PUT | `/api/milestones/:id` | 更新里程碑 | 认证 |
| DELETE | `/api/milestones/:id` | 删除里程碑 | 认证 |
| GET | `/api/milestones/trash` | 回收站 | 认证 |
| PATCH | `/api/milestones/:id/restore` | 恢复删除 | 认证 |
| PATCH | `/api/milestones/:id/toggle` | 切换完成状态 | 认证 |
| PATCH | `/api/milestones/:id/progress` | 更新进度 | 认证 |
| GET | `/api/milestones/:id/detail` | 详情 | 认证 |
| GET | `/api/milestones/:id/participants` | 参与者列表 | 认证 |
| POST | `/api/milestones/:id/participants` | 添加参与者 | 认证 |
| DELETE | `/api/milestones/:id/participants/:userId` | 移除参与者 | 认证 |
| GET | `/api/milestones/:id/messages` | 里程碑消息 | 认证 |
| POST | `/api/milestones/:id/messages` | 发送消息 | 认证 |
| GET | `/api/milestones/:id/reminders` | 提醒列表 | 认证 |
| POST | `/api/milestones/:id/reminders` | 添加提醒 | 认证 |
| DELETE | `/api/milestone-reminders/:reminderId` | 删除提醒 | 认证 |

### 4.12 文件（File）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/files/upload` | 上传文件 | 认证 |
| POST | `/api/files/url` | 添加网址书签 | 认证 |
| POST | `/api/files/note` | 添加文字笔记 | 认证 |
| GET | `/api/files/all` | 全局文件列表 | 认证 |
| GET | `/api/files` | 项目文件列表 | 认证 |
| DELETE | `/api/files/:id` | 删除文件 | 认证 |
| GET | `/api/files/:id/download` | 下载文件 | 认证 |
| GET | `/api/files/:id/preview` | 文件预览 | 认证 |

### 4.12.1 资料组（Resource Group）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/resource-groups` | 创建资料组 | 认证 |
| GET | `/api/resource-groups` | 资料组列表 | 认证 |
| GET | `/api/resource-groups/:id` | 资料组详情 | 认证 |
| PUT | `/api/resource-groups/:id` | 更新资料组 | 认证 |
| DELETE | `/api/resource-groups/:id` | 删除资料组 | 认证 |
| POST | `/api/resource-groups/items` | 添加资料项 | 认证 |
| PUT | `/api/resource-groups/items/:itemId` | 更新资料项 | 认证 |
| DELETE | `/api/resource-groups/items/:itemId` | 删除资料项 | 认证 |

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

### 4.15.1 好友（Friend）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/friends/search` | 搜索用户（ID/用户名/手机号） | 认证 |
| GET | `/api/friends` | 好友列表 | 认证 |
| POST | `/api/friends/request` | 发送好友请求 | 认证 |
| GET | `/api/friends/requests` | 收到的好友请求 | 认证 |
| PATCH | `/api/friends/:id/respond` | 接受/拒绝好友请求 | 认证 |
| DELETE | `/api/friends/:id` | 删除好友 | 认证 |

### 4.15.2 群聊（Group）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/groups` | 创建群聊 | 认证 |
| GET | `/api/groups` | 群聊列表 | 认证 |
| GET | `/api/groups/:id` | 群聊详情 | 认证 |
| GET | `/api/groups/:id/history` | 群聊消息记录 | 认证 |
| POST | `/api/groups/:id/send` | 发送群消息 | 认证 |
| PATCH | `/api/groups/:id/messages/:msgId/recall` | 撤回群消息 | 认证 |
| POST | `/api/groups/:id/members` | 添加群成员 | 认证 |
| DELETE | `/api/groups/:id/leave` | 退出群聊 | 认证 |

### 4.15.3 用户备注名（Nickname）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/nicknames` | 当前用户的所有备注名 | 认证 |
| PUT | `/api/nicknames/:targetUserId` | 设置/更新备注名 | 认证 |
| DELETE | `/api/nicknames/:targetUserId` | 删除备注名 | 认证 |

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
| GET | `/api/notifications/unread-summary` | 未读通知摘要 | 认证 |
| PATCH | `/api/notifications/:id/read` | 标记已读 | 认证 |
| PATCH | `/api/notifications/read-by-tab` | 按分类标记已读 | 认证 |
| DELETE | `/api/notifications/cleanup` | 清理通知 | 认证 |
| DELETE | `/api/notifications/:id` | 删除通知 | 认证 |
| POST | `/api/notifications/devices` | 注册移动设备令牌 | 认证 |
| POST | `/api/notifications/devices/unregister` | 注销移动设备令牌 | 认证 |
| GET | `/api/sse` | SSE 事件流连接 | 认证 |

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

### 4.22 合作企业资料（Enterprise Profile）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/enterprises/:id/profile` | 查看合作企业资料（成员/部门/共享项目） | 认证 + 企业关联 |

> 访问条件：请求者所在企业与目标企业之间存在项目关联或审批通过的客户请求。返回数据包括：enterprise（基本信息）、members（组织成员+角色）、departments（部门）、sharedProjects（两企业间关联项目）。

### 4.23 合作方开放接口（Open API）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/open/clients` | 查询客户列表 | X-API-Key + clients:read |
| GET | `/api/open/clients/:id` | 查询单个客户 | X-API-Key + clients:read |
| POST | `/api/open/clients` | 创建客户 | X-API-Key + clients:write |
| GET | `/api/open/projects` | 查询项目列表 | X-API-Key + projects:read |
| GET | `/api/open/projects/:id` | 查询单个项目 | X-API-Key + projects:read |
| POST | `/api/open/webhook` | 接收 Webhook 事件 | X-API-Key + webhook |

### 4.24 知识库（Knowledge Base）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/kb/categories` | 分类列表 | staff |
| POST | `/api/kb/categories` | 创建分类 | staff |
| PUT | `/api/kb/categories/:id` | 更新分类 | staff |
| DELETE | `/api/kb/categories/:id` | 删除分类 | staff |
| GET | `/api/kb/articles` | 文章列表 | staff |
| GET | `/api/kb/articles/:id` | 文章详情 | staff |
| POST | `/api/kb/articles` | 创建文章 | staff |
| PUT | `/api/kb/articles/:id` | 更新文章 | staff |
| DELETE | `/api/kb/articles/:id` | 删除文章 | staff |

### 4.25 全局搜索 & 应用版本

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/search` | 全局搜索（项目/客户/需求/文件） | 认证 |
| GET | `/api/health` | 健康检查 | 公开 |
| GET | `/api/app/version` | 应用版本信息 | 公开 |
| GET | `/api/app/bundle` | 前端包信息 | 公开 |
| GET | `/api/app/bundle/download` | 下载前端包 | 公开 |
| POST | `/api/invite-links` | 创建邀请链接 | admin |
| GET | `/api/invite-links` | 邀请链接列表 | admin |
| GET | `/api/invite-links/:token/validate` | 验证邀请链接 | 公开 |
| DELETE | `/api/invite-links/:id` | 删除邀请链接 | admin |

项目列表、详情、导出与企业项目接口均返回双方企业字段：`internal_client_id`、`internal_client_name`、`internal_client_company`、`client_id`、`client_name`、`client_company`。

项目详情页的企业信息与成员区按当前登录用户的活跃企业视角显示：当前企业显示为“我方企业 / 我方团队”，另一侧显示为“客户企业”或“对方企业”。

---

## 五、数据库表结构

数据库：`duijie_db`，共 40+ 张表（含迁移新增表）。

| 表名 | 说明 |
|------|------|
| `voice_users` | 用户表（id, username, password, nickname, email, phone, avatar, role, client_id, display_id, guide_done, department, employee_no） |
| `system_config` | 系统配置（JWT_SECRET, INVITE_CODE） |
| `verification_codes` | 验证码表 |
| `refresh_tokens` | 刷新令牌表 |
| `rate_limit_store` | 速率限制存储 |
| `duijie_clients` | 客户/企业表（assigned_to, credit_code, legal_person, display_id, join_code） |
| `duijie_client_members` | 企业成员表（client_id, user_id, name, role, position, department_id） |
| `duijie_departments` | 部门表（client_id, name, parent_id, sort_order） |
| `duijie_join_requests` | 加入企业申请表（client_id, user_id, status） |
| `enterprise_roles` | 企业自定义角色表（client_id, name, color, 16个权限字段） |
| `duijie_projects` | 项目表（internal_client_id, client_id, status, display_id, cover_image） |
| `duijie_project_members` | 项目成员关联表（project_id, user_id, role, enterprise_role_id, project_role_id） |
| `project_roles` | 项目角色表（project_id, enterprise_id, role_key, 60个 can_* 权限字段） |
| `duijie_project_join_requests` | 项目加入申请表 |
| `duijie_project_invite_tokens` | 项目邀请令牌表 |
| `duijie_project_client_requests` | 项目-客户关联请求表 |
| `duijie_client_requests` | 客户关联请求表 |
| `duijie_project_activities` | 项目动态表（project_id, user_id, type, entity_type, entity_id, title, detail） |
| `duijie_tasks` | 任务表（project_id, assignee_id, status, display_id） |
| `duijie_task_title_history` | 任务标题历史表 |
| `duijie_task_drafts` | 任务草稿表 |
| `duijie_task_review_points` | 审核要点表 |
| `duijie_milestones` | 里程碑/代办表（project_id, progress, is_completed） |
| `duijie_milestone_participants` | 里程碑参与者表 |
| `duijie_milestone_messages` | 里程碑消息表 |
| `duijie_milestone_reminders` | 里程碑提醒表 |
| `duijie_files` | 文件表（project_id, uploaded_by, description） |
| `duijie_resource_groups` | 资料组表（project_id, name, created_by） |
| `duijie_resource_group_items` | 资料组内容表 |
| `duijie_resource_group_visibility` | 资料组可见性表 |
| `duijie_messages` | 项目消息表 |
| `duijie_direct_messages` | 站内消息表（sender_id, receiver_id, content, is_recalled） |
| `duijie_friends` | 好友关系表 |
| `duijie_groups` | 群聊表 |
| `duijie_group_members` | 群成员表 |
| `duijie_group_messages` | 群消息表 |
| `user_nicknames` | 用户备注名表 |
| `duijie_contacts` | 联系人表 |
| `duijie_contracts` | 合同表 |
| `duijie_follow_ups` | 跟进记录表 |
| `duijie_tags` | 标签表 |
| `duijie_client_tags` | 客户标签关联表 |
| `duijie_client_logs` | 客户变更日志表 |
| `duijie_opportunities` | 商机表（title, client_id, amount, probability, stage） |
| `duijie_tickets` | 工单表 |
| `duijie_ticket_replies` | 工单回复表 |
| `duijie_notifications` | 通知表（user_id, type, category, title, content, link, is_read, project_id） |
| `duijie_device_tokens` | 移动设备令牌表（user_id, platform, device_token） |
| `duijie_audit_logs` | 审计日志表（user_id, action, entity_type, detail, ip） |
| `duijie_partner_api_keys` | 合作方 API Key 表 |
| `duijie_kb_categories` | 知识库分类表（enterprise_id, name, parent_id） |
| `duijie_kb_articles` | 知识库文章表（enterprise_id, category_id, title, content, status） |
| `duijie_login_logs` | 登录日志表（user_id, login_type, ip, status） |
| `duijie_timesheets` | 工时记录表（user_id, task_id, project_id, work_date, hours） |
| `duijie_project_templates` | 项目模板表（name, enterprise_id, config JSON） |
| `duijie_custom_fields` | 自定义字段定义表（project_id, name, field_type, options JSON） |
| `duijie_custom_field_values` | 自定义字段值表（task_id, field_id, value） |

---

## 六、前端路由

路由定义在 `routeManifest.ts` 中，由 `App.tsx` 根据用户权限动态过滤渲染。

| 路径 | 组件 | 说明 | 权限 |
|------|------|------|------|
| `/` | Dashboard | 首页 | 认证 |
| `/projects` | ProjectList | 项目列表 | 认证 |
| `/projects/:id` | ProjectDetail | 项目详情（多 Tab：需求/资料库/待办/概览/统计/动态/设置） | 认证 |
| `/clients` | ClientList | 客户列表 | staff |
| `/clients/:id` | ClientDetail | 客户详情 | staff |
| `/tasks` | TaskBoard | 需求看板 | 认证 |
| `/tasks/:id` | TaskDetailPage | 需求详情（移动端独立页面） | 认证 |
| `/timesheets` | TimesheetPage | 工时汇报 | 认证 |
| `/enterprise` | EnterpriseMgmt | 企业管理 | 认证 |
| `/messaging` | Messaging | 站内消息聊天 | 认证 |
| `/calendar` | CalendarPage | 日历日程 | 认证 |
| `/files` | FileManager | 文件管理 | 认证 |
| `/contacts` | ContactList | 联系人管理 | 认证 |
| `/notifications` | NotificationCenter | 通知中心 | 认证 |
| `/knowledge` | KnowledgeBase | 知识库 | 认证 |
| `/knowledge/:id` | KnowledgeDetailPage | 知识库文章详情（移动端独立页面） | 认证 |
| `/milestones/:id` | MilestoneDetailPage | 代办/里程碑详情（移动端独立页面） | 认证 |
| `/users` | UserManagement | 用户管理 + 邀请码管理 | admin |
| `/audit` | AuditLog | 审计日志 | admin |
| `/partners` | PartnerManagement | 合作方管理 | admin |
| `/settings` | SystemSettings | 系统配置 | admin |
| `/user-settings` | UserSettings | 个人设置 | 认证 |
| `/services` | ServicesPage | 服务页面 | 认证 |
| `/my` | MyPage | 我的（移动端个人中心） | 认证 |
| `/about` | AboutPage | 关于 | 认证 |
| `/join/:code` | JoinProjectPage | 项目邀请链接入口 | 公开（未登录跳登录） |
| `/invite/:token` | InviteLandingPage | 邀请链接落地页 | 公开 |

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

| 平台角色 | 项目 | 客户 | 商机 | 任务 | 合同/跟进 | 金额 | 站内消息 | 仪表盘 |
|------|------|------|------|------|----------|------|----------|--------|
| admin | 全部 | 全部 | 全部 | 全部 | 全部 | ✅ | ✅ | 全部 |
| member | 参与的 | 按企业权限 | 按企业权限 | 关联的 | 关联的 | 按企业权限 | ✅ | 按企业权限 |

> 注：上表为平台角色基线权限。member 的具体可见范围和操作能力由企业权限（企业内自定义角色）和项目权限（项目内企业角色绑定）两层叠加控制。

### 操作权限（查看/编辑/删除分离）

| 操作 | admin | member（基线） | member + 企业权限 |
|------|-------|------------|------------------|
| 创建客户 | ✅ | ❌ | can_manage_client ✅ |
| 编辑客户 | ✅ | ❌ | can_manage_client ✅ |
| 删除客户 | ✅ | ❌ | ❌ |
| 创建项目 | ✅ | ❌ | can_create_project ✅ |
| 编辑项目 | ✅ | ❌ | can_edit_project ✅ |
| 删除项目 | ✅ | ❌ | can_delete_project ✅ |
| 创建任务 | ✅ | ❌ | can_manage_task ✅ |
| 查看报表 | ✅ | ❌ | can_view_report ✅ |

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
| 平台角色 | 2 种（admin / member），具体能力由企业权限 + 项目权限叠加控制 |
| 前端功能模块 | 17 个 |
| 共享 UI 组件 | 11 个 |
| 前端路由 | 14 条 |
| 版本迭代 | 103 个（v1.0.0 ~ v1.1.2，详见 CHANGELOG.md） |
