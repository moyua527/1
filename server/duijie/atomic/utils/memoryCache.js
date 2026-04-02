/**
 * 轻量级内存缓存（Map + TTL）
 * 适用于热点数据如企业配置、权限等，减少数据库查询
 */
class MemoryCache {
  constructor(defaultTTL = 60000) {
    this.store = new Map();
    this.defaultTTL = defaultTTL;
    // 每分钟清理过期项
    this._timer = setInterval(() => this._cleanup(), 60000);
    if (this._timer.unref) this._timer.unref();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttl) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttl || this.defaultTTL),
    });
  }

  del(key) {
    this.store.delete(key);
  }

  /** 按前缀批量删除（用于缓存失效） */
  invalidate(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  clear() {
    this.store.clear();
  }

  get size() {
    return this.store.size;
  }

  _cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}

// 全局单例：默认60秒TTL
module.exports = new MemoryCache(60000);
