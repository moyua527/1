const express = require('express');
const router = express.Router();
const partnerAuth = require('../middleware/partnerAuth');
const db = require('../../config/db');

// ========== 开放给合作方调用的接口 ==========
// 所有接口前缀: /api/open/...
// 认证方式: Header X-API-Key

// 查询客户列表
router.get('/open/clients', partnerAuth('clients:read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE is_deleted = 0';
    const params = [];
    if (search) {
      where += ' AND (name LIKE ? OR company LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    const [rows] = await db.query(
      `SELECT id, name, company, email, phone, stage, channel, created_at FROM duijie_clients ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM duijie_clients ${where}`, params);
    res.json({ success: true, data: rows, total, page: Number(page), limit: Number(limit) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 查询单个客户
router.get('/open/clients/:id', partnerAuth('clients:read'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, company, email, phone, stage, channel, notes, created_at FROM duijie_clients WHERE id = ? AND is_deleted = 0',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: '客户不存在' });
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 查询项目列表
router.get('/open/projects', partnerAuth('projects:read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE p.is_deleted = 0';
    const params = [];
    if (status) { where += ' AND p.status = ?'; params.push(status); }
    const [rows] = await db.query(
      `SELECT p.id, p.name, p.description, p.status, p.client_id, c.name as client_name, p.created_at
       FROM duijie_projects p LEFT JOIN duijie_clients c ON p.client_id = c.id ${where} ORDER BY p.id DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 查询单个项目
router.get('/open/projects/:id', partnerAuth('projects:read'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.name, p.description, p.status, p.client_id, c.name as client_name, p.start_date, p.end_date, p.budget, p.created_at
       FROM duijie_projects p LEFT JOIN duijie_clients c ON p.client_id = c.id WHERE p.id = ? AND p.is_deleted = 0`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: '项目不存在' });
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 创建客户（合作方推送数据到 DuiJie）
router.post('/open/clients', partnerAuth('clients:write'), async (req, res) => {
  try {
    const { name, company, email, phone, channel, stage, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, message: '客户名称必填' });
    const [result] = await db.query(
      'INSERT INTO duijie_clients (name, company, email, phone, channel, stage, notes, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, company, email, phone, channel || '合作方导入', stage || 'potential', notes, `partner:${req.partnerName}`]
    );
    res.json({ success: true, data: { id: result.insertId }, message: '客户创建成功' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 推送/同步数据（通用 webhook 接收）
router.post('/open/webhook', partnerAuth('webhook'), async (req, res) => {
  try {
    const { event, data } = req.body;
    if (!event) return res.status(400).json({ success: false, message: '缺少 event 字段' });

    // 记录到审计日志
    await db.query(
      'INSERT INTO duijie_audit_logs (username, action, entity_type, detail, ip) VALUES (?, ?, ?, ?, ?)',
      [`partner:${req.partnerName}`, 'webhook', event, JSON.stringify(data || {}), req.ip]
    );

    res.json({ success: true, message: `webhook [${event}] 已接收` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ========== 合作方管理接口（admin 用）==========
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const adminOnly = roleGuard('admin');
const crypto = require('crypto');

// 生成 API Key
function generateApiKey(prefix = 'dj') {
  return `${prefix}_${crypto.randomBytes(24).toString('hex')}`;
}

// 合作方列表
router.get('/partners', auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, partner_name, api_key, partner_url, permissions, is_active, last_used_at, call_count, created_at, notes FROM duijie_partner_api_keys ORDER BY id DESC'
    );
    rows.forEach(r => { if (r.permissions) r.permissions = JSON.parse(r.permissions); });
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 创建合作方
router.post('/partners', auth, adminOnly, async (req, res) => {
  try {
    const { partner_name, partner_url, partner_key, permissions, notes } = req.body;
    if (!partner_name) return res.status(400).json({ success: false, message: '合作方名称必填' });
    const apiKey = generateApiKey();
    const [result] = await db.query(
      'INSERT INTO duijie_partner_api_keys (partner_name, api_key, partner_url, partner_key, permissions, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [partner_name, apiKey, partner_url || null, partner_key || null, JSON.stringify(permissions || []), notes || null, req.userId]
    );
    res.json({ success: true, data: { id: result.insertId, api_key: apiKey }, message: '合作方创建成功，请将 API Key 发送给对方' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 更新合作方
router.put('/partners/:id', auth, adminOnly, async (req, res) => {
  try {
    const { partner_name, partner_url, partner_key, permissions, is_active, notes } = req.body;
    await db.query(
      'UPDATE duijie_partner_api_keys SET partner_name=?, partner_url=?, partner_key=?, permissions=?, is_active=?, notes=? WHERE id=?',
      [partner_name, partner_url || null, partner_key || null, JSON.stringify(permissions || []), is_active ?? 1, notes || null, req.params.id]
    );
    res.json({ success: true, message: '更新成功' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 重置 API Key
router.post('/partners/:id/reset-key', auth, adminOnly, async (req, res) => {
  try {
    const newKey = generateApiKey();
    await db.query('UPDATE duijie_partner_api_keys SET api_key = ? WHERE id = ?', [newKey, req.params.id]);
    res.json({ success: true, data: { api_key: newKey }, message: 'API Key 已重置，请重新发送给合作方' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 删除合作方
router.delete('/partners/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM duijie_partner_api_keys WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '已删除' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 测试调用合作方接口
router.post('/partners/:id/test', auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT partner_url, partner_key FROM duijie_partner_api_keys WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: '合作方不存在' });
    const { partner_url, partner_key } = rows[0];
    if (!partner_url) return res.status(400).json({ success: false, message: '未配置合作方接口地址' });

    const axios = require('axios');
    const resp = await axios.get(partner_url, {
      headers: partner_key ? { 'X-API-Key': partner_key } : {},
      timeout: 10000,
    });
    res.json({ success: true, data: { status: resp.status, body: resp.data }, message: '连接成功' });
  } catch (e) {
    res.json({ success: false, message: `连接失败: ${e.message}` });
  }
});

// 代理请求：在 DuiJie 后端转发请求到合作方的 API
router.post('/partners/:id/fetch', auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT partner_url, partner_key, partner_name FROM duijie_partner_api_keys WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: '合作方不存在' });
    const { partner_url, partner_key, partner_name } = rows[0];
    if (!partner_url) return res.status(400).json({ success: false, message: '未配置合作方接口地址' });

    const { path = '', method = 'GET', body: reqBody } = req.body;
    const url = partner_url.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');

    const axios = require('axios');
    const config = {
      method: method.toLowerCase(),
      url,
      headers: {
        'Content-Type': 'application/json',
        ...(partner_key ? { 'X-API-Key': partner_key, 'Authorization': `Bearer ${partner_key}` } : {}),
      },
      timeout: 15000,
    };
    if (reqBody && ['post', 'put', 'patch'].includes(config.method)) {
      config.data = reqBody;
    }

    const resp = await axios(config);
    logger.info(`partner proxy [${partner_name}] ${method} ${url} -> ${resp.status}`);
    res.json({ success: true, data: resp.data, status: resp.status });
  } catch (e) {
    const status = e.response?.status;
    const data = e.response?.data;
    if (status && data) {
      res.json({ success: false, data, status, message: `对方返回 ${status}` });
    } else {
      res.json({ success: false, message: `请求失败: ${e.message}` });
    }
  }
});

module.exports = router;
