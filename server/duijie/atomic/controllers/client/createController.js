const createClient = require('../../services/client/createClient');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    const id = await createClient({ ...req.body, created_by: req.userId });
    broadcast('client', 'created', { id, userId: req.userId });
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
