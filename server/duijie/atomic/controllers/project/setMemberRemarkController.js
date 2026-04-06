const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { target_user_id, remark } = req.body;

    if (!target_user_id) return res.status(400).json({ success: false, message: '缺少目标用户ID' });
    if (target_user_id === req.userId) return res.status(400).json({ success: false, message: '不能给自己设备注' });

    const [[member]] = await db.query(
      'SELECT remarks FROM duijie_project_members WHERE project_id = ? AND user_id = ?',
      [projectId, req.userId]
    );
    if (!member) return res.status(404).json({ success: false, message: '你不是该项目成员' });

    let remarks = {};
    try { remarks = member.remarks ? (typeof member.remarks === 'string' ? JSON.parse(member.remarks) : member.remarks) : {}; } catch { remarks = {}; }

    const trimmed = (remark || '').trim();
    if (trimmed) {
      remarks[String(target_user_id)] = trimmed;
    } else {
      delete remarks[String(target_user_id)];
    }

    await db.query(
      'UPDATE duijie_project_members SET remarks = ? WHERE project_id = ? AND user_id = ?',
      [Object.keys(remarks).length > 0 ? JSON.stringify(remarks) : null, projectId, req.userId]
    );

    res.json({ success: true, remarks });
  } catch (e) {
    console.error('setMemberRemark error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
