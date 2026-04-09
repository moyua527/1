const Redis = require('ioredis')
const logger = require('./logger')

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 10) return null
    return Math.min(times * 200, 2000)
  },
  lazyConnect: true,
})

redis.on('error', (err) => {
  logger.error('[Redis] Connection error:', err.message)
})

redis.on('connect', () => {
  logger.info('[Redis] Connected')
})

redis.connect().catch(() => {})

// ---------- 验证码 helpers ----------

async function storeVerificationCode(type, target, code, ttlSec = 300) {
  const key = `vc:${type}:${target}`
  const cooldownKey = `vc_cd:${type}:${target}`
  await redis.set(key, code, 'EX', ttlSec)
  await redis.set(cooldownKey, '1', 'EX', 60)
}

async function checkCooldown(type, target) {
  const ttl = await redis.ttl(`vc_cd:${type}:${target}`)
  return ttl > 0 ? ttl : 0
}

async function verifyCode(type, target, code) {
  const key = `vc:${type}:${target}`
  const stored = await redis.get(key)
  if (!stored || stored !== code) return false
  await redis.del(key)
  return true
}

// ---------- 通用缓存 helpers ----------

async function cacheGet(key) {
  const val = await redis.get(key)
  if (val === null) return null
  try { return JSON.parse(val) } catch { return val }
}

async function cacheSet(key, value, ttlSec = 60) {
  const str = typeof value === 'string' ? value : JSON.stringify(value)
  if (ttlSec > 0) await redis.set(key, str, 'EX', ttlSec)
  else await redis.set(key, str)
}

async function cacheDel(key) {
  await redis.del(key)
}

module.exports = redis
module.exports.storeVerificationCode = storeVerificationCode
module.exports.checkCooldown = checkCooldown
module.exports.verifyCode = verifyCode
module.exports.cacheGet = cacheGet
module.exports.cacheSet = cacheSet
module.exports.cacheDel = cacheDel
