# DuiJie API 接口文档

> 基础地址：`http://160.202.253.143:8080/api`
> 认证方式：Bearer Token（JWT），通过 `Authorization: Bearer <token>` 请求头携带
> 权限说明：`公开` = 无需认证 | `认证` = 登录即可 | `staff` = admin 或 member | `admin` = 仅管理员 | `项目成员` = 项目内成员

---

## 1. 认证（Auth）

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
| POST | `/api/auth/logout` | 登出（清除所有 refresh token） | 公开 |
| POST | `/api/auth/refresh` | 刷新访问令牌（Refresh Token 轮转） | 公开 |
| GET | `/api/auth/me` | 当前用户信息 | 认证 |
| PUT | `/api/auth/profile` | 更新个人资料 | 认证 |
| POST | `/api/auth/avatar` | 上传头像 | 认证 |
| PUT | `/api/auth/change-password` | 修改密码 | 认证 |
| POST | `/api/auth/guide-done` | 标记新手引导完成 | 认证 |
| GET | `/api/auth/sessions` | 会话列表 | 认证 |
| DELETE | `/api/auth/sessions/all` | 清除所有会话 | 认证 |
| DELETE | `/api/auth/sessions/:id` | 删除指定会话 | 认证 |
| GET | `/api/auth/login-logs` | 登录日志 | 认证 |

## 2. 系统配置（System）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/system/invite-code` | 获取邀请码 | 认证 |
| PUT | `/api/system/invite-code` | 修改邀请码 | 认证 |
| GET | `/api/system/config` | 获取全部配置 | admin |
| PUT | `/api/system/config` | 更新配置 | admin |

## 3. 首页（Dashboard）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/dashboard/stats` | 统计数据 | 认证 |
| GET | `/api/dashboard/workspace` | 个人工作台聚合数据（待办/项目动态/待审批/即将到期） | 认证 |
| GET | `/api/dashboard/report` | 报表数据 | 认证 |
| GET | `/api/dashboard/chart` | 图表数据（支持 days 参数） | 认证 |

## 4. 项目管理（Project）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/projects` | 创建项目 | 认证 |
| GET | `/api/projects` | 项目列表 | 认证 |
| GET | `/api/projects/export` | 导出项目列表（Excel） | 认证 |
| POST | `/api/projects/import` | 导入项目 | 认证 |
| GET | `/api/projects/team-users` | 团队用户列表 | 认证 |
| GET | `/api/projects/search-by-code` | 按邀请码搜索项目 | 认证 |
| POST | `/api/projects/join-request` | 申请加入项目 | 认证 |
| POST | `/api/projects/join-by-invite` | 通过邀请加入 | 认证 |
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

### 4.1 项目成员

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/projects/:id/members` | 添加项目成员 | 项目成员 |
| PUT | `/api/projects/:id/members/:memberId` | 更新成员角色 | 项目成员 |
| DELETE | `/api/projects/:id/members/:userId` | 移除项目成员 | 项目成员 |
| GET | `/api/projects/:id/available-users` | 可添加的用户列表 | 项目成员 |
| GET | `/api/projects/:id/search-users` | 搜索项目内用户 | 项目成员 |
| PATCH | `/api/projects/:id/nickname` | 设置项目内昵称 | 项目成员 |
| PATCH | `/api/projects/:id/member-remark` | 设置成员备注 | 项目成员 |
| POST | `/api/projects/:id/invite` | 邀请成员 | 项目成员 |
| POST | `/api/projects/:id/invite-token` | 生成邀请令牌 | 项目成员 |

### 4.2 项目角色

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/projects/:id/roles` | 项目角色列表 | 项目成员 |
| POST | `/api/projects/:id/roles` | 创建角色 | 项目成员 |
| PUT | `/api/projects/:id/roles/:roleId` | 更新角色 | 项目成员 |
| DELETE | `/api/projects/:id/roles/:roleId` | 删除角色 | 项目成员 |

