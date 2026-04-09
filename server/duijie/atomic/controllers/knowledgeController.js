const db = require('../../config/db');
const logger = require('../../config/logger');

// GET /api/kb/categories
exports.listCategories = async (req, res) => {
  try {
    const eid = req.activeEnterpriseId;
    if (!eid) return res.status(400).json({ success: false, message: '请先选择企业' });
    const [rows] = await db.query(
      'SELECT id, name, parent_id, sort_order FROM duijie_kb_categories WHERE enterprise_id = ? ORDER BY sort_order, id', [eid]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    logger.error(`[kb] listCategories: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// POST /api/kb/categories
exports.createCategory = async (req, res) => {
  try {
    const eid = req.activeEnterpriseId;
    if (!eid) return res.status(400).json({ success: false, message: '请先选择企业' });
    const { name, parent_id } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: '分类名称不能为空' });
    const [result] = await db.query(
      'INSERT INTO duijie_kb_categories (enterprise_id, name, parent_id, created_by) VALUES (?, ?, ?, ?)',
      [eid, name.trim(), parent_id || null, req.userId]
    );
    res.json({ success: true, data: { id: result.insertId, name: name.trim(), parent_id: parent_id || null } });
  } catch (e) {
    logger.error(`[kb] createCategory: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// PUT /api/kb/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const eid = req.activeEnterpriseId;
    const { name, parent_id, sort_order } = req.body;
    await db.query(
      'UPDATE duijie_kb_categories SET name = COALESCE(?, name), parent_id = ?, sort_order = COALESCE(?, sort_order) WHERE id = ? AND enterprise_id = ?',
      [name?.trim() || null, parent_id ?? null, sort_order ?? null, req.params.id, eid]
    );
    res.json({ success: true });
  } catch (e) {
    logger.error(`[kb] updateCategory: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// DELETE /api/kb/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const eid = req.activeEnterpriseId;
    await db.query('UPDATE duijie_kb_articles SET category_id = NULL WHERE category_id = ? AND enterprise_id = ?', [req.params.id, eid]);
    await db.query('UPDATE duijie_kb_categories SET parent_id = NULL WHERE parent_id = ? AND enterprise_id = ?', [req.params.id, eid]);
    await db.query('DELETE FROM duijie_kb_categories WHERE id = ? AND enterprise_id = ?', [req.params.id, eid]);
    res.json({ success: true });
  } catch (e) {
    logger.error(`[kb] deleteCategory: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// GET /api/kb/articles
exports.listArticles = async (req, res) => {
  try {
    const eid = req.activeEnterpriseId;
    if (!eid) return res.status(400).json({ success: false, message: '请先选择企业' });
    const { category_id, status, search, page = 1, limit = 20 } = req.query;
    const conds = ['a.enterprise_id = ?', 'a.is_deleted = 0'];
    const params = [eid];

    if (category_id) { conds.push('a.category_id = ?'); params.push(category_id); }
    if (status) { conds.push('a.status = ?'); params.push(status); }
    if (search?.trim()) {
      conds.push('(a.title LIKE ? OR a.content LIKE ? OR a.tags LIKE ?)');
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw);
    }

    const offset = (Math.max(parseInt(page), 1) - 1) * parseInt(limit);
    const where = conds.join(' AND ');

    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM duijie_kb_articles a WHERE ${where}`, params);
    const [rows] = await db.query(
      `SELECT a.id, a.title, a.category_id, a.tags, a.status, a.view_count,
              a.created_by, a.updated_by, a.created_at, a.updated_at,
              c.name AS category_name,
              u.nickname AS author_name, u.avatar AS author_avatar,
              LEFT(a.content, 200) AS excerpt
       FROM duijie_kb_articles a
       LEFT JOIN duijie_kb_categories c ON c.id = a.category_id
       LEFT JOIN voice_users u ON u.id = a.created_by
       WHERE ${where}
       ORDER BY a.updated_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    res.json({ success: true, data: { total, rows, page: parseInt(page), limit: parseInt(limit) } });
  } catch (e) {
    logger.error(`[kb] listArticles: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// GET /api/kb/articles/:id
exports.getArticle = async (req, res) => {
  try {
    const eid = req.activeEnterpriseId;
    const [rows] = await db.query(
      `SELECT a.*, c.name AS category_name,
              u.nickname AS author_name, u.avatar AS author_avatar
       FROM duijie_kb_articles a
       LEFT JOIN duijie_kb_categories c ON c.id = a.category_id
       LEFT JOIN voice_users u ON u.id = a.created_by
       WHERE a.id = ? AND a.enterprise_id = ? AND a.is_deleted = 0`,
      [req.params.id, eid]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: '文章不存在' });
    await db.query('UPDATE duijie_kb_articles SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    logger.error(`[kb] getArticle: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// POST /api/kb/articles
exports.createArticle = async (req, res) => {
  try {
    const eid = req.activeEnterpriseId;
    if (!eid) return res.status(400).json({ success: false, message: '请先选择企业' });
    const { title, content, category_id, tags, status = 'draft' } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, message: '标题不能为空' });
    const [result] = await db.query(
      'INSERT INTO duijie_kb_articles (enterprise_id, category_id, title, content, tags, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [eid, category_id || null, title.trim(), content || '', tags || null, status, req.userId]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    logger.error(`[kb] createArticle: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// PUT /api/kb/articles/:id
exports.updateArticle = async (req, res) => {
  try {
    const eid = req.activeEnterpriseId;
    const { title, content, category_id, tags, status } = req.body;
    const sets = ['updated_by = ?'];
    const params = [req.userId];
    if (title !== undefined) { sets.push('title = ?'); params.push(title.trim()); }
    if (content !== undefined) { sets.push('content = ?'); params.push(content); }
    if (category_id !== undefined) { sets.push('category_id = ?'); params.push(category_id || null); }
    if (tags !== undefined) { sets.push('tags = ?'); params.push(tags); }
    if (status !== undefined) { sets.push('status = ?'); params.push(status); }
    params.push(req.params.id, eid);
    await db.query(`UPDATE duijie_kb_articles SET ${sets.join(', ')} WHERE id = ? AND enterprise_id = ? AND is_deleted = 0`, params);
    res.json({ success: true });
  } catch (e) {
    logger.error(`[kb] updateArticle: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// DELETE /api/kb/articles/:id
exports.deleteArticle = async (req, res) => {
  try {
    const eid = req.activeEnterpriseId;
    await db.query('UPDATE duijie_kb_articles SET is_deleted = 1 WHERE id = ? AND enterprise_id = ?', [req.params.id, eid]);
    res.json({ success: true });
  } catch (e) {
    logger.error(`[kb] deleteArticle: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
