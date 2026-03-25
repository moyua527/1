const db = require('../../config/db');

module.exports = (permField) => {
  return async (req, res, next) => {
    if (req._platformRolePassed) return next();

    try {
      const [userRow] = await db.query('SELECT active_enterprise_id FROM voice_users WHERE id = ?', [req.userId]);
      const entId = userRow[0]?.active_enterprise_id;
      if (!entId) return res.status(403).json({ success: false, message: '角色权限不足' });

      const [entRow] = await db.query('SELECT user_id FROM duijie_clients WHERE id = ? AND is_deleted = 0', [entId]);
      if (!entRow[0]) return res.status(403).json({ success: false, message: '角色权限不足' });

      if (entRow[0].user_id === req.userId) return next();

      const [memberRow] = await db.query(
        `SELECT er.${permField} as has_perm FROM duijie_client_members m
         JOIN enterprise_roles er ON er.id = m.enterprise_role_id AND er.is_deleted = 0
         WHERE m.client_id = ? AND m.user_id = ? AND m.is_deleted = 0`,
        [entId, req.userId]
      );
      if (memberRow[0]?.has_perm === 1) return next();

      return res.status(403).json({ success: false, message: '角色权限不足' });
    } catch (e) {
      return res.status(403).json({ success: false, message: '角色权限不足' });
    }
  };
};
