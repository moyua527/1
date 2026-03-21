const db = require('../../../config/db');

exports.get = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT config_key, config_value FROM system_config WHERE config_key = 'INVITE_CODE'");
    const inviteCode = rows.length > 0 ? rows[0].config_value || '' : '';
    res.json({ success: true, data: { inviteCode } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const code = (inviteCode || '').trim();
    const [existing] = await db.query("SELECT id FROM system_config WHERE config_key = 'INVITE_CODE'");
    if (existing.length > 0) {
      await db.query("UPDATE system_config SET config_value = ? WHERE config_key = 'INVITE_CODE'", [code || null]);
    } else {
      await db.query("INSERT INTO system_config (config_key, config_value) VALUES ('INVITE_CODE', ?)", [code || null]);
    }
    res.json({ success: true, data: { inviteCode: code } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
