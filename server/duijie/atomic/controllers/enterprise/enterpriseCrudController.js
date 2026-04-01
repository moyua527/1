const db = require('../../../config/db');
const { withTransaction } = require('../../utils/transaction');
const { findMyEnterprises, findActiveEnterprise, isCreator, getEnterprisePerms, canManage, generateJoinCode } = require('./enterpriseHelpers');
const { createDefaultRoles } = require('./enterpriseRoleController');
const { auditLog } = require('../../utils/auditLog');

exports.getAll = async (req, res) => {
  try {
    if (req.userRole !== 'admin') return res.status(403).json({ success: false, message: '仅系统管理员可查看' });
    const [enterprises] = await db.query(
      "SELECT c.*, u.nickname as creator_name FROM duijie_clients c LEFT JOIN voice_users u ON c.user_id = u.id WHERE c.client_type = 'company' AND c.is_deleted = 0 ORDER BY c.created_at DESC"
    );
    const ids = enterprises.map(e => e.id);
    let allMembers = [], allDepts = [];
    if (ids.length) {
      const ph = ids.map(() => '?').join(',');
      [allMembers] = (await db.query(`SELECT * FROM duijie_client_members WHERE client_id IN (${ph}) AND is_deleted = 0 ORDER BY created_at ASC`, ids));
      [allDepts] = (await db.query(`SELECT * FROM duijie_departments WHERE client_id IN (${ph}) AND is_deleted = 0 ORDER BY sort_order ASC, id ASC`, ids));
    }
    const list = enterprises.map(ent => ({
      enterprise: ent,
      members: allMembers.filter(m => m.client_id === ent.id),
      departments: allDepts.filter(d => d.client_id === ent.id),
    }));
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.create = async (req, res) => {
  try {
    const [owned] = await db.query("SELECT id FROM duijie_clients WHERE user_id = ? AND client_type = 'company' AND is_deleted = 0 LIMIT 1", [req.userId]);
    if (owned[0]) return res.status(400).json({ success: false, message: '每个用户只能创建一个企业' });
    const { name, company, email, phone, notes, industry, scale, address, credit_code, legal_person, registered_capital, established_date, business_scope, company_type, website } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入企业名称' });
    const joinCode = await generateJoinCode();
    const [result] = await db.query(
      `INSERT INTO duijie_clients (user_id, client_type, name, company, email, phone, notes, industry, scale, address, credit_code, legal_person, registered_capital, established_date, business_scope, company_type, website, created_by, stage, join_code) VALUES (?, 'company', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'signed', ?)`,
      [req.userId, name.trim(), company || null, email || null, phone || null, notes || null, industry || null, scale || null, address || null, credit_code || null, legal_person || null, registered_capital || null, established_date || null, business_scope || null, company_type || null, website || null, req.userId, joinCode]
    );
    const [user] = await db.query('SELECT nickname, username, phone, email FROM voice_users WHERE id = ?', [req.userId]);
    const u = user[0] || {};
    await db.query(
      "INSERT INTO duijie_client_members (client_id, user_id, name, phone, email, role, created_by) VALUES (?, ?, ?, ?, ?, 'creator', ?)",
      [result.insertId, req.userId, u.nickname || u.username || '', u.phone || null, u.email || null, req.userId]
    );
    await db.query('UPDATE voice_users SET active_enterprise_id = ? WHERE id = ?', [result.insertId, req.userId]);
    await createDefaultRoles(result.insertId, req.userId);
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.get = async (req, res) => {
  try {
    const enterprises = await findMyEnterprises(req.userId);
    if (enterprises.length === 0) return res.json({ success: true, data: null });
    const active = await findActiveEnterprise(req.userId);
    const [[members], [departments], [roles]] = await Promise.all([
      db.query('SELECT * FROM duijie_client_members WHERE client_id = ? AND is_deleted = 0 ORDER BY created_at ASC', [active.id]),
      db.query('SELECT * FROM duijie_departments WHERE client_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, id ASC', [active.id]),
      db.query('SELECT * FROM enterprise_roles WHERE enterprise_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, id ASC', [active.id]),
    ]);
    const perms = await getEnterprisePerms(req.userId);
    const enterprise = active.member_role === 'creator' || !!perms?.can_manage_members
      ? active
      : { ...active, join_code: null };
    res.json({ success: true, data: {
      enterprises: enterprises.map(e => ({ id: e.id, name: e.name, company: e.company, member_role: e.member_role })),
      activeId: active.id, enterprise, members, departments, roles, enterprisePerms: perms
    }});
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.update = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    if (!isCreator(ent)) return res.status(403).json({ success: false, message: '仅企业创建者可编辑企业信息' });
    const { name, company, email, phone, notes, industry, scale, address, credit_code, legal_person, registered_capital, established_date, business_scope, company_type, website } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入企业名称' });
    await db.query(
      'UPDATE duijie_clients SET name=?, company=?, email=?, phone=?, notes=?, industry=?, scale=?, address=?, credit_code=?, legal_person=?, registered_capital=?, established_date=?, business_scope=?, company_type=?, website=? WHERE id=?',
      [name.trim(), company || null, email || null, phone || null, notes || null, industry || null, scale || null, address || null, credit_code || null, legal_person || null, registered_capital || null, established_date || null, business_scope || null, company_type || null, website || null, ent.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.remove = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    if (!isCreator(ent)) return res.status(403).json({ success: false, message: '仅企业创建者可删除企业' });
    await withTransaction(async (conn) => {
      await conn.query('UPDATE duijie_clients SET is_deleted=1 WHERE id=?', [ent.id]);
      await conn.query('UPDATE duijie_client_members SET is_deleted=1 WHERE client_id=?', [ent.id]);
      await conn.query('UPDATE voice_users SET active_enterprise_id = NULL WHERE active_enterprise_id = ?', [ent.id]);
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.listProjects = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    const [projects] = await db.query(
      `SELECT p.*, u.nickname as creator_name,
              c.name as client_name, c.company as client_company,
              ic.name as internal_client_name, ic.company as internal_client_company
       FROM duijie_projects p
       LEFT JOIN voice_users u ON u.id = p.created_by
       LEFT JOIN duijie_clients c ON c.id = p.client_id
       LEFT JOIN duijie_clients ic ON ic.id = p.internal_client_id
       WHERE p.is_deleted = 0 AND (
         p.client_id = ?
         OR p.created_by IN (
           SELECT user_id FROM duijie_client_members WHERE client_id = ? AND is_deleted = 0 AND user_id IS NOT NULL
         )
         OR p.created_by = ?
       )
       ORDER BY p.created_at DESC`,
      [ent.id, ent.id, ent.user_id]
    );
    res.json({ success: true, data: projects });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.searchEnterprise = async (req, res) => {
  try {
    const name = (req.query.name || '').trim();
    const normalizedName = name.replace(/\s+/g, '');
    const useCharMatch = /[\u4e00-\u9fa5]/.test(normalizedName) && normalizedName.length > 1;
    const charKeywords = useCharMatch ? Array.from(new Set(normalizedName.split(''))) : [];
    const searchClauses = [];
    const searchParams = [req.userId, req.userId];

    if (name) {
      searchClauses.push('(c.name LIKE ? OR c.company LIKE ?)');
      searchParams.push(`%${name}%`, `%${name}%`);
    }

    if (charKeywords.length > 1) {
      searchClauses.push(`(${charKeywords.map(() => '(c.name LIKE ? OR c.company LIKE ?)').join(' AND ')})`);
      charKeywords.forEach(ch => {
        searchParams.push(`%${ch}%`, `%${ch}%`);
      });
    }

    const [rows] = await db.query(
      `SELECT c.id, c.name, c.company, c.industry, c.scale, c.created_at, COUNT(m.id) as member_count
       FROM duijie_clients c
       LEFT JOIN duijie_client_members m ON m.client_id = c.id AND m.is_deleted = 0
       WHERE c.client_type = 'company'
         AND c.is_deleted = 0
         AND c.user_id <> ?
         AND c.id NOT IN (
           SELECT client_id FROM duijie_client_members WHERE user_id = ? AND is_deleted = 0
         )
         ${searchClauses.length ? `AND (${searchClauses.join(' OR ')})` : ''}
       GROUP BY c.id, c.name, c.company, c.industry, c.scale, c.created_at
       ORDER BY member_count DESC, c.created_at DESC${name ? '\n       LIMIT 5' : ''}`,
      searchParams
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.recommendedEnterprises = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.name, c.company, c.industry, c.scale, c.created_at, COUNT(m.id) as member_count
       FROM duijie_clients c
       LEFT JOIN duijie_client_members m ON m.client_id = c.id AND m.is_deleted = 0
       WHERE c.client_type = 'company'
         AND c.is_deleted = 0
         AND c.user_id <> ?
         AND c.id NOT IN (
           SELECT client_id FROM duijie_client_members WHERE user_id = ? AND is_deleted = 0
         )
       GROUP BY c.id, c.name, c.company, c.industry, c.scale, c.created_at
       ORDER BY member_count DESC, c.created_at DESC
       LIMIT 6`,
      [req.userId, req.userId]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.regenerateJoinCode = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    if (!(await canManage(ent, req.userId))) return res.status(403).json({ success: false, message: '无权操作' });
    const joinCode = await generateJoinCode();
    await db.query('UPDATE duijie_clients SET join_code = ? WHERE id = ?', [joinCode, ent.id]);
    await auditLog({ userId: req.userId, action: 'regenerate_join_code', entityType: 'enterprise', entityId: ent.id, detail: `企业推荐码已重置为 ${joinCode}`, ip: req.ip });
    res.json({ success: true, data: { join_code: joinCode } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.lookupUser = async (req, res) => {
  try {
    const phone = (req.query.phone || '').trim();
    if (!/^\d{11}$/.test(phone)) return res.status(400).json({ success: false, message: '请输入11位手机号' });
    const [rows] = await db.query("SELECT id, username, nickname, email, phone, avatar FROM voice_users WHERE phone = ? AND is_deleted = 0 LIMIT 1", [phone]);
    if (!rows[0]) return res.json({ success: true, data: null, message: '未找到该手机号对应的账号' });
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.switchEnterprise = async (req, res) => {
  try {
    const { enterprise_id } = req.body;
    if (!enterprise_id) return res.status(400).json({ success: false, message: '请选择企业' });
    const enterprises = await findMyEnterprises(req.userId);
    const target = enterprises.find(e => e.id === Number(enterprise_id));
    if (!target) return res.status(403).json({ success: false, message: '您不属于该企业' });
    await db.query('UPDATE voice_users SET active_enterprise_id = ? WHERE id = ?', [Number(enterprise_id), req.userId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
