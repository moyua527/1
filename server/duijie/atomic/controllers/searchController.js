const db = require('../../config/db');
const logger = require('../../config/logger');

module.exports = async (req, res) => {
  try {
    const { q, type = 'all', limit = 20 } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json({ success: true, data: { projects: [], clients: [], tasks: [], files: [] } });
    }

    const keyword = `%${q.trim()}%`;
    const userId = req.userId;
    const role = req.userRole;
    const enterpriseId = req.activeEnterpriseId;
    const cap = Math.min(parseInt(limit) || 20, 50);
    const result = {};

    const shouldSearch = (t) => type === 'all' || type === t;

    if (shouldSearch('project')) {
      let sql, params;
      if (role === 'admin') {
        sql = `SELECT id, name, description, status, icon, icon_color, created_at
               FROM duijie_projects
               WHERE is_deleted = 0 AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)
               ORDER BY updated_at DESC LIMIT ?`;
        params = [keyword, keyword, keyword, cap];
      } else {
        sql = `SELECT DISTINCT p.id, p.name, p.description, p.status, p.icon, p.icon_color, p.created_at
               FROM duijie_projects p
               LEFT JOIN duijie_project_members pm ON pm.project_id = p.id AND pm.user_id = ?
               WHERE p.is_deleted = 0
                 AND (p.created_by = ? OR pm.user_id IS NOT NULL)
                 AND (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)
               ORDER BY p.updated_at DESC LIMIT ?`;
        params = [userId, userId, keyword, keyword, keyword, cap];
      }
      const [rows] = await db.query(sql, params);
      result.projects = rows;
    }

    if (shouldSearch('client')) {
      let sql, params;
      if (role === 'admin') {
        sql = `SELECT id, name, company, email, phone, stage, client_type, avatar, created_at
               FROM duijie_clients
               WHERE is_deleted = 0 AND (name LIKE ? OR company LIKE ? OR email LIKE ? OR phone LIKE ? OR notes LIKE ?)
               ORDER BY updated_at DESC LIMIT ?`;
        params = [keyword, keyword, keyword, keyword, keyword, cap];
      } else {
        sql = `SELECT DISTINCT c.id, c.name, c.company, c.email, c.phone, c.stage, c.client_type, c.avatar, c.created_at
               FROM duijie_clients c
               LEFT JOIN duijie_projects p ON p.client_id = c.id AND p.is_deleted = 0
               LEFT JOIN duijie_project_members pm ON pm.project_id = p.id AND pm.user_id = ?
               WHERE c.is_deleted = 0
                 AND (c.created_by = ? OR pm.user_id IS NOT NULL)
                 AND (c.name LIKE ? OR c.company LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)
               ORDER BY c.updated_at DESC LIMIT ?`;
        params = [userId, userId, keyword, keyword, keyword, keyword, cap];
      }
      const [rows] = await db.query(sql, params);
      result.clients = rows;
    }

    if (shouldSearch('task')) {
      let sql, params;
      if (role === 'admin') {
        sql = `SELECT t.id, t.title, t.description, t.status, t.priority, t.project_id, p.name AS project_name, t.created_at
               FROM duijie_tasks t
               LEFT JOIN duijie_projects p ON p.id = t.project_id
               WHERE t.is_deleted = 0 AND (t.title LIKE ? OR t.description LIKE ?)
               ORDER BY t.updated_at DESC LIMIT ?`;
        params = [keyword, keyword, cap];
      } else {
        sql = `SELECT DISTINCT t.id, t.title, t.description, t.status, t.priority, t.project_id, p.name AS project_name, t.created_at
               FROM duijie_tasks t
               JOIN duijie_projects p ON p.id = t.project_id AND p.is_deleted = 0
               JOIN duijie_project_members pm ON pm.project_id = p.id AND pm.user_id = ?
               WHERE t.is_deleted = 0 AND (t.title LIKE ? OR t.description LIKE ?)
               ORDER BY t.updated_at DESC LIMIT ?`;
        params = [userId, keyword, keyword, cap];
      }
      const [rows] = await db.query(sql, params);
      result.tasks = rows;
    }

    if (shouldSearch('file')) {
      let sql, params;
      if (role === 'admin') {
        sql = `SELECT f.id, f.name, f.original_name, f.description, f.mime_type, f.size, f.project_id, p.name AS project_name, f.created_at
               FROM duijie_files f
               LEFT JOIN duijie_projects p ON p.id = f.project_id
               WHERE f.is_deleted = 0 AND (f.name LIKE ? OR f.original_name LIKE ? OR f.description LIKE ?)
               ORDER BY f.created_at DESC LIMIT ?`;
        params = [keyword, keyword, keyword, cap];
      } else {
        sql = `SELECT DISTINCT f.id, f.name, f.original_name, f.description, f.mime_type, f.size, f.project_id, p.name AS project_name, f.created_at
               FROM duijie_files f
               JOIN duijie_projects p ON p.id = f.project_id AND p.is_deleted = 0
               JOIN duijie_project_members pm ON pm.project_id = p.id AND pm.user_id = ?
               WHERE f.is_deleted = 0 AND (f.name LIKE ? OR f.original_name LIKE ? OR f.description LIKE ?)
               ORDER BY f.created_at DESC LIMIT ?`;
        params = [userId, keyword, keyword, keyword, cap];
      }
      const [rows] = await db.query(sql, params);
      result.files = rows;
    }

    res.json({ success: true, data: result });
  } catch (e) {
    logger.error(`[search] ${e.message}`);
    res.status(500).json({ success: false, message: '搜索失败' });
  }
};