### 4.3 项目加入申请

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/projects/:id/join-requests` | 加入申请列表 | 项目成员 |
| POST | `/api/projects/:id/join-requests/:requestId/approve` | 审批通过 | 项目成员 |
| POST | `/api/projects/:id/join-requests/:requestId/reject` | 拒绝申请 | 项目成员 |

### 4.4 任务标题管理

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/projects/:id/task-title-options` | 任务标题选项 | 项目成员 |
| POST | `/api/projects/:id/task-title-history` | 记录标题历史 | 项目成员 |
| DELETE | `/api/projects/:id/task-title-history/:historyId` | 删除标题历史 | 项目成员 |
| PATCH | `/api/projects/:id/task-title-presets` | 编辑预设标题 | 项目成员 |

### 4.5 项目客户关联

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/projects/:id/client-request` | 发起客户关联请求 | 项目成员 |
| GET | `/api/projects/:id/client-available-users` | 可添加的客户方用户 | 项目成员 |
| POST | `/api/projects/:id/client-members` | 添加客户方成员 | 项目成员 |
| DELETE | `/api/projects/:id/client-members/:userId` | 移除客户方成员 | 项目成员 |
| GET | `/api/projects/client-requests` | 客户关联请求列表 | 认证 |
| GET | `/api/projects/client-requests/sent` | 已发送的客户请求 | 认证 |
| POST | `/api/projects/client-requests/:id/approve` | 审批客户请求 | 认证 |
| POST | `/api/projects/client-requests/:id/reject` | 拒绝客户请求 | 认证 |

## 5. 客户管理（Client）

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
| GET | `/api/clients/available-members` | 可添加的成员列表 | staff |

### 5.1 客户成员管理

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/clients/:id/members` | 企业成员列表 | staff |
| POST | `/api/clients/:id/members` | 添加成员 | staff |
| PUT | `/api/client-members/:id` | 更新成员 | staff |
| DELETE | `/api/client-members/:id` | 移除成员 | admin |

### 5.2 客户请求审批

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/client-requests` | 发起客户请求 | staff |
| GET | `/api/client-requests/incoming` | 收到的请求 | staff |
| GET | `/api/client-requests/outgoing` | 发出的请求 | staff |
| POST | `/api/client-requests/:id/approve` | 批准请求 | staff |
| POST | `/api/client-requests/:id/reject` | 拒绝请求 | staff |

## 6. 联系人（Contact）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/contacts` | 全部联系人列表 | staff |
| POST | `/api/contacts` | 创建联系人 | staff |
| GET | `/api/clients/:clientId/contacts` | 按客户筛选联系人 | staff |
| PUT | `/api/contacts/:id` | 更新联系人 | staff |
| DELETE | `/api/contacts/:id` | 删除联系人 | staff |

## 7. 合同（Contract）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/contracts` | 创建合同 | staff |
| GET | `/api/clients/:clientId/contracts` | 合同列表 | staff |
| PUT | `/api/contracts/:id` | 更新合同 | staff |
| DELETE | `/api/contracts/:id` | 删除合同 | staff |

## 8. 跟进记录（Follow-up）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/follow-ups` | 全部跟进列表 | staff |
| POST | `/api/follow-ups` | 创建跟进 | staff |
| GET | `/api/clients/:clientId/follow-ups` | 按客户筛选跟进 | staff |
| PUT | `/api/follow-ups/:id` | 编辑跟进 | staff |
| DELETE | `/api/follow-ups/:id` | 删除跟进 | staff |

## 9. 标签（Tag）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/tags` | 创建标签 | staff |
| GET | `/api/tags` | 标签列表 | staff |
| DELETE | `/api/tags/:id` | 删除标签 | staff |
| GET | `/api/clients/:clientId/tags` | 客户标签 | staff |
| PUT | `/api/clients/:clientId/tags` | 设置客户标签 | staff |

