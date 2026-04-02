const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');

// 申请加入项目
module.exports = async (req, res) => {
  try {
    const { project_id, message } = req.body;
    if (!project_id) return res.status(400).json({ success: false, message: '缺少项目ID' });

    // 检查项目是否存在
    const [proj] = await db.query('SELECT id, name FROM duijie_projects WHERE id = ? AND is_deleted = 0', [project_id]);
    if (proj.length === 0) return res.status(404).json({ success: false, message: '项目不存在' });

    // 检查是否已是成员
    const [existing] = await db.query(
      'SELECT id FROM duijie_project_members WHERE project_id = ? AND user_id = ?',
      [project_id, req.userId]
    );
    if (existing.length > 0) return res.status(400).json({ success: false, message: '你已经是该项目的成员' });

    // 检查是否有待审批的申请
    const [pending] = await db.query(
      "SELECT id FROM duijie_project_join_requests WHERE project_id = ? AND user_id = ? AND status = 'pending'",
      [project_id, req.userId]
    );
    if (pending.length > 0) return res.status(400).json({ success: false, message: '你已提交过申请，请等待审批' });

    await db.query(
      'INSERT INTO duijie_project_join_requests (project_id, user_id, message) VALUES (?, ?, ?)',
      [project_id, req.userId, (message || '').slice(0, 500)]
    );

    // 通知项目 owner
    const [owners] = await db.query(
      "SELECT user_id FROM duijie_project_members WHERE project_id = ? AND role = 'owner'",
      [project_id]
    );
    const [applicant] = await db.query('SELECT nickname, username FROM voice_users WHERE id = ?', [req.userId]);
    const applicantName = applicant[0]?.nickname || applicant[0]?.username || '用户';

    for (const owner of owners) {
      await db.query(
        "INSERT INTO duijie_notifications (user_id, type, title, content) VALUES (?, 'project_join', ?, ?)",
        [owner.user_id, '项目加入申请', `${applicantName} 申请加入项目「${proj[0].name}」`]
      );
    }

    broadcast('project', 'join_request', { project_id, userId: req.userId });
    res.json({ success: true, message: '申请已提交，等待项目管理员审批' });
  } catch (e) {
    console.error('joinRequest error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
