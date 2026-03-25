const listUsers = require('../../services/user/listUsers');

module.exports = async (req, res) => {
  try {
    const rows = await listUsers();
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
