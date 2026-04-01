# 工程治理规范

## 1. 前端页面骨架标准

所有后台管理页面**必须**使用共享 UI 组件搭建，禁止手写标题区/搜索栏/空状态。

### 标准页面结构

```
<PageHeader title="XXX管理" subtitle="描述" actions={操作按钮} />
<StatsCards cards={概览卡片} />           // 可选，数据看板
<FilterBar search={...} filters={...} /> // 搜索+筛选
<BatchActionBar />                        // 可选，批量操作
<DataTable /> 或 卡片网格               // 数据展示
<EmptyState />                           // 空状态兜底
```

### 已拥有的共享组件

| 组件 | 路径 | 用途 |
|------|------|------|
| PageHeader | `features/ui/PageHeader.tsx` | 页面标题+副标题+操作区 |
| StatsCards | `features/ui/StatsCards.tsx` | 统计卡片网格 |
| FilterBar | `features/ui/FilterBar.tsx` | 搜索+下拉筛选+清除+结果数 |
| BatchActionBar | `features/ui/BatchActionBar.tsx` | 批量选中操作条 |
| EmptyState | `features/ui/EmptyState.tsx` | 空数据/无结果状态 |
| DataTable | `features/ui/DataTable.tsx` | 通用表格+分页+全选 |

### 已适配页面

- [x] 用户管理 `user/index.tsx` (样板页 - DataTable模式)
- [x] 客户管理 `client/index.tsx` (卡片模式)
- [x] 项目管理 `project/index.tsx` (卡片模式)
- [x] 工单管理 `ticket/index.tsx` (列表模式)
- [x] 用户设置 `user-settings/index.tsx` (表单模式)

---

## 2. 后端 API 错误码规范

所有错误响应**必须**包含 `code` 字段，使用 `AppError.Codes` 中的标准码。

### 错误码表

| 代码 | 名称 | HTTP | 含义 |
|------|------|------|------|
| 40001 | VALIDATION_ERROR | 400 | 参数校验失败 |
| 40002 | DUPLICATE_ENTRY | 400/409 | 唯一约束冲突 |
| 40101 | UNAUTHORIZED | 401 | 未认证 |
| 40102 | TOKEN_EXPIRED | 401 | Token过期 |
| 40301 | FORBIDDEN | 403 | 无权限 |
| 40401 | NOT_FOUND | 404 | 资源不存在 |
| 40901 | RESOURCE_CONFLICT | 409 | 资源状态冲突 |
| 40902 | VERSION_CONFLICT | 409 | 乐观锁版本冲突 |
| 42201 | INVALID_STATE_TRANSITION | 422 | 无效状态转移 |
| 50001 | INTERNAL_ERROR | 500 | 服务器内部错误 |

### 使用方式

```javascript
const AppError = require('../../utils/AppError');

// 工厂方法
throw AppError.notFound('项目不存在');
throw AppError.duplicate('该邮箱已注册');
throw AppError.versionConflict();
throw AppError.invalidTransition('todo', 'accepted');

// 自定义
throw new AppError('自定义消息', 400, AppError.Codes.VALIDATION_ERROR);
```

---

## 3. 权限能力模型

**原则：判断能力(capability)，不判断角色字符串。**

### 三层权限架构

```
平台角色: admin | member
  ↓
企业角色: enterprise_roles表 (can_manage_members, can_create_project, ...)
  ↓  
项目权限: project_members.enterprise_role_id → 映射能力集
```

### 能力字段一览

| 能力 | 含义 | 检查位置 |
|------|------|----------|
| can_manage_members | 管理企业成员 | enterprisePermGuard |
| can_manage_roles | 管理企业角色 | enterprisePermGuard |
| can_create_project | 创建项目 | enterprisePermGuard |
| can_edit_project | 编辑项目 | projectPerms |
| can_delete_project | 删除项目 | projectPerms |
| can_manage_client | 管理客户 | enterprisePermGuard |
| can_view_report | 查看报表 | enterprisePermGuard |
| can_manage_task | 管理任务 | projectPerms |

### 前端权限检查

```typescript
// 平台级
can(user.role, 'project:create')

// 项目级
const { perms } = useProjectPerms(projectId)
perms?.can_edit_project
```

---

## 4. 数据安全规范

### 乐观锁

核心表（tasks, projects, clients, tickets）已添加 `version` 字段。

```javascript
// 前端: 更新时携带 version
await api.update(id, { ...fields, version: item.version })

// 后端: 自动通过 optimisticUpdate 检查
// version不匹配 → 409 VERSION_CONFLICT
```

### 企业隔离

- `accessScope.js` 的 `getProjectAccessStatus` / `getClientAccessStatus` 会检查用户 `active_enterprise_id`
- `projectPerms.js` 也会验证项目归属企业
- 列表查询自动按企业范围过滤

### 事务保护

以下操作已包裹 `withTransaction()`:
- 企业加入（推荐码直接加入）
- 企业加入审批
- 企业删除级联
- 用户注册（验证码+创建+邀请链接）

### 文件安全

- 下载/预览/删除需要 `canAccessFile` 权限检查
- 预览禁止 HTML/CSS（防XSS）
- 预览响应头: CSP + X-Content-Type-Options: nosniff

---

## 5. 状态机

### 任务状态转移

```
todo → in_progress → pending_review → accepted
  ↑         ↓              ↓
  └─────────┘      ←── in_progress
```

不允许跳跃转移（如 todo → accepted）。

---

## 6. 构建与部署

### 本地构建
```bash
cd frontend/duijieReact && npm run build
```

### 部署
```bash
python deploy_update.py  # 自动上传+PM2重启+健康检查
```

### 版本号
- 单一来源: `version.json`
- 格式: `v{major}.{minor}.{patch}`, versionCode 递增

### 数据库迁移
- 文件: `server/duijie/migrations/NNN_description.sql`
- 命名: 三位数字前缀，递增
- 执行: 通过 SSH 手动执行或脚本
