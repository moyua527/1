-- 速率限制持久化存储表（替代内存存储，PM2重启不丢失）
CREATE TABLE IF NOT EXISTS rate_limit_store (
  `key` VARCHAR(255) NOT NULL PRIMARY KEY,
  total_hits INT NOT NULL DEFAULT 0,
  reset_time BIGINT NOT NULL,
  INDEX idx_reset_time (reset_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
