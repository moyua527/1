const findById = require('../../repositories/auth/findByIdRepo');

module.exports = async (req, res) => {
  try {
    const user = await findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    res.json({ success: true, data: user });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
