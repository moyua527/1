#!/bin/bash
BACKUP_DIR=/opt/duijie/backups/db
DATE=$(date +%Y%m%d)
mkdir -p "$BACKUP_DIR"
source /opt/duijie/server/duijie/.env
mysqldump -u "$DB_USER" -p"$DB_PASSWORD" --single-transaction --routines --triggers "$DB_NAME" | gzip > "$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"
if [ $? -eq 0 ]; then
    SIZE=$(du -sh "$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz" | cut -f1)
    echo "[$(date)] DB backup done: ${DB_NAME}_${DATE}.sql.gz ($SIZE)"
else
    echo "[$(date)] DB backup FAILED!"
    exit 1
fi
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +30 -delete
