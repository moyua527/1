const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT config_value FROM system_config WHERE config_key = 'INVITE_CODE'");
    const needInviteCode = rows.length > 0 && !!rows[0].config_value;
    res.json({ success: true, data: { needInviteCode } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
