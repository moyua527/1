const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const [rows] = await db.query(
      `(
        SELECT 'task_created' AS type, t.id AS entity_id, t.title AS title, t.created_at AS happened_at,
               u.nickname AS actor_name, u.username AS actor_username, u.avatar AS actor_avatar, t.created_by AS actor_id
        FROM duijie_tasks t
        LEFT JOIN voice_users u ON u.id = t.created_by
        WHERE t.project_id = ? AND t.is_deleted = 0
      )
      UNION ALL
      (
        SELECT 'milestone_created' AS type, ms.id AS entity_id, ms.title AS title, ms.created_at AS happened_at,
               u.nickname AS actor_name, u.username AS actor_username, u.avatar AS actor_avatar, ms.created_by AS actor_id
        FROM duijie_milestones ms
        LEFT JOIN voice_users u ON u.id = ms.created_by
        WHERE ms.project_id = ? AND ms.is_deleted = 0
      )
      UNION ALL
      (
        SELECT 'member_joined' AS type, pm.user_id AS entity_id,
               COALESCE(u.nickname, u.username) AS title, pm.created_at AS happened_at,
               u.nickname AS actor_name, u.username AS actor_username, u.avatar AS actor_avatar, pm.user_id AS actor_id
        FROM duijie_project_members pm
        LEFT JOIN voice_users u ON u.id = pm.user_id
        WHERE pm.project_id = ?
      )
      UNION ALL
      (
        SELECT 'milestone_completed' AS type, ms.id AS entity_id, ms.title AS title, ms.updated_at AS happened_at,
               NULL AS actor_name, NULL AS actor_username, NULL AS actor_avatar, NULL AS actor_id
        FROM duijie_milestones ms
        WHERE ms.project_id = ? AND ms.is_completed = 1 AND ms.is_deleted = 0
      )
      ORDER BY happened_at DESC
      LIMIT ?`,
      [id, id, id, id, limit]
    );

    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('project activity error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
