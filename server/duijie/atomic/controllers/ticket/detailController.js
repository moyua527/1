const getTicketDetail = require('../../services/ticket/getTicketDetail');

module.exports = async (req, res) => {
  try {
    const data = await getTicketDetail(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: '工单不存在' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
