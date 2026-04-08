const { createClient } = require('redis');
const logger = require('./logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let client = null;
let connected = false;

async function getClient() {
  if (client && connected) return client;
  try {
    client = createClient({ url: REDIS_URL });
    client.on('error', (err) => {
      if (connected) logger.warn('Redis error:', err.message);
      connected = false;
    });
    client.on('connect', () => {
      connected = true;
    });
    await client.connect();
    connected = true;
    logger.info('Redis connected');
    return client;
  } catch (err) {
    logger.warn('Redis unavailable, falling back to no-cache:', err.message);
    connected = false;
    return null;
  }
}

async function cacheGet(key) {
  try {
    const c = await getClient();
    if (!c) return null;
    const val = await c.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

async function cacheSet(key, value, ttlSeconds = 60) {
  try {
    const c = await getClient();
    if (!c) return;
    await c.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch { /* ignore */ }
}

async function cacheDel(pattern) {
  try {
    const c = await getClient();
    if (!c) return;
    if (pattern.includes('*')) {
      const keys = await c.keys(pattern);
      if (keys.length > 0) await c.del(keys);
    } else {
      await c.del(pattern);
    }
  } catch { /* ignore */ }
}

async function cacheInvalidate(prefix) {
  return cacheDel(prefix + '*');
}

module.exports = { getClient, cacheGet, cacheSet, cacheDel, cacheInvalidate };
