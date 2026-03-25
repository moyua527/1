const getHistory = require('../../services/dm/getHistory');

module.exports = async (req, res) => {
  try {
    const rows = await getHistory(req.userId, req.params.userId);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
