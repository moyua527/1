const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const type = req.query.type || null;

    let tableExists = false;
    try {
      await db.query('SELECT 1 FROM duijie_project_activities LIMIT 0');
      tableExists = true;
    } catch {}

    if (tableExists) {
      const params = [id];
      let where = 'project_id = ?';
      if (type) { where += ' AND type = ?'; params.push(type); }
      params.push(limit);

      const [rows] = await db.query(
        `SELECT a.id, a.type, a.entity_type, a.entity_id, a.title, a.detail, a.created_at AS happened_at,
                u.nickname AS actor_name, u.username AS actor_username, u.avatar AS actor_avatar, a.user_id AS actor_id
         FROM duijie_project_activities a
         LEFT JOIN voice_users u ON u.id = a.user_id
         WHERE ${where}
         ORDER BY a.created_at DESC LIMIT ?`,
        params
      );

      for (const r of rows) {
        if (r.detail && typeof r.detail === 'string') try { r.detail = JSON.parse(r.detail); } catch {}
      }

      if (rows.length > 0) return res.json({ success: true, data: rows });
    }

    const [rows] = await db.query(
      `(
        SELECT 'task_created' AS type, 'task' AS entity_type, t.id AS entity_id, t.title AS title, NULL AS detail, t.created_at AS happened_at,
               u.nickname AS actor_name, u.username AS actor_username, u.avatar AS actor_avatar, t.created_by AS actor_id
        FROM duijie_tasks t LEFT JOIN voice_users u ON u.id = t.created_by
        WHERE t.project_id = ? AND t.is_deleted = 0
      )
      UNION ALL
      (
        SELECT 'member_joined' AS type, 'member' AS entity_type, pm.user_id AS entity_id,
               COALESCE(u.nickname, u.username) AS title, NULL AS detail, pm.created_at AS happened_at,
               u.nickname AS actor_name, u.username AS actor_username, u.avatar AS actor_avatar, pm.user_id AS actor_id
        FROM duijie_project_members pm LEFT JOIN voice_users u ON u.id = pm.user_id
        WHERE pm.project_id = ?
      )
      ORDER BY happened_at DESC LIMIT ?`,
      [id, id, limit]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('project activity error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
