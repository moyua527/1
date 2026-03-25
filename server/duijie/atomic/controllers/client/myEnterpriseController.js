const db = require('../../../config/db');

// 查找用户关联的所有企业（作为创建者或成员）
async function findMyEnterprises(userId) {
  const [rows] = await db.query(
    `SELECT c.*,
       CASE WHEN c.user_id = ? THEN 'creator' ELSE COALESCE(m.role, 'member') END as member_role,
       CASE WHEN c.user_id = ? THEN 1 ELSE 0 END as is_owner
     FROM duijie_clients c
     LEFT JOIN duijie_client_members m ON m.client_id = c.id AND m.user_id = ? AND m.is_deleted = 0
     WHERE c.client_type = 'company' AND c.is_deleted = 0
       AND (c.user_id = ? OR m.id IS NOT NULL)
     ORDER BY CASE WHEN c.user_id = ? THEN 0 ELSE 1 END, c.created_at ASC`,
    [userId, userId, userId, userId, userId]
  );
  return rows;
}

// 获取用户当前活跃的企业
async function findActiveEnterprise(userId) {
  const enterprises = await findMyEnterprises(userId);
  if (enterprises.length === 0) return null;
  const [userRow] = await db.query('SELECT active_enterprise_id FROM voice_users WHERE id = ?', [userId]);
  const activeId = userRow[0]?.active_enterprise_id;
  if (activeId) {
    const active = enterprises.find(e => e.id === activeId);
    if (active) return active;
  }
  return enterprises[0];
}

// 权限检查：creator > admin > member
function canManage(ent) { return ent && (ent.member_role === 'creator' || ent.member_role === 'admin'); }
function isCreator(ent) { return ent && ent.member_role === 'creator'; }

