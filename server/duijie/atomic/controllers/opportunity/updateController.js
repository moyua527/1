const updateOpportunity = require('../../services/opportunity/updateOpportunity');
const { broadcast } = require('../../utils/broadcast');
const db = require('../../../config/db');

const STAGE_ALIASES = {
  qualified: 'qualify',
  negotiation: 'negotiate',
};

/** 商机阶段状态机：允许的转移 */
const ALLOWED_STAGE_TRANSITIONS = {
  lead:      ['qualify', 'lost'],
  qualify:   ['lead', 'proposal', 'lost'],
  proposal:  ['qualify', 'negotiate', 'lost'],
  negotiate: ['proposal', 'won', 'lost'],
  won:       [],            // 终态
  lost:      ['lead'],      // 可重新激活到线索
};

const VALID_STAGES = Object.keys(ALLOWED_STAGE_TRANSITIONS);

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = { ...req.body };
    if (fields.stage && STAGE_ALIASES[fields.stage]) {
      fields.stage = STAGE_ALIASES[fields.stage];
    }
    const keys = Object.keys(fields).filter(k => fields[k] !== undefined);
    if (!keys.length) return res.json({ success: true });

    // 阶段变更校验
    if (fields.stage) {
      if (!VALID_STAGES.includes(fields.stage)) {
        return res.status(400).json({ success: false, message: `无效的商机阶段: ${fields.stage}`, code: 40001 });
      }
      const [rows] = await db.query('SELECT stage FROM duijie_opportunities WHERE id = ? AND is_deleted = 0', [id]);
      if (!rows[0]) return res.status(404).json({ success: false, message: '商机不存在' });
      const current = rows[0].stage;
      const allowed = ALLOWED_STAGE_TRANSITIONS[current] || [];
      if (current !== fields.stage && !allowed.includes(fields.stage)) {
        return res.status(422).json({ success: false, message: `不允许从「${current}」转移到「${fields.stage}」`, code: 42201 });
      }
    }

    await updateOpportunity(id, fields);
    broadcast('opportunity', 'updated', { id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
