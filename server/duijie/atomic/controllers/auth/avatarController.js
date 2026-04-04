const db = require('../../../config/db');
const path = require('path');
const fs = require('fs');
const cache = require('../../utils/memoryCache');

const UPLOAD_DIR = path.join(__dirname, '../../../uploads/avatars');

module.exports = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: '请上传头像文件' });

    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const filename = `${req.userId}_${Date.now()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filepath, req.file.buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    await db.query('UPDATE voice_users SET avatar = ? WHERE id = ?', [avatarUrl, req.userId]);
    cache.del(`user:${req.userId}`);

    const [rows] = await db.query(
      'SELECT id, username, nickname, email, phone, avatar, role, client_id, created_at FROM voice_users WHERE id = ?',
      [req.userId]
    );

    res.json({ success: true, data: rows[0] });
  } catch (e) {
    console.error('avatar upload error:', e);
    res.status(500).json({ success: false, message: '头像上传失败' });
  }
};
