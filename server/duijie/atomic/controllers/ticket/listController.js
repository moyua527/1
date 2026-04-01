const listTickets = require('../../services/ticket/listTickets');

module.exports = async (req, res) => {
  try {
    const rows = await listTickets(req.userId, req.userRole);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
