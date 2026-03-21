const db = require('../../config/db');

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉容易混淆的 I/O/0/1

function randomCode(len = 8) {
  let code = '';
  for (let i = 0; i < len; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

module.exports = async function generateInviteCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode(8);
    const [existing] = await db.query(
      'SELECT id FROM voice_users WHERE personal_invite_code = ?', [code]
    );
    if (existing.length === 0) return code;
  }
  throw new Error('无法生成唯一邀请码');
};
