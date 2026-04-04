const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code || !code.trim()) return res.status(400).json({ success: false, message: '请输入项目ID' });

    const input = code.trim();
    const isNumericId = /^\d+$/.test(input);

    const [rows] = await db.query(
      `SELECT p.id, p.name, p.description, p.status, p.join_code, p.progress,
              u.nickname AS creator_name,
              (SELECT COUNT(*) FROM duijie_project_members WHERE project_id = p.id) AS member_count
       FROM duijie_projects p
       LEFT JOIN voice_users u ON u.id = p.created_by
       WHERE (p.join_code = ? OR (? = 1 AND p.id = ?)) AND p.is_deleted = 0`,
      [input.toUpperCase(), isNumericId ? 1 : 0, isNumericId ? parseInt(input) : 0]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: '未找到该项目' });

    // 检查是否已是成员
    const [memberCheck] = await db.query(
      'SELECT id FROM duijie_project_members WHERE project_id = ? AND user_id = ?',
      [rows[0].id, req.userId]
    );

    // 检查是否有待审批的申请
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
      }
    });
  } catch (e) {
    console.error('searchByCode error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