// GET /api/my-enterprise/all — 系统管理员查看所有企业
exports.getAll = async (req, res) => {
  try {
    if (req.userRole !== 'admin') return res.status(403).json({ success: false, message: '仅系统管理员可查看' });
    const [enterprises] = await db.query(
      "SELECT c.*, u.nickname as creator_name FROM duijie_clients c LEFT JOIN voice_users u ON c.user_id = u.id WHERE c.client_type = 'company' AND c.is_deleted = 0 ORDER BY c.created_at DESC"
    );
    const list = [];
    for (const ent of enterprises) {
      const [members] = await db.query('SELECT * FROM duijie_client_members WHERE client_id = ? AND is_deleted = 0 ORDER BY created_at ASC', [ent.id]);
      const [departments] = await db.query('SELECT * FROM duijie_departments WHERE client_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, id ASC', [ent.id]);
      list.push({ enterprise: ent, members, departments });
    }
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// POST /api/my-enterprise — 创建企业
exports.create = async (req, res) => {
  try {
    const [owned] = await db.query("SELECT id FROM duijie_clients WHERE user_id = ? AND client_type = 'company' AND is_deleted = 0 LIMIT 1", [req.userId]);
    if (owned[0]) return res.status(400).json({ success: false, message: '每个用户只能创建一个企业' });
    const { name, company, email, phone, notes, industry, scale, address, credit_code, legal_person, registered_capital, established_date, business_scope, company_type, website } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入企业名称' });
    const [result] = await db.query(
      `INSERT INTO duijie_clients (user_id, client_type, name, company, email, phone, notes, industry, scale, address, credit_code, legal_person, registered_capital, established_date, business_scope, company_type, website, created_by, stage) VALUES (?, 'company', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'signed')`,
      [req.userId, name.trim(), company || null, email || null, phone || null, notes || null, industry || null, scale || null, address || null, credit_code || null, legal_person || null, registered_capital || null, established_date || null, business_scope || null, company_type || null, website || null, req.userId]
    );
    // 自动将创建者加入成员表，角色为creator
    const [user] = await db.query('SELECT nickname, username, phone, email FROM voice_users WHERE id = ?', [req.userId]);
    const u = user[0] || {};
    await db.query(
      "INSERT INTO duijie_client_members (client_id, user_id, name, phone, email, role, created_by) VALUES (?, ?, ?, ?, ?, 'creator', ?)",
      [result.insertId, req.userId, u.nickname || u.username || '', u.phone || null, u.email || null, req.userId]
    );
    await db.query('UPDATE voice_users SET active_enterprise_id = ? WHERE id = ?', [result.insertId, req.userId]);
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// GET /api/my-enterprise — 返回所有企业列表 + 当前活跃企业详情
exports.get = async (req, res) => {
  try {
    const enterprises = await findMyEnterprises(req.userId);
    if (enterprises.length === 0) return res.json({ success: true, data: null });
    const active = await findActiveEnterprise(req.userId);
    const [members] = await db.query(
      'SELECT * FROM duijie_client_members WHERE client_id = ? AND is_deleted = 0 ORDER BY created_at ASC',
      [active.id]
    );
    const [departments] = await db.query(
      'SELECT * FROM duijie_departments WHERE client_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, id ASC',
      [active.id]
    );
    res.json({ success: true, data: {
      enterprises: enterprises.map(e => ({ id: e.id, name: e.name, company: e.company, member_role: e.member_role })),
      activeId: active.id,
      enterprise: active, members, departments
    }});
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// PUT /api/my-enterprise — 更新企业信息（仅创建者可操作）
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

// DELETE /api/my-enterprise — 删除企业（仅创建者）
exports.remove = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    if (!isCreator(ent)) return res.status(403).json({ success: false, message: '仅企业创建者可删除企业' });
    await db.query('UPDATE duijie_clients SET is_deleted=1 WHERE id=?', [ent.id]);
    await db.query('UPDATE duijie_client_members SET is_deleted=1 WHERE client_id=?', [ent.id]);
    await db.query('UPDATE voice_users SET active_enterprise_id = NULL WHERE active_enterprise_id = ?', [ent.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// POST /api/my-enterprise/members — 添加成员
exports.addMember = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    const { name, position, department, phone, email, notes, employee_id, join_date, supervisor, department_id } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入成员姓名' });
    const [result] = await db.query(
      'INSERT INTO duijie_client_members (client_id, name, position, department, phone, email, notes, employee_id, join_date, supervisor, department_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ent.id, name.trim(), position || null, department || null, phone || null, email || null, notes || null, employee_id || null, join_date || null, supervisor || null, department_id || null, req.userId]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// PUT /api/my-enterprise/members/:id — 更新成员
exports.updateMember = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    const { name, position, department, phone, email, notes, employee_id, join_date, supervisor, department_id } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入成员姓名' });
    await db.query(
      'UPDATE duijie_client_members SET name=?, position=?, department=?, phone=?, email=?, notes=?, employee_id=?, join_date=?, supervisor=?, department_id=? WHERE id=? AND client_id=? AND is_deleted=0',
      [name.trim(), position || null, department || null, phone || null, email || null, notes || null, employee_id || null, join_date || null, supervisor || null, department_id || null, req.params.id, ent.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// DELETE /api/my-enterprise/members/:id — 删除成员
exports.removeMember = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    await db.query(
      'UPDATE duijie_client_members SET is_deleted=1 WHERE id=? AND client_id=?',
      [req.params.id, ent.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// GET /api/my-enterprise/search?name=xxx
exports.searchEnterprise = async (req, res) => {
  try {
    const name = (req.query.name || '').trim();
    if (!name || name.length < 1) return res.json({ success: true, data: [] });
    const [rows] = await db.query(
      "SELECT id, name, company, industry, scale FROM duijie_clients WHERE client_type = 'company' AND is_deleted = 0 AND (name LIKE ? OR company LIKE ?) LIMIT 10",
      [`%${name}%`, `%${name}%`]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// POST /api/my-enterprise/join — 申请加入企业（需管理员审批）
exports.joinEnterprise = async (req, res) => {
  try {
    const { enterprise_id } = req.body;
    if (!enterprise_id) return res.status(400).json({ success: false, message: '请选择要加入的企业' });
    const [ent] = await db.query("SELECT id, name FROM duijie_clients WHERE id = ? AND client_type = 'company' AND is_deleted = 0", [enterprise_id]);
    if (!ent[0]) return res.status(404).json({ success: false, message: '企业不存在' });
    const [dup] = await db.query('SELECT id FROM duijie_client_members WHERE client_id = ? AND user_id = ? AND is_deleted = 0', [enterprise_id, req.userId]);
    if (dup[0]) return res.status(400).json({ success: false, message: '您已是该企业成员' });
    const [pendingDup] = await db.query("SELECT id FROM duijie_join_requests WHERE client_id = ? AND user_id = ? AND status = 'pending'", [enterprise_id, req.userId]);
    if (pendingDup[0]) return res.status(400).json({ success: false, message: '您已提交申请，请等待审批' });
    await db.query('INSERT INTO duijie_join_requests (client_id, user_id) VALUES (?, ?)', [enterprise_id, req.userId]);
    res.json({ success: true, message: `已向「${ent[0].name}」提交加入申请，请等待管理员审批` });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// GET /api/my-enterprise/join-requests — 管理者查看待审批申请
exports.listJoinRequests = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent || !canManage(ent)) return res.json({ success: true, data: [] });
    const [rows] = await db.query(
      `SELECT r.id, r.user_id, r.status, r.created_at, u.nickname, u.username, u.phone, u.email, u.avatar
       FROM duijie_join_requests r LEFT JOIN voice_users u ON u.id = r.user_id
       WHERE r.client_id = ? AND r.status = 'pending' ORDER BY r.created_at DESC`,
      [ent.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// POST /api/my-enterprise/join-requests/:id/approve
exports.approveJoinRequest = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent || !canManage(ent)) return res.status(403).json({ success: false, message: '无权操作' });
    const [reqRows] = await db.query("SELECT * FROM duijie_join_requests WHERE id = ? AND client_id = ? AND status = 'pending'", [req.params.id, ent.id]);
    if (!reqRows[0]) return res.status(404).json({ success: false, message: '申请不存在或已处理' });
    const jr = reqRows[0];
    await db.query("UPDATE duijie_join_requests SET status = 'approved', handled_at = NOW(), handled_by = ? WHERE id = ?", [req.userId, jr.id]);
    const [user] = await db.query('SELECT nickname, username, phone, email FROM voice_users WHERE id = ?', [jr.user_id]);
    const u = user[0] || {};
    await db.query(
      'INSERT INTO duijie_client_members (client_id, user_id, name, phone, email, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [ent.id, jr.user_id, u.nickname || u.username || '', u.phone || null, u.email || null, req.userId]
    );
    await db.query('UPDATE voice_users SET active_enterprise_id = ? WHERE id = ? AND active_enterprise_id IS NULL', [ent.id, jr.user_id]);
    res.json({ success: true, message: '已批准' });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// POST /api/my-enterprise/join-requests/:id/reject
exports.rejectJoinRequest = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent || !canManage(ent)) return res.status(403).json({ success: false, message: '无权操作' });
    await db.query("UPDATE duijie_join_requests SET status = 'rejected', handled_at = NOW(), handled_by = ? WHERE id = ? AND client_id = ? AND status = 'pending'", [req.userId, req.params.id, ent.id]);
    res.json({ success: true, message: '已拒绝' });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// GET /api/my-enterprise/my-requests — 用户查看自己的申请状态
exports.myJoinRequests = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.client_id, r.status, r.created_at, c.name as enterprise_name
       FROM duijie_join_requests r LEFT JOIN duijie_clients c ON c.id = r.client_id
       WHERE r.user_id = ? ORDER BY r.created_at DESC LIMIT 10`,
      [req.userId]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// GET /api/my-enterprise/lookup-user?phone=xxx
exports.lookupUser = async (req, res) => {
  try {
    const phone = (req.query.phone || '').trim();
    if (!/^\d{11}$/.test(phone)) return res.status(400).json({ success: false, message: '请输入11位手机号' });
    const [rows] = await db.query(
      "SELECT id, username, nickname, email, phone, avatar FROM voice_users WHERE phone = ? AND is_deleted = 0 LIMIT 1",
      [phone]
    );
    if (!rows[0]) return res.json({ success: true, data: null, message: '未找到该手机号对应的账号' });
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// === 部门管理 ===

// POST /api/my-enterprise/departments
exports.addDepartment = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    const { name, parent_id } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入部门名称' });
    const [result] = await db.query(
      'INSERT INTO duijie_departments (client_id, name, parent_id) VALUES (?, ?, ?)',
      [ent.id, name.trim(), parent_id || null]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// PUT /api/my-enterprise/departments/:id
exports.updateDepartment = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    const { name, parent_id, sort_order } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入部门名称' });
    await db.query(
      'UPDATE duijie_departments SET name=?, parent_id=?, sort_order=? WHERE id=? AND client_id=? AND is_deleted=0',
      [name.trim(), parent_id || null, sort_order ?? 0, req.params.id, ent.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// DELETE /api/my-enterprise/departments/:id
exports.removeDepartment = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    await db.query('UPDATE duijie_departments SET is_deleted=1 WHERE id=? AND client_id=?', [req.params.id, ent.id]);
    await db.query('UPDATE duijie_client_members SET department_id=NULL WHERE department_id=? AND client_id=?', [req.params.id, ent.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// PUT /api/my-enterprise/switch — 切换当前活跃企业
exports.switchEnterprise = async (req, res) => {
  try {
    const { enterprise_id } = req.body;
    if (!enterprise_id) return res.status(400).json({ success: false, message: '请选择企业' });
    const enterprises = await findMyEnterprises(req.userId);
    const target = enterprises.find(e => e.id === enterprise_id);
    if (!target) return res.status(403).json({ success: false, message: '您不属于该企业' });
    await db.query('UPDATE voice_users SET active_enterprise_id = ? WHERE id = ?', [enterprise_id, req.userId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// PUT /api/my-enterprise/members/:id/role — 修改成员角色（仅创建者可操作）
exports.updateMemberRole = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    if (!isCreator(ent)) return res.status(403).json({ success: false, message: '仅企业创建者可修改成员角色' });
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) return res.status(400).json({ success: false, message: '角色只能是 admin 或 member' });
    const [target] = await db.query('SELECT * FROM duijie_client_members WHERE id = ? AND client_id = ? AND is_deleted = 0', [req.params.id, ent.id]);
    if (!target[0]) return res.status(404).json({ success: false, message: '成员不存在' });
    if (target[0].role === 'creator') return res.status(400).json({ success: false, message: '无法修改创建者角色' });
    await db.query('UPDATE duijie_client_members SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
