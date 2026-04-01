#!/bin/bash
# DuiJie 服务健康检查脚本
#
# 安装方法：
#   chmod +x /opt/duijie/server/duijie/scripts/health-check.sh
#   crontab -e
#   # 添加以下行（每 5 分钟检查一次）：
#   */5 * * * * /opt/duijie/server/duijie/scripts/health-check.sh >> /opt/duijie/server/duijie/logs/health-check.log 2>&1

set -euo pipefail

HEALTH_URL="http://127.0.0.1:1800/api/health"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"
MAX_RETRIES=3
RETRY_DELAY=5

check_health() {
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_URL" 2>/dev/null || echo "000")
    echo "$response"
}

restart_service() {
    echo "$LOG_PREFIX [ALERT] 服务不可用，正在重启..."
    cd /opt/duijie/server/duijie
    pm2 restart duijie 2>/dev/null || pm2 start ecosystem.config.js 2>/dev/null
    sleep 5
    local status
    status=$(check_health)
    if [ "$status" = "200" ]; then
        echo "$LOG_PREFIX [OK] 服务重启成功"
    else
        echo "$LOG_PREFIX [CRITICAL] 服务重启后仍不可用 (HTTP $status)"
        # 可在此添加告警通知（邮件/钉钉/飞书 webhook）
    fi
}

# 主检查逻辑
for i in $(seq 1 $MAX_RETRIES); do
    STATUS=$(check_health)
    if [ "$STATUS" = "200" ]; then
        # 仅在非首次重试成功时输出日志
        if [ "$i" -gt 1 ]; then
            echo "$LOG_PREFIX [OK] 第${i}次重试后服务恢复正常"
        fi
        exit 0
    fi
    echo "$LOG_PREFIX [WARN] 健康检查失败 (HTTP $STATUS)，第${i}/${MAX_RETRIES}次重试..."
    sleep $RETRY_DELAY
done

# 所有重试都失败，尝试重启
restart_service
