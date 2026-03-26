const createUser = require('../../services/user/createUser');

const VALID_ROLES = ['admin', 'member'];

module.exports = async (req, res) => {
  try {
    const { username, password, nickname, role, client_id, manager_id } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: '用户名和密码必填' });
    if (!VALID_ROLES.includes(role)) return res.status(400).json({ success: false, message: '角色无效' });

    const result = await createUser({ username, password, nickname, role, client_id, manager_id });
    if (result.duplicate) return res.status(400).json({ success: false, message: '用户名已存在' });

    res.json({ success: true, data: { id: result.id } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
