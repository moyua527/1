const { getIO } = require('../../socket');
const logger = require('../../config/logger');

let sseBroadcast = null;
try { sseBroadcast = require('../controllers/notification/sseController').broadcastSSE; } catch { /* SSE not loaded yet */ }

function broadcast(entity, action, meta = {}) {
  const payload = { entity, action, ...meta, _t: Date.now() };

  const io = getIO();
  if (io) io.emit('data_changed', payload);

  if (sseBroadcast) sseBroadcast('data_changed', payload);

  logger.debug(`broadcast: ${entity}:${action}`);
}

module.exports = { broadcast };
