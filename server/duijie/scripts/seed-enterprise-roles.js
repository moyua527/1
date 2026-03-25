require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  console.log('数据库连接成功\n');

  // 运行建表 migration
  console.log('--- 执行 migration ---');
  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS enterprise_roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      enterprise_id INT NOT NULL,
      name VARCHAR(50) NOT NULL,
      can_manage_members TINYINT(1) DEFAULT 0,
      can_manage_roles TINYINT(1) DEFAULT 0,
      can_create_project TINYINT(1) DEFAULT 0,
      can_edit_project TINYINT(1) DEFAULT 0,
      can_delete_project TINYINT(1) DEFAULT 0,
      can_manage_client TINYINT(1) DEFAULT 0,
      can_view_report TINYINT(1) DEFAULT 0,
      can_manage_task TINYINT(1) DEFAULT 0,
      color VARCHAR(20) DEFAULT '#64748b',
      sort_order INT DEFAULT 0,
      is_default TINYINT(1) DEFAULT 0,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_deleted TINYINT(1) DEFAULT 0,
      INDEX idx_enterprise (enterprise_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    console.log('enterprise_roles 表已创建/已存在');
  } catch (e) { console.log('建表:', e.message); }

  try {
    await conn.query('ALTER TABLE duijie_client_members ADD COLUMN enterprise_role_id INT DEFAULT NULL');
    console.log('enterprise_role_id 列已添加');
  } catch (e) {
    if (e.message.includes('Duplicate')) console.log('enterprise_role_id 列已存在');
    else console.log('加列:', e.message);
  }

  // 查找所有企业
  const [enterprises] = await conn.query(
    "SELECT id, name, user_id FROM duijie_clients WHERE client_type = 'company' AND is_deleted = 0"
  );
  console.log(`\n找到 ${enterprises.length} 个企业\n`);

  for (const ent of enterprises) {
    // 检查是否已有角色
    const [existing] = await conn.query('SELECT id FROM enterprise_roles WHERE enterprise_id = ? AND is_deleted = 0', [ent.id]);
    if (existing.length > 0) {
      console.log(`${ent.name} (id:${ent.id}): 已有 ${existing.length} 个角色，跳过`);

      // 确保已有 admin 角色的成员自动分配管理员角色
      const [adminRole] = await conn.query(
        "SELECT id FROM enterprise_roles WHERE enterprise_id = ? AND name = '管理员' AND is_deleted = 0 LIMIT 1", [ent.id]
      );
      const [memberRole] = await conn.query(
        "SELECT id FROM enterprise_roles WHERE enterprise_id = ? AND name = '普通成员' AND is_deleted = 0 LIMIT 1", [ent.id]
      );
      if (adminRole[0]) {
        await conn.query(
          "UPDATE duijie_client_members SET enterprise_role_id = ? WHERE client_id = ? AND role = 'admin' AND enterprise_role_id IS NULL AND is_deleted = 0",
          [adminRole[0].id, ent.id]
        );
      }
      if (memberRole[0]) {
        await conn.query(
          "UPDATE duijie_client_members SET enterprise_role_id = ? WHERE client_id = ? AND role = 'member' AND enterprise_role_id IS NULL AND is_deleted = 0",
          [memberRole[0].id, ent.id]
        );
      }
      continue;
    }

    // 创建默认角色
    const [r1] = await conn.query(
      "INSERT INTO enterprise_roles (enterprise_id, name, color, can_manage_members, can_manage_roles, can_create_project, can_edit_project, can_delete_project, can_manage_client, can_view_report, can_manage_task, is_default, sort_order, created_by) VALUES (?, '管理员', '#2563eb', 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, ?)",
      [ent.id, ent.user_id]
    );
    const [r2] = await conn.query(
      "INSERT INTO enterprise_roles (enterprise_id, name, color, can_manage_members, can_manage_roles, can_create_project, can_edit_project, can_delete_project, can_manage_client, can_view_report, can_manage_task, is_default, sort_order, created_by) VALUES (?, '普通成员', '#64748b', 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, ?)",
      [ent.id, ent.user_id]
    );
    console.log(`${ent.name} (id:${ent.id}): 创建了管理员(id:${r1.insertId})和普通成员(id:${r2.insertId})角色`);

    // 自动分配
    const [updated1] = await conn.query(
      "UPDATE duijie_client_members SET enterprise_role_id = ? WHERE client_id = ? AND role = 'admin' AND is_deleted = 0",
      [r1.insertId, ent.id]
    );
    const [updated2] = await conn.query(
      "UPDATE duijie_client_members SET enterprise_role_id = ? WHERE client_id = ? AND (role = 'member' OR role IS NULL) AND is_deleted = 0",
      [r2.insertId, ent.id]
    );
    console.log(`   -> 分配: ${updated1.affectedRows} 个管理员, ${updated2.affectedRows} 个普通成员`);
  }

  console.log('\n========================================');
  console.log('迁移完成！');
  console.log('========================================');
  await conn.end();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
