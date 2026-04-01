const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { clients } = req.body;
    if (!Array.isArray(clients) || clients.length === 0) {
      return res.status(400).json({ success: false, message: '导入数据不能为空' });
    }

    const fields = ['name', 'company', 'email', 'phone', 'channel', 'stage', 'position_level', 'department', 'job_function', 'notes'];
    const validStages = ['potential', 'intent', 'signed', 'active', 'lost'];
    const results = { success: 0, failed: 0, errors: [] };

    const batchRows = [];
    const batchValues = [];
    for (let i = 0; i < clients.length; i++) {
      const c = clients[i];
      if (!c.name || !c.name.trim()) {
        results.failed++;
        results.errors.push({ row: i + 1, message: '客户名称不能为空' });
        continue;
      }
      const stage = validStages.includes(c.stage) ? c.stage : 'potential';
      batchRows.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      batchValues.push(
        c.name?.trim() || '', c.company?.trim() || '', c.email?.trim() || '', c.phone?.trim() || '',
        c.channel?.trim() || '', stage,
        c.position_level?.trim() || null, c.department?.trim() || null, c.job_function?.trim() || null,
        c.notes?.trim() || '', req.userId
      );
    }
    if (batchRows.length > 0) {
      try {
        const [r] = await db.query(
          `INSERT INTO duijie_clients (name, company, email, phone, channel, stage, position_level, department, job_function, notes, created_by) VALUES ${batchRows.join(', ')}`,
          batchValues
        );
        results.success = r.affectedRows;
      } catch (err) {
        results.failed = batchRows.length;
        results.errors.push({ row: 0, message: err.message });
      }
    }

    res.json({ success: true, data: results });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
