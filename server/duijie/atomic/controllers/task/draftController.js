const db = require('../../../config/db');

exports.list = async (req, res) => {
  try {
    const pid = req.query.project_id;
    if (!pid) return res.status(400).json({ success: false, message: 'project_id required' });
    const [rows] = await db.query(
      'SELECT id, title, description, files, created_at FROM duijie_task_drafts WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 20',
      [pid, req.userId]
    );
    rows.forEach(r => {
      if (typeof r.files === 'string') try { r.files = JSON.parse(r.files) } catch { r.files = [] }
      if (!Array.isArray(r.files)) r.files = [];
    });
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('[draft.list]', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.save = async (req, res) => {
  try {
    const { project_id, title = '', description = '', draft_id, existing_files } = req.body;
    if (!project_id) return res.status(400).json({ success: false, message: 'project_id required' });

    const newFilesMeta = (req.files || []).map(f => ({
      filename: f.filename,
      original_name: Buffer.from(f.originalname, 'latin1').toString('utf8'),
      size: f.size,
      mime_type: f.mimetype,
    }));

    let kept = [];
    if (existing_files) {
      try { kept = JSON.parse(existing_files); } catch { kept = []; }
      if (!Array.isArray(kept)) kept = [];
    }
    const allFiles = [...kept, ...newFilesMeta];

    if (draft_id) {
      const [[existing]] = await db.query('SELECT id FROM duijie_task_drafts WHERE id = ? AND user_id = ?', [draft_id, req.userId]);
      if (existing) {
        await db.query('UPDATE duijie_task_drafts SET title = ?, description = ?, files = ? WHERE id = ?',
          [title, description, JSON.stringify(allFiles), draft_id]);
        return res.json({ success: true, data: { id: Number(draft_id) } });
      }
    }

    const [result] = await db.query(
      'INSERT INTO duijie_task_drafts (project_id, user_id, title, description, files) VALUES (?,?,?,?,?)',
      [project_id, req.userId, title, description, JSON.stringify(allFiles)]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    console.error('[draft.save]', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT files FROM duijie_task_drafts WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    if (rows.length) {
      let files = rows[0].files;
      if (typeof files === 'string') try { files = JSON.parse(files) } catch { files = [] }
      if (Array.isArray(files)) {
        const fs = require('fs'); const path = require('path');
        for (const f of files) {
          const fp = path.join(__dirname, '../../../uploads', f.filename);
          fs.unlink(fp, () => {});
        }
      }
    }
    await db.query('DELETE FROM duijie_task_drafts WHERE id = ? AND user_id = ?', [id, req.userId]);
    res.json({ success: true });
  } catch (e) {
    console.error('[draft.remove]', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
