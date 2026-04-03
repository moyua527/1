const db = require('../../../config/db');
const { broadcast } = require('../../../socket/state');

module.exports = async (req, res) => {
  try {
    const projectId = req.params.id;
    const inviterId = req.userId;
    const { user_id, message } = req.body;

    if (!user_id) return res.status(400).json({ success: false, message: '请选择要邀请的用户' });

    // 检查项目存在
    const [[project]] = await db.query(
      'SELECT id, name, internal_client_id FROM duijie_projects WHERE id = ? AND is_deleted = 0', [projectId]
    );
    if (!project) return res.status(404).json({ success: false, message: '项目不存在' });

    // 检查邀请者是否是项目成员
    const [[inviterMember]] = await db.query(
      'SELECT user_id FROM duijie_project_members WHERE project_id = ? AND user_id = ?', [projectId, inviterId]
    );
    if (!inviterMember) return res.status(403).json({ success: false, message: '你不是该项目成员' });

    // 检查被邀请者是否已是项目成员
    const [[existingMember]] = await db.query(
      'SELECT user_id FROM duijie_project_members WHERE project_id = ? AND user_id = ?', [projectId, user_id]
    );
    if (existingMember) return res.status(400).json({ success: false, message: '该用户已是项目成员' });

    // 检查是否已有待审批的申请
    const [[pendingReq]] = await db.query(
      "SELECT id FROM duijie_project_join_requests WHERE project_id = ? AND user_id = ? AND status = 'pending'", [projectId, user_id]
    );
    if (pendingReq) return res.status(400).json({ success: false, message: '该用户已有待审批的申请' });

    // 创建邀请申请
    const [result] = await db.query(
      "INSERT INTO duijie_project_join_requests (project_id, user_id, invited_by, invite_type, message, status) VALUES (?, ?, ?, 'member', ?, 'pending')",
      [projectId, user_id, inviterId, message || '']
    );

    // 通知项目 owner
    const [owners] = await db.query(
      "SELECT user_id FROM duijie_project_members WHERE project_id = ? AND role = 'owner'", [projectId]
    );
    const [[inviterInfo]] = await db.query('SELECT nickname FROM voice_users WHERE id = ?', [inviterId]);
    const [[inviteeInfo]] = await db.query('SELECT nickname FROM voice_users WHERE id = ?', [user_id]);
    const inviterName = inviterInfo?.nickname || '成员';
    const inviteeName = inviteeInfo?.nickname || '用户';

    for (const owner of owners) {
      await db.query(
        "INSERT INTO duijie_notifications (user_id, type, title, content, related_id, related_type) VALUES (?, 'project_join', ?, ?, ?, 'project')",
        [owner.user_id, `${inviterName} 邀请 ${inviteeName} 加入项目`, `项目: ${project.name}`, projectId]
      );
    }

    broadcast('project', 'join_request', { project_id: projectId, userId: user_id, invitedBy: inviterId });

    res.json({ success: true, message: '邀请已发送，等待项目管理审批', data: { id: result.insertId } });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: '该用户已有待审批的申请' });
    console.error('invite member error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
