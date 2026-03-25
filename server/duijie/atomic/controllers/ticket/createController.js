const createTicket = require('../../services/ticket/createTicket');

module.exports = async (req, res) => {
  try {
    const { title, content, type, priority, project_id } = req.body;
    if (!title) return res.status(400).json({ success: false, message: '标题必填' });
    const ticketId = await createTicket(
      { title, content, type, priority, project_id, created_by: req.userId },
      req.files
    );
    res.json({ success: true, data: { id: ticketId } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
