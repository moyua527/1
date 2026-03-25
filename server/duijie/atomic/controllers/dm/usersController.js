const listUsers = require('../../services/dm/listUsers');

module.exports = async (req, res) => {
  try {
    const rows = await listUsers(req.userId);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
