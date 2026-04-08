const logger = require('../../../config/logger');

const clients = new Map();

function addClient(userId, res) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
  logger.debug(`SSE: user ${userId} connected (${clients.get(userId).size} connections)`);
}

function removeClient(userId, res) {
  const set = clients.get(userId);
  if (set) {
    set.delete(res);
    if (set.size === 0) clients.delete(userId);
  }
}

function sendToUser(userId, event, data) {
  const set = clients.get(Number(userId));
  if (!set || set.size === 0) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    try { res.write(payload); } catch { set.delete(res); }
  }
}

function broadcastSSE(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [, set] of clients) {
    for (const res of set) {
      try { res.write(payload); } catch { set.delete(res); }
    }
  }
}

const handler = (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).end();

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  const heartbeat = setInterval(() => {
    try { res.write(':ping\n\n'); } catch { clearInterval(heartbeat); }
  }, 25000);

  addClient(userId, res);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(userId, res);
  });
};

module.exports = handler;
module.exports.sendToUser = sendToUser;
module.exports.broadcastSSE = broadcastSSE;
