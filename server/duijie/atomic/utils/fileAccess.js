const db = require('../../config/db');

/**
 * 检查用户是否有权访问指定文件
 * 规则：admin 可访问所有 | 文件上传者 | 文件所属项目的成员
 */
async function canAccessFile(userId, userRole, file) {
  if (userRole === 'admin') return true;
  if (file.uploaded_by === userId) return true;
  if (!file.project_id) return false;
  const [rows] = await db.query(
    `SELECT 1 FROM duijie_project_members WHERE project_id = ? AND user_id = ?
     UNION SELECT 1 FROM duijie_projects WHERE id = ? AND created_by = ?`,
    [file.project_id, userId, file.project_id, userId]
  );
  return rows.length > 0;
}

module.exports = { canAccessFile };