## 10. 任务管理（Task）

### 10.1 草稿箱

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/drafts` | 草稿列表 | 认证 |
| POST | `/api/drafts` | 保存草稿 | 认证 |
| DELETE | `/api/drafts/:id` | 删除草稿 | 认证 |

### 10.2 任务 CRUD

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/tasks` | 创建任务 | staff |
| GET | `/api/tasks` | 任务列表 | 认证 |
| GET | `/api/tasks/export` | 导出任务列表（Excel） | 认证 |
| GET | `/api/tasks/trash` | 回收站任务 | staff |
| GET | `/api/tasks/:id` | 任务详情 | 认证 |
| PUT | `/api/tasks/:id` | 更新任务 | staff |
| PATCH | `/api/tasks/:id/move` | 移动状态 | staff |
| POST | `/api/tasks/:id/remind` | 催办负责人（30 分钟冷却） | staff |
| DELETE | `/api/tasks/:id` | 删除任务 | staff |
| PATCH | `/api/tasks/:id/restore` | 恢复已删除任务 | staff |

### 10.3 任务附件

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/tasks/:id/attachments` | 上传任务附件 | staff |
| DELETE | `/api/tasks/attachments/:attachmentId` | 删除附件 | staff |
| GET | `/api/tasks/attachments/:attachmentId/download` | 下载附件 | 认证 |

### 10.4 审核要点

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/tasks/:id/review-points` | 审核要点列表 | 认证 |
| POST | `/api/tasks/:id/review-points` | 添加审核要点 | staff |
| PUT | `/api/tasks/review-points/:pointId` | 更新审核要点 | staff |
| PUT | `/api/tasks/review-points/:pointId/respond` | 回复审核要点 | staff |
| PUT | `/api/tasks/review-points/:pointId/confirm` | 确认审核要点 | staff |

### 10.5 工时汇报（Timesheet）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/timesheets` | 工时列表（支持项目/日期/用户筛选） | 认证 |
| GET | `/api/timesheets/summary` | 工时统计（按用户/项目汇总） | 认证 |
| POST | `/api/timesheets` | 记录工时 | 认证 |
| PUT | `/api/timesheets/:id` | 更新工时（仅自己的） | 认证 |
| DELETE | `/api/timesheets/:id` | 删除工时（仅自己的） | 认证 |

### 10.6 扩展属性（Custom Fields）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/projects/:projectId/custom-fields` | 项目自定义字段列表 | 项目成员 |
| POST | `/api/projects/:projectId/custom-fields` | 添加自定义字段 | 项目成员 |
| PUT | `/api/custom-fields/:id` | 更新字段定义 | 认证 |
| DELETE | `/api/custom-fields/:id` | 删除字段（同时清除值） | 认证 |
| GET | `/api/tasks/:taskId/custom-values` | 获取任务自定义字段值 | 认证 |
| PUT | `/api/tasks/:taskId/custom-values` | 批量设置字段值 | 认证 |

### 10.7 项目模板（Project Template）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/project-templates` | 模板列表（全局+企业） | 认证 |
| POST | `/api/project-templates` | 创建模板（可从项目提取） | 认证 |
| DELETE | `/api/project-templates/:id` | 删除模板（创建者/管理员） | 认证 |

## 11. 里程碑 / 代办（Milestone）

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

## 12. 文件（File）

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

### 12.1 资料组（Resource Group）

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

## 13. 消息（Message）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/messages` | 发送消息 | 认证 |
| GET | `/api/messages` | 消息列表 | 认证 |

## 14. 商机管理（Opportunity）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/opportunities` | 创建商机 | staff |
| GET | `/api/opportunities` | 商机列表 | staff |
| PUT | `/api/opportunities/:id` | 更新商机 | staff |
| DELETE | `/api/opportunities/:id` | 删除商机 | staff |

