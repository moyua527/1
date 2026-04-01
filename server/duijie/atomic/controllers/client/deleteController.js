const db = require('../../../config/db');
const deleteClient = require('../../services/client/deleteClient');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    const clientId = req.params.id;

    // 验证客户存在
    const [[client]] = await db.query(
      'SELECT id, user_id FROM duijie_clients WHERE id = ? AND is_deleted = 0',
      [clientId]
    );
    if (!client) return res.status(404).json({ success: false, message: '客户不存在' });

    // 权限检查：平台管理员、客户创建者、或企业管理员(creator/admin角色)
    const isAdmin = req.userRole === 'admin';
    const isCreator = client.user_id === req.userId;
    let isMemberAdmin = false;
    if (!isAdmin && !isCreator) {
      const [[membership]] = await db.query(
        "SELECT role FROM duijie_client_members WHERE client_id = ? AND user_id = ? AND role IN ('creator','admin')",
        [clientId, req.userId]
      );
      isMemberAdmin = !!membership;
    }

    if (!isAdmin && !isCreator && !isMemberAdmin) {
      return res.status(403).json({ success: false, message: '没有权限删除此客户' });
    }

    await deleteClient(clientId);
    broadcast('client', 'deleted', { id: clientId, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
