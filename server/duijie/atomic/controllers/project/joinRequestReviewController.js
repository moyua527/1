const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');

// 审批项目加入申请 (approve / reject)
module.exports = async (req, res) => {
  try {
    const { requestId } = req.params;
    const action = req.path.includes('approve') ? 'approved' : 'rejected';

    const [rows] = await db.query(
      "SELECT jr.*, p.name AS project_name FROM duijie_project_join_requests jr LEFT JOIN duijie_projects p ON p.id = jr.project_id WHERE jr.id = ? AND jr.status = 'pending'",
      [requestId]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: '申请不存在或已处理' });

    const request = rows[0];

    await db.query(
      'UPDATE duijie_project_join_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      [action, req.userId, requestId]
    );

    if (action === 'approved') {
      // 添加为项目成员(editor, internal)
      await db.query(
        "INSERT IGNORE INTO duijie_project_members (project_id, user_id, role, source) VALUES (?, ?, 'editor', 'internal')",
        [request.project_id, request.user_id]
      );
    }

    // 通知申请人
    const resultText = action === 'approved' ? '已通过' : '已被拒绝';
    await db.query(
      "INSERT INTO duijie_notifications (user_id, type, title, content) VALUES (?, 'project_join', ?, ?)",
      [request.user_id, '项目加入申请' + resultText, `你的加入项目「${request.project_name}」的申请${resultText}`]
    );

    broadcast('project', 'join_' + action, { project_id: request.project_id, userId: request.user_id });
    res.json({ success: true, message: action === 'approved' ? '已批准加入' : '已拒绝申请' });
  } catch (e) {
    console.error('joinRequestReview error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
