# DuiJie 第三方系统对接指南

> 本文档面向需要与 DuiJie 系统进行数据互通的合作方开发者。
>
> DuiJie 后端地址：`http://160.202.253.143:1800`（线上）

---

## 一、对接流程概览

```
1. DuiJie 管理员在「合作方管理」页面创建你的账号
2. 你会收到一个 API Key（格式：dj_xxxxxx...）
3. 你用这个 Key 调用 DuiJie 的开放接口
4.（可选）你也提供接口给 DuiJie 调用
```

---

## 二、认证方式

所有开放接口使用 **API Key** 认证，通过 HTTP Header 传递：

```
X-API-Key: dj_你收到的密钥
```

示例（curl）：

```bash
curl -H "X-API-Key: dj_abc123def456" \
     http://160.202.253.143:1800/api/open/clients
```

示例（JavaScript / Node.js）：

```javascript
const res = await fetch('http://160.202.253.143:1800/api/open/clients', {
  headers: { 'X-API-Key': 'dj_abc123def456' }
});
const data = await res.json();
console.log(data);
```

示例（Python）：

```python
import requests

res = requests.get(
    'http://160.202.253.143:1800/api/open/clients',
    headers={'X-API-Key': 'dj_abc123def456'}
)
print(res.json())
```

示例（Java / OkHttp）：

```java
Request request = new Request.Builder()
    .url("http://160.202.253.143:1800/api/open/clients")
    .addHeader("X-API-Key", "dj_abc123def456")
    .build();
Response response = client.newCall(request).execute();
```

---

## 三、开放接口清单

所有接口前缀：`/api/open/`

### 3.1 查询客户列表

```
GET /api/open/clients
权限要求：clients:read
```

参数（Query）：

| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码，默认 1 |
| limit | number | 每页条数，默认 20 |
| search | string | 搜索关键词（名称/公司） |

返回示例：

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "张三",
      "company": "ABC科技",
      "email": "zhangsan@abc.com",
      "phone": "13800138000",
      "stage": "signed",
      "channel": "微信",
      "created_at": "2025-01-15T08:00:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### 3.2 查询单个客户

```
GET /api/open/clients/:id
权限要求：clients:read
```

返回示例：

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "张三",
    "company": "ABC科技",
    "email": "zhangsan@abc.com",
    "phone": "13800138000",
    "stage": "signed",
    "channel": "微信",
    "notes": "重要客户",
    "created_at": "2025-01-15T08:00:00.000Z"
  }
}
```

### 3.3 创建客户（推送数据到 DuiJie）

```
POST /api/open/clients
权限要求：clients:write
Content-Type: application/json
```

请求体：

```json
{
  "name": "李四",
  "company": "XYZ物流",
  "email": "lisi@xyz.com",
  "phone": "13900139000",
  "channel": "合作方导入",
  "stage": "potential",
  "notes": "从货联系统同步"
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| name | 是 | 客户名称 |
| company | 否 | 公司名称 |
| email | 否 | 邮箱 |
| phone | 否 | 电话 |
| channel | 否 | 渠道来源，默认"合作方导入" |
| stage | 否 | 阶段：potential / intention / signed / cooperation，默认 potential |
| notes | 否 | 备注 |

返回示例：

```json
{
  "success": true,
  "data": { "id": 123 },
  "message": "客户创建成功"
}
```

### 3.4 查询项目列表

```
GET /api/open/projects
权限要求：projects:read
```

参数（Query）：

| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码 |
| limit | number | 每页条数 |
| status | string | 状态筛选：planning / active / completed |

返回示例：

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "XX项目",
      "description": "项目描述",
      "status": "active",
      "client_id": 5,
      "client_name": "ABC科技",
      "created_at": "2025-02-01T10:00:00.000Z"
    }
  ]
}
```

### 3.5 查询单个项目

```
GET /api/open/projects/:id
权限要求：projects:read
```

### 3.6 Webhook（事件推送）

```
POST /api/open/webhook
权限要求：webhook
Content-Type: application/json
```

你可以向 DuiJie 推送事件通知：

```json
{
  "event": "order.completed",
  "data": {
    "order_id": "HL-2025-001",
    "amount": 15000,
    "client_name": "ABC科技"
  }
}
```

---

## 四、错误码

| HTTP 状态码 | 含义 |
|------------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | API Key 无效或缺失 |
| 403 | 该 Key 无此接口权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

所有错误返回格式：

```json
{
  "success": false,
  "message": "错误描述"
}
```

---

## 五、反向对接（DuiJie 调你的接口）

如果你也希望 DuiJie 主动调用你的系统，需要提供：

1. **你的接口地址**（如 `http://111.170.173.24:1120/api`）
2. **你给 DuiJie 的 API Key**
3. **你的接口文档**（URL + 参数 + 返回格式）

DuiJie 管理员会在「合作方管理」页面配置你的接口地址和密钥，配置完成后可在页面上一键测试连通性。

### 你的接口需要支持的规范

```
认证方式：请求头 X-API-Key
返回格式：JSON
字符编码：UTF-8

建议的接口结构：
GET  /api/your-data          查询数据
POST /api/your-data          创建数据
PUT  /api/your-data/:id      更新数据

返回格式示例：
{
  "success": true,     // 或 false
  "data": { ... },     // 业务数据
  "message": "描述"    // 可选，错误时必填
}
```

---

## 六、快速测试

### 用 curl 测试（命令行）

```bash
# 1. 测试认证是否正常
curl -H "X-API-Key: 你的密钥" \
     http://160.202.253.143:1800/api/open/clients

# 2. 创建一个测试客户
curl -X POST \
     -H "X-API-Key: 你的密钥" \
     -H "Content-Type: application/json" \
     -d '{"name":"测试客户","company":"测试公司"}' \
     http://160.202.253.143:1800/api/open/clients

# 3. 发送 webhook
curl -X POST \
     -H "X-API-Key: 你的密钥" \
     -H "Content-Type: application/json" \
     -d '{"event":"test.ping","data":{"message":"连接成功"}}' \
     http://160.202.253.143:1800/api/open/webhook
```

### 用 Postman/Apifox 测试

1. 新建请求，URL 填 `http://160.202.253.143:1800/api/open/clients`
2. Headers 添加：`X-API-Key` = `你的密钥`
3. 点击发送，查看返回数据

---

## 七、联系方式

对接过程中遇到问题，请联系：

- DuiJie 系统管理员
- 在 DuiJie 系统内提交工单（工单系统 → 类型选"技术"）

---

## 八、安全须知

1. **API Key 是敏感信息**，请妥善保管，不要硬编码在前端代码或公开仓库中
2. 建议将 Key 存储在环境变量或配置中心
3. 如果 Key 泄露，请立即联系管理员重置
4. 所有调用记录会被审计日志记录
