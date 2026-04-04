const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code || !code.trim()) return res.status(400).json({ success: false, message: '请输入项目ID' });

    const input = code.trim();
    const isNumericId = /^\d+$/.test(input);

    // 先按 join_code 或数字 ID 搜索
    const [rows] = await db.query(
      `SELECT p.id, p.name, p.description, p.status, p.join_code, p.progress,
              u.nickname AS creator_name,
              (SELECT COUNT(*) FROM duijie_project_members WHERE project_id = p.id) AS member_count
       FROM duijie_projects p
       LEFT JOIN voice_users u ON u.id = p.created_by
       WHERE (p.join_code = ? OR (? = 1 AND p.id = ?)) AND p.is_deleted = 0`,
      [input.toUpperCase(), isNumericId ? 1 : 0, isNumericId ? parseInt(input) : 0]
    );

    let isInviteToken = false;

    // 如果 join_code 未找到，尝试匹配一次性邀请令牌
    if (rows.length === 0) {
      const [tokenRows] = await db.query(
        `SELECT pit.project_id, pit.token,
                p.id, p.name, p.description, p.status, p.join_code, p.progress,
                u.nickname AS creator_name,
                (SELECT COUNT(*) FROM duijie_project_members WHERE project_id = p.id) AS member_count
         FROM duijie_project_invite_tokens pit
         INNER JOIN duijie_projects p ON p.id = pit.project_id AND p.is_deleted = 0
         LEFT JOIN voice_users u ON u.id = p.created_by
         WHERE pit.token = ? AND pit.used_by IS NULL`,
        [input]
      );
      if (tokenRows.length === 0) return res.status(404).json({ success: false, message: '未找到该项目' });
      rows.push(tokenRows[0]);
      isInviteToken = true;
    }

    const [memberCheck] = await db.query(
      'SELECT id FROM duijie_project_members WHERE project_id = ? AND user_id = ?',
      [rows[0].id, req.userId]
    );

    const [pendingCheck] = await db.query(
      "SELECT id FROM duijie_project_join_requests WHERE project_id = ? AND user_id = ? AND status = 'pending'",
      [rows[0].id, req.userId]
    );

    res.json({
      success: true,
      data: {
        ...rows[0],
        is_member: memberCheck.length > 0,
        has_pending_request: pendingCheck.length > 0,
        is_invite_token: isInviteToken,
        invite_token: isInviteToken ? input : undefined,
      }
    });
  } catch (e) {
    console.error('searchByCode error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
