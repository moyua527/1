const db = require('../../../config/db');
const logger = require('../../../config/logger');
const { getUserActiveEnterpriseId, getEnterpriseMemberUserIds, getUserScopedProjectIds } = require('../accessScope');

/**
 * MySQL FULLTEXT 全文搜索（利用 MySQL 8.0 内置全文索引）
 * 
 * 优势：无需额外依赖（Elasticsearch/MeiliSearch），直接利用现有 MySQL
 * 限制：中文需要 ngram parser（MySQL 8.0 内置支持）
 * 
 * 使用前需在数据库中创建全文索引（见 migration 018_fulltext_indexes.sql）
 */

const SEARCHABLE_ENTITIES = {
  projects: {
    table: 'duijie_projects',
    columns: ['name', 'description'],
    labelColumn: 'name',
    type: 'project',
    softDelete: 'is_deleted = 0',
  },
  clients: {
    table: 'duijie_clients',
    columns: ['name', 'company', 'email', 'phone'],
    labelColumn: 'name',
    type: 'client',
    softDelete: 'is_deleted = 0',
  },
  tasks: {
    table: 'duijie_tasks',
    columns: ['title', 'description'],
    labelColumn: 'title',
    type: 'task',
    softDelete: 'is_deleted = 0',
  },
  opportunities: {
    table: 'duijie_opportunities',
    columns: ['title'],
    labelColumn: 'title',
    type: 'opportunity',
    softDelete: 'is_deleted = 0',
  },
  tickets: {
    table: 'duijie_tickets',
    columns: ['title', 'content'],
    labelColumn: 'title',
    type: 'ticket',
    softDelete: null,
  },
};

/**
 * 跨实体全文搜索
 * 
 * @param {string} keyword 搜索关键词
 * @param {string[]} entities 要搜索的实体类型（默认全部）
 * @param {number} limit 每类最大结果数
 * @returns {Array<{type, id, label, matchScore}>}
 */
async function globalSearch(keyword, entities, limit = 10, userId = null, userRole = null) {
  if (!keyword || keyword.trim().length < 1) return [];

  const searchTerm = keyword.trim();
  const targets = entities
    ? Object.entries(SEARCHABLE_ENTITIES).filter(([k]) => entities.includes(k))
    : Object.entries(SEARCHABLE_ENTITIES);

  const results = [];

  for (const [, config] of targets) {
    try {
      let sql = `SELECT id, ${config.labelColumn} AS label FROM ${config.table}`;
      const where = [];
      const extraParams = [];
      if (config.softDelete) where.push(config.softDelete);

      const likeConditions = config.columns
        .map(col => `${col} LIKE ?`)
        .join(' OR ');
      where.push(`(${likeConditions})`);

      if (config.type === 'ticket' && userId && userRole !== 'admin') {
        const activeEnterpriseId = await getUserActiveEnterpriseId(userId);
        if (activeEnterpriseId) {
          const memberUserIds = await getEnterpriseMemberUserIds(activeEnterpriseId);
          const scopedProjectIds = await getUserScopedProjectIds(userId);
          const ticketConds = [];
          if (memberUserIds.length > 0) {
            ticketConds.push(`created_by IN (${memberUserIds.map(() => '?').join(',')})`);
            extraParams.push(...memberUserIds);
          }
          if (scopedProjectIds.length > 0) {
            ticketConds.push(`project_id IN (${scopedProjectIds.map(() => '?').join(',')})`);
            extraParams.push(...scopedProjectIds);
          }
          where.push(ticketConds.length > 0 ? `(${ticketConds.join(' OR ')})` : '1=0');
        } else {
          where.push('created_by = ?');
          extraParams.push(userId);
        }
      }

      sql += ` WHERE ${where.join(' AND ')} LIMIT ?`;
      const params = [
        ...config.columns.map(() => `%${searchTerm}%`),
        ...extraParams,
        limit,
      ];

      const [rows] = await db.query(sql, params);
      rows.forEach(row => {
        results.push({ type: config.type, id: row.id, label: row.label });
      });
    } catch (err) {
      logger.error(`Search error in ${config.table}: ${err.message}`);
    }
  }

  return results;
}

module.exports = { globalSearch, SEARCHABLE_ENTITIES };