## 15. 站内消息（Direct Message）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/dm/conversations` | 对话列表 | 认证 |
| GET | `/api/dm/users` | 可聊天用户列表 | 认证 |
| GET | `/api/dm/:userId/history` | 聊天记录（自动标记已读） | 认证 |
| POST | `/api/dm/send` | 发送消息 | 认证 |
| PATCH | `/api/dm/:id/recall` | 撤回消息（2 分钟内） | 认证 |

### 15.1 好友（Friend）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/friends/search` | 搜索用户（ID/用户名/手机号） | 认证 |
| GET | `/api/friends` | 好友列表 | 认证 |
| POST | `/api/friends/request` | 发送好友请求 | 认证 |
| GET | `/api/friends/requests` | 收到的好友请求 | 认证 |
| PATCH | `/api/friends/:id/respond` | 接受/拒绝好友请求 | 认证 |
| DELETE | `/api/friends/:id` | 删除好友 | 认证 |

### 15.2 群聊（Group）

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

### 15.3 用户备注名（Nickname）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/nicknames` | 当前用户的所有备注名 | 认证 |
| PUT | `/api/nicknames/:targetUserId` | 设置/更新备注名 | 认证 |
| DELETE | `/api/nicknames/:targetUserId` | 删除备注名 | 认证 |

## 16. 工单（Ticket）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/tickets` | 创建工单 | 认证 |
| GET | `/api/tickets` | 工单列表（client 仅自己的） | 认证 |
| GET | `/api/tickets/:id` | 工单详情+回复 | 认证 |
| PUT | `/api/tickets/:id` | 更新状态/分配 | staff |
| POST | `/api/tickets/:id/reply` | 回复工单 | 认证 |
| POST | `/api/tickets/:id/rate` | 评价工单 | 提交者 |

## 17. AI 建议

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/clients/:clientId/ai-suggestion` | AI 跟进建议 | staff |

## 18. 用户管理（User）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/users` | 用户列表 | admin |
| POST | `/api/users` | 创建用户 | admin |
| PUT | `/api/users/:id` | 更新用户 | admin |
| DELETE | `/api/users/:id` | 删除用户 | admin |

## 19. 审计日志（Audit Log）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/audit-logs` | 审计日志列表（支持筛选/分页） | admin |

## 20. 通知（Notification）

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

## 21. 合作方管理（Partner）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/partners` | 合作方列表 | admin |
| POST | `/api/partners` | 创建合作方 | admin |
| PUT | `/api/partners/:id` | 更新合作方 | admin |
| DELETE | `/api/partners/:id` | 删除合作方 | admin |
| POST | `/api/partners/:id/reset-key` | 重置 API Key | admin |
| POST | `/api/partners/:id/test` | 测试连通性 | admin |
| POST | `/api/partners/:id/fetch` | 代理请求到合作方 | admin |

## 22. 企业管理（Enterprise）

### 22.1 企业 CRUD

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/my-enterprise` | 当前企业信息 | 认证 |
| POST | `/api/my-enterprise` | 创建企业 | 认证 |
| PUT | `/api/my-enterprise` | 更新企业 | 认证 |
| DELETE | `/api/my-enterprise` | 删除企业 | 认证 |
| GET | `/api/my-enterprise/all` | 用户所有企业 | 认证 |
| GET | `/api/my-enterprise/projects` | 企业项目列表 | 认证 |
| PUT | `/api/my-enterprise/switch` | 切换当前活跃企业 | 认证 |

### 22.2 加入企业

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/my-enterprise/search` | 搜索企业 | 认证 |
| GET | `/api/my-enterprise/recommended` | 推荐企业列表 | 认证 |
| POST | `/api/my-enterprise/join` | 申请加入企业 | 认证 |
| POST | `/api/my-enterprise/join-code/regenerate` | 重新生成加入码 | 认证 |
| GET | `/api/my-enterprise/join-requests` | 收到的加入申请 | 认证 |
| POST | `/api/my-enterprise/join-requests/:id/approve` | 批准加入申请 | 认证 |
| POST | `/api/my-enterprise/join-requests/:id/reject` | 拒绝加入申请 | 认证 |
| GET | `/api/my-enterprise/my-requests` | 我发出的加入申请 | 认证 |
| GET | `/api/my-enterprise/lookup-user` | 查找用户 | 认证 |

