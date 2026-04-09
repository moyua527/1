const redis = require('../../config/redis')

class RedisRateLimitStore {
  constructor(windowMs) {
    this.windowMs = windowMs
    this.prefix = 'rl:'
  }

  async increment(key) {
    const redisKey = this.prefix + key
    const windowSec = Math.ceil(this.windowMs / 1000)

    try {
      const multi = redis.multi()
      multi.incr(redisKey)
      multi.pttl(redisKey)
      const results = await multi.exec()

      const totalHits = results[0][1]
      const ttl = results[1][1]

      if (ttl === -1) {
        await redis.pexpire(redisKey, this.windowMs)
      }

      const resetTime = new Date(Date.now() + (ttl > 0 ? ttl : this.windowMs))
      return { totalHits, resetTime }
    } catch {
      return { totalHits: 0, resetTime: new Date(Date.now() + this.windowMs) }
    }
  }

  async decrement(key) {
    try {
      await redis.decr(this.prefix + key)
    } catch {}
  }

  async resetKey(key) {
    try {
      await redis.del(this.prefix + key)
    } catch {}
  }

  async resetAll() {
    try {
      const keys = await redis.keys(this.prefix + '*')
      if (keys.length > 0) await redis.del(...keys)
    } catch {}
  }
}

module.exports = RedisRateLimitStore
