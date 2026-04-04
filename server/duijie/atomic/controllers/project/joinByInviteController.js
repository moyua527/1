const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');
const { resolveProjectRoleId } = require('../../utils/projectRoles');

module.exports = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: '缺少邀请令牌' });

    const [tokenRows] = await db.query(
      'SELECT * FROM duijie_project_invite_tokens WHERE token = ? AND used_by IS NULL',
      [token]
    );
    if (tokenRows.length === 0) return res.status(404).json({ success: false, message: '邀请链接无效或已使用' });

    const invite = tokenRows[0];

    const [existing] = await db.query(
      'SELECT id FROM duijie_project_members WHERE project_id = ? AND user_id = ?',
      [invite.project_id, req.userId]
    );
    if (existing.length > 0) {
      await db.query(
        'UPDATE duijie_project_invite_tokens SET used_by = ?, used_at = NOW() WHERE id = ? AND used_by IS NULL',
        [req.userId, invite.id]
      );
      return res.json({ success: true, message: '你已经是该项目的成员', data: { project_id: invite.project_id } });
    }

    await db.query(
      'UPDATE duijie_project_invite_tokens SET used_by = ?, used_at = NOW() WHERE id = ? AND used_by IS NULL',
      [req.userId, invite.id]
    );

    const editorRoleId = await resolveProjectRoleId(invite.project_id, 'editor');
    await db.query(
      "INSERT IGNORE INTO duijie_project_members (project_id, user_id, role, source, project_role_id) VALUES (?, ?, 'editor', 'invite', ?)",
      [invite.project_id, req.userId, editorRoleId]
    );

    const [proj] = await db.query('SELECT name FROM duijie_projects WHERE id = ?', [invite.project_id]);
    const projectName = proj[0]?.name || '未知项目';

    const [user] = await db.query('SELECT nickname, username FROM voice_users WHERE id = ?', [req.userId]);
    const userName = user[0]?.nickname || user[0]?.username || '用户';

    const [owners] = await db.query(
      "SELECT user_id FROM duijie_project_members WHERE project_id = ? AND role = 'owner'",
      [invite.project_id]
    );
    const { notifyMany } = require('../../utils/notify');
    await notifyMany(
      owners.map(o => o.user_id),
      'join_via_code',
      '新成员通过邀请链接加入',
      `${userName} 通过邀请链接加入了项目「${projectName}」`
    );

    broadcast('project', 'member_joined', { project_id: invite.project_id, userId: req.userId });
    res.json({ success: true, message: '已成功加入项目', data: { project_id: invite.project_id } });
  } catch (e) {
    console.error('joinByInvite error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