### 22.3 部门管理

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/my-enterprise/departments` | 创建部门 | 认证 |
| PUT | `/api/my-enterprise/departments/:id` | 更新部门 | 认证 |
| DELETE | `/api/my-enterprise/departments/:id` | 删除部门 | 认证 |

### 22.4 成员管理

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/my-enterprise/members` | 添加成员 | 认证 |
| PUT | `/api/my-enterprise/members/:id` | 更新成员 | 认证 |
| PUT | `/api/my-enterprise/members/:id/role` | 修改成员平台角色 | 认证 |
| DELETE | `/api/my-enterprise/members/:id` | 移除成员 | 认证 |
| POST | `/api/my-enterprise/leave` | 退出企业 | 认证 |

### 22.5 企业角色

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/my-enterprise/roles` | 角色列表 | 认证 |
| POST | `/api/my-enterprise/roles` | 创建角色 | 认证 |
| PUT | `/api/my-enterprise/roles/:id` | 更新角色 | 认证 |
| DELETE | `/api/my-enterprise/roles/:id` | 删除角色 | 认证 |
| PUT | `/api/my-enterprise/members/:id/assign-role` | 分配企业角色给成员 | 认证 |

### 22.6 企业级项目角色（跨项目共享）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/my-enterprise/project-roles` | 企业项目角色列表 | 认证 |
| POST | `/api/my-enterprise/project-roles` | 创建企业项目角色 | 认证 |
| PUT | `/api/my-enterprise/project-roles/:roleId` | 更新企业项目角色 | 认证 |
| DELETE | `/api/my-enterprise/project-roles/:roleId` | 删除企业项目角色 | 认证 |

### 22.7 合作企业资料（Enterprise Profile）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/enterprises/:id/profile` | 查看合作企业资料（成员/部门/共享项目） | 认证 + 企业关联 |

> 访问条件：请求者所在企业与目标企业之间存在项目关联或审批通过的客户请求。

## 23. 合作方开放接口（Open API）

认证方式：`X-API-Key` 请求头

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/open/clients` | 查询客户列表 | X-API-Key + clients:read |
| GET | `/api/open/clients/:id` | 查询单个客户 | X-API-Key + clients:read |
| POST | `/api/open/clients` | 创建客户 | X-API-Key + clients:write |
| GET | `/api/open/projects` | 查询项目列表 | X-API-Key + projects:read |
| GET | `/api/open/projects/:id` | 查询单个项目 | X-API-Key + projects:read |
| POST | `/api/open/webhook` | 接收 Webhook 事件 | X-API-Key + webhook |

## 24. 知识库（Knowledge Base）

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

## 25. 全局搜索 & 应用版本

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/search` | 全局搜索（项目/客户/需求/文件） | 认证 |
| GET | `/api/health` | 健康检查 | 公开 |
| GET | `/api/app/version` | 应用版本信息 | 公开 |
| GET | `/api/app/bundle` | 前端包信息 | 公开 |
| GET | `/api/app/bundle/download` | 下载前端包 | 公开 |

## 26. 邀请链接（Invite Link）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/invite-links` | 创建邀请链接 | admin |
| GET | `/api/invite-links` | 邀请链接列表 | admin |
| GET | `/api/invite-links/:token/validate` | 验证邀请链接 | 公开 |
| DELETE | `/api/invite-links/:id` | 删除邀请链接 | admin |

---

> 统计：295 个 API 端点，12 个路由文件
> 最后更新：v1.4.36.2（2026-04-13）
