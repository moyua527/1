const createProject = require('../../services/project/createProject');

module.exports = async (req, res) => {
  try {
    if (!req.body.client_id) return res.status(400).json({ success: false, message: '请关联客户' });
    if (!req.body.name || !req.body.name.trim()) return res.status(400).json({ success: false, message: '请输入项目名称' });
    const id = await createProject({ ...req.body, created_by: req.userId });
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
