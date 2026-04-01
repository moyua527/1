module.exports = {
  apps: [{
    name: 'duijie',
    script: 'standalone.js',
    cwd: '/opt/duijie/server/duijie',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 1800,
    },
    // 日志配置
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/opt/duijie/server/duijie/logs/pm2-error.log',
    out_file: '/opt/duijie/server/duijie/logs/pm2-out.log',
    merge_logs: true,
    // 重启策略
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 5000,
    // 优雅关闭
    kill_timeout: 5000,
    listen_timeout: 8000,
  }],
};
