const updateContract = require('../../services/contract/updateContract');
const db = require('../../../config/db');

/** 合同状态机：允许的转移 */
const ALLOWED_STATUS_TRANSITIONS = {
  draft:      ['active', 'terminated'],
  active:     ['expired', 'terminated'],
  expired:    [],           // 终态
  terminated: [],           // 终态
};

const VALID_STATUSES = Object.keys(ALLOWED_STATUS_TRANSITIONS);

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    // 状态变更校验
    if (fields.status) {
      if (!VALID_STATUSES.includes(fields.status)) {
        return res.status(400).json({ success: false, message: `无效的合同状态: ${fields.status}`, code: 40001 });
      }
      const [rows] = await db.query('SELECT status FROM duijie_contracts WHERE id = ?', [id]);
      if (!rows[0]) return res.status(404).json({ success: false, message: '合同不存在' });
      const current = rows[0].status;
      const allowed = ALLOWED_STATUS_TRANSITIONS[current] || [];
      if (current !== fields.status && !allowed.includes(fields.status)) {
        return res.status(422).json({ success: false, message: `不允许从「${current}」转移到「${fields.status}」`, code: 42201 });
      }
    }

    await updateContract(id, fields);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
