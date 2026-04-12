module.exports = {
  apps: [{
    name: 'duijie',
    script: 'standalone.js',
    cwd: '/opt/duijie/server/duijie',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/root/.pm2/logs/duijie-error.log',
    out_file: '/root/.pm2/logs/duijie-out.log',
    merge_logs: true,
    time: false,
    kill_timeout: 5000,
    listen_timeout: 10000,
    exp_backoff_restart_delay: 100,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
