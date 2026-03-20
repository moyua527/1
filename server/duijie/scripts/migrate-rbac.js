const db = require('../config/db');

async function migrate() {
  try {
    // Step 1: Expand enum to include all values (keep 'user' temporarily)
    await db.query("ALTER TABLE voice_users MODIFY COLUMN role ENUM('admin','user','member','client') DEFAULT 'member'");
    console.log('[1/5] Expanded role enum');

    // Step 2: Update existing 'user' role to 'member'
    await db.query("UPDATE voice_users SET role='member' WHERE role='user'");
    console.log('[2/5] Updated user -> member');

    // Step 3: Narrow enum to final values
    await db.query("ALTER TABLE voice_users MODIFY COLUMN role ENUM('admin','member','client') DEFAULT 'member'");
    console.log('[3/5] Role enum finalized to admin/member/client');

    // Step 4: Add client_id column if not exists
    const [cols] = await db.query("SHOW COLUMNS FROM voice_users LIKE 'client_id'");
    if (cols.length === 0) {
      await db.query("ALTER TABLE voice_users ADD COLUMN client_id INT DEFAULT NULL COMMENT '关联客户ID(仅client角色)' AFTER role");
      console.log('[4/5] Added client_id column');
    } else {
      console.log('[4/5] client_id column already exists');
    }

    // Step 5: Create project_members table
    await db.query(`
      CREATE TABLE IF NOT EXISTS duijie_project_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL COMMENT '项目ID',
        user_id INT NOT NULL COMMENT '用户ID',
        role ENUM('owner','editor','viewer') DEFAULT 'editor' COMMENT '项目内角色',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_project_user (project_id, user_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目成员关联表'
    `);
    console.log('[5/5] Created duijie_project_members table');

    console.log('\nRBAC migration completed successfully!');
  } catch (e) {
    console.error('Migration failed:', e.message);
  } finally {
    process.exit();
  }
}

migrate();
