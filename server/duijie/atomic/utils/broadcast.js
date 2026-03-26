const { getIO } = require('../../socket');
const logger = require('../../config/logger');

/**
 * 广播数据变更事件，通知所有已连接的客户端刷新对应模块数据
 * @param {string} entity - 实体类型: project | client | task | opportunity | ticket | file
 * @param {string} action - 操作类型: created | updated | deleted
 * @param {object} [meta] - 可选元数据 (id, userId 等)
 */
function broadcast(entity, action, meta = {}) {
  const io = getIO();
  if (!io) return;
  const payload = { entity, action, ...meta, _t: Date.now() };
  io.emit('data_changed', payload);
  logger.debug(`broadcast: ${entity}:${action}`);
}

module.exports = { broadcast };
