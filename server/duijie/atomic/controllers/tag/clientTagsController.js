const { getClientTags, setClientTags } = require('../../repositories/tag/clientTagsRepo');

exports.get = async (req, res) => {
  try {
    const data = await getClientTags(req.params.clientId);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.set = async (req, res) => {
  try {
    await setClientTags(req.params.clientId, req.body.tagIds || []);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
