const db = require('../../../config/db');
const { normalizeTaskTitlePresets } = require('../../utils/taskTitlePresets');

module.exports = async (req, res) => {
  try {
    const pid = req.params.id;
    const { presets } = req.body;
    const normalized = normalizeTaskTitlePresets(presets);
    await db.query(
      'UPDATE duijie_projects SET task_title_presets = ? WHERE id = ? AND is_deleted = 0',
      [JSON.stringify(normalized), pid]
    );
    res.json({ success: true, data: { presets: normalized } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
