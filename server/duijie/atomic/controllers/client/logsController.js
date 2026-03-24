const getClientLogs = require('../../services/client/getClientLogs');

module.exports = async (req, res) => {
  try {
    const logs = await getClientLogs(req.params.id);
    res.json({ success: true, data: logs });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
