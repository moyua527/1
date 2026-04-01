const { globalSearch } = require('../../services/search/globalSearch');

module.exports = async (req, res) => {
  try {
    const { q, entities, limit } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json({ success: true, data: [] });
    }
    const entityList = entities ? entities.split(',') : undefined;
    const maxLimit = Math.min(parseInt(limit) || 10, 50);
    const results = await globalSearch(q, entityList, maxLimit);
    res.json({ success: true, data: results });
  } catch (e) {
    res.status(500).json({ success: false, message: '搜索失败' });
  }
};
