const db = require('../../config/db');

// 校验位算法 (ISO 7064:1983 MOD 11-2, 同身份证)
function calcCheckDigit(id17) {
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkChars = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(id17[i], 10) * weights[i];
  }
  return checkChars[sum % 11];
}

// 格式: 86 + 地区码(6位) + 注册日期(8位) + 序号(3位,奇男偶女) + 校验位(1位) = 20位
module.exports = async function generateDisplayId(areaCode, gender) {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');

  const prefix = '86' + areaCode + dateStr; // 2+6+8 = 16 digits

  // 查当天已注册的最大序号
  const dayStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [rows] = await db.query(
    "SELECT display_id FROM voice_users WHERE display_id LIKE ? ORDER BY display_id DESC LIMIT 1",
    [prefix + '%']
  );

  let seq = 1;
  if (rows.length > 0) {
    const lastSeq = parseInt(rows[0].display_id.substring(16, 19), 10);
    seq = lastSeq + 2; // +2 保持奇偶性一致
  }

  // 性别编码: 1=男(奇数), 2=女(偶数)
  if (gender === 2 && seq % 2 !== 0) seq++;
  if (gender === 1 && seq % 2 === 0) seq++;

  const seqStr = String(seq).padStart(3, '0');
  const id17 = prefix + seqStr; // 19 digits (but we need 17 for check calc)

  // 对 19 位取后 17 位计算校验位 (跳过开头的 86)
  // 实际上我们对完整 19 位按权重计算
  const weights19 = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1, 6];
  const checkChars = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  let sum = 0;
  for (let i = 0; i < 19; i++) {
    sum += parseInt(id17[i], 10) * weights19[i % weights19.length];
  }
  const checkDigit = checkChars[sum % 11];

  return id17 + checkDigit; // 20 characters
};
