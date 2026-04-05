const db = require('../../../config/db');
const logger = require('../../../config/logger');

module.exports = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.userId;
    const { nickname } = req.body;

    const trimmed = (nickname || '').trim() || null;

    const [result] = await db.query(
      'UPDATE duijie_project_members SET nickname = ? WHERE project_id = ? AND user_id = ?',
      [trimmed, projectId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '你不是该项目成员' });
    }

    res.json({ success: true, nickname: trimmed });
  } catch (e) {
    logger.error(`setNickname: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
