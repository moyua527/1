const updateUser = require('../../services/user/updateUser');
const cache = require('../../utils/memoryCache');

const VALID_ROLES = ['admin', 'member'];

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname, role, client_id, manager_id, password, is_active } = req.body;
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: '角色无效' });
    }

    const result = await updateUser(id, { nickname, role, client_id, manager_id, password, is_active });
    if (result.empty) return res.status(400).json({ success: false, message: '无更新内容' });

    cache.del(`user:${id}`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
