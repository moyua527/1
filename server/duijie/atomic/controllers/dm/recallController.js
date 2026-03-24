const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const msgId = req.params.id;
    const [[msg]] = await db.query('SELECT id, sender_id, created_at FROM duijie_direct_messages WHERE id = ?', [msgId]);
    if (!msg) return res.status(404).json({ success: false, message: '消息不存在' });
    if (msg.sender_id !== req.userId) return res.status(403).json({ success: false, message: '只能撤回自己的消息' });
    const diffMs = Date.now() - new Date(msg.created_at).getTime();
    if (diffMs > 2 * 60 * 1000) return res.status(400).json({ success: false, message: '只能撤回2分钟内的消息' });
    await db.query('UPDATE duijie_direct_messages SET content = ?, is_recalled = 1 WHERE id = ?', ['[消息已撤回]', msgId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
