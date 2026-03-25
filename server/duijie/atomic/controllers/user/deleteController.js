const deleteUser = require('../../services/user/deleteUser');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === req.userId) {
      return res.status(400).json({ success: false, message: '不能删除自己的账号' });
    }
    await deleteUser(id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
