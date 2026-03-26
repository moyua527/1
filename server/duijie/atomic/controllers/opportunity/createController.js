const createOpportunity = require('../../services/opportunity/createOpportunity');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    const { title, client_id, amount, probability, stage, expected_close, assigned_to, notes } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ success: false, message: '请输入商机标题' });
    const id = await createOpportunity({
      title: title.trim(), client_id, amount, probability, stage, expected_close, assigned_to, notes, created_by: req.userId
    });
    broadcast('opportunity', 'created', { id, userId: req.userId });
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
