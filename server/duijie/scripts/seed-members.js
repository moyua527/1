require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function randomInviteCode() {
  let code = '';
  for (let i = 0; i < 8; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)];
  return code;
}

function makeDisplayId(index) {
  const now = new Date();
  const date = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const prefix = '86000000' + date;
  const seq = String(901 + index * 2).padStart(3, '0');
  const id19 = prefix + seq;
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1, 6];
  const checks = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  let sum = 0;
  for (let i = 0; i < 19; i++) sum += parseInt(id19[i], 10) * weights[i % weights.length];
  return id19 + checks[sum % 11];
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  console.log('数据库连接成功\n');

  // 查找所有企业
  const [enterprises] = await conn.query(
    "SELECT id, name FROM duijie_clients WHERE client_type = 'company' AND is_deleted = 0 ORDER BY id"
  );
  if (enterprises.length === 0) {
    console.log('未找到任何企业，请先创建企业');
    await conn.end();
    return;
  }
  console.log(`找到 ${enterprises.length} 个企业:`);
  enterprises.forEach((e, i) => console.log(`  ${i + 1}. ${e.name} (id: ${e.id})`));
  console.log('');

  const members = [
    { name: '张伟', position: '技术总监',   phone: '15911111114', gender: 1 },
    { name: '李娜', position: '产品经理',   phone: '15911111115', gender: 2 },
    { name: '王强', position: '高级工程师', phone: '15911111116', gender: 1 },
    { name: '刘洋', position: '设计师',     phone: '15911111117', gender: 1 },
    { name: '陈静', position: '运营专员',   phone: '15911111118', gender: 2 },
    { name: '赵磊', position: '销售专员',   phone: '15911111119', gender: 1 },
    { name: '孙丽', position: '市场专员',   phone: '15911111120', gender: 2 },
    { name: '周杰', position: '财务专员',   phone: '15911111121', gender: 1 },
    { name: '吴敏', position: '人事专员',   phone: '15911111122', gender: 2 },
    { name: '郑浩', position: '客服专员',   phone: '15911111123', gender: 1 },
  ];

  const hashedPwd = await bcrypt.hash('123456', 10);

  console.log('--- 创建用户账号 & 导入企业 ---\n');

  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const ent = enterprises[i % enterprises.length]; // 轮流分配到不同企业
    const username = m.phone;
    const displayId = makeDisplayId(i);
    const inviteCode = randomInviteCode();

    // 检查手机号是否已存在
    const [exists] = await conn.query('SELECT id FROM voice_users WHERE phone = ? AND is_deleted = 0', [m.phone]);
    let userId;

    if (exists.length > 0) {
      userId = exists[0].id;
      console.log(`${i + 1}. ${m.name} (${m.phone}) 账号已存在 (id: ${userId})，跳过创建`);
    } else {
      const [userResult] = await conn.query(
        `INSERT INTO voice_users (username, password, nickname, phone, role, gender, display_id, personal_invite_code, user_type, position, active_enterprise_id)
         VALUES (?, ?, ?, ?, 'member', ?, ?, ?, 'company', ?, ?)`,
        [username, hashedPwd, m.name, m.phone, m.gender, displayId, inviteCode, m.position, ent.id]
      );
      userId = userResult.insertId;
      console.log(`${i + 1}. 用户 ${m.name} 创建成功 (id: ${userId}, 用户名: ${username}, 密码: 123456)`);
    }

    // 检查是否已在该企业中
    const [memberExists] = await conn.query(
      'SELECT id FROM duijie_client_members WHERE client_id = ? AND user_id = ? AND is_deleted = 0', [ent.id, userId]
    );
    if (memberExists.length > 0) {
      console.log(`   -> 已在企业 "${ent.name}" 中，跳过\n`);
      continue;
    }

    // 添加为企业成员
    await conn.query(
      `INSERT INTO duijie_client_members (client_id, user_id, name, position, phone, role, employee_id, created_by)
       VALUES (?, ?, ?, ?, ?, 'member', ?, 1)`,
      [ent.id, userId, m.name, m.position, m.phone, 'E' + String(i + 1).padStart(3, '0')]
    );
    console.log(`   -> 已导入企业 "${ent.name}" (id: ${ent.id})\n`);
  }

  console.log('========================================');
  console.log('全部完成！共 10 个用户，默认密码均为: 123456');
  console.log('用户可用手机号作为用户名登录系统');
  console.log('========================================');

  await conn.end();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
