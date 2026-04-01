#!/bin/bash
# DuiJie 数据库自动备份脚本（Linux 服务器用）
# 
# 安装方法：
#   chmod +x /opt/duijie/server/duijie/scripts/backup-cron.sh
#   crontab -e
#   # 添加以下行（每天凌晨 3 点备份）：
#   0 3 * * * /opt/duijie/server/duijie/scripts/backup-cron.sh >> /opt/duijie/server/duijie/logs/backup.log 2>&1

set -euo pipefail

# --- 配置 ---
BACKUP_DIR="/opt/duijie/server/duijie/backups"
DB_NAME="${DB_NAME:-duijie_db}"
DB_USER="${DB_USER:-duijie}"
DB_HOST="${DB_HOST:-localhost}"
KEEP_DAYS=30        # 保留最近 30 天的备份
TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")
FILENAME="${DB_NAME}_${TIMESTAMP}.sql.gz"

# --- 从 .env 读取配置 ---
ENV_FILE="/opt/duijie/server/duijie/.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | grep -v '^\s*$' | xargs)
fi

# --- 确保备份目录存在 ---
mkdir -p "$BACKUP_DIR"

# --- 执行备份（压缩） ---
echo "[$(date)] 开始备份: $FILENAME"

mysqldump -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" \
    --databases "${DB_NAME}" \
    --routines --triggers --single-transaction --quick \
    | gzip > "${BACKUP_DIR}/${FILENAME}"

SIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "[$(date)] 备份完成: $FILENAME ($SIZE)"

# --- 清理过期备份 ---
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +${KEEP_DAYS} -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[$(date)] 已清理 $DELETED 个过期备份（超过 ${KEEP_DAYS} 天）"
fi

echo "[$(date)] 当前备份文件数: $(ls -1 ${BACKUP_DIR}/*.sql.gz 2>/dev/null | wc -l)"
