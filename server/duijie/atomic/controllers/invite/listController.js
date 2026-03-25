const listInvites = require('../../services/invite/listInvites');

module.exports = async (req, res) => {
  try {
    const rows = await listInvites();
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
