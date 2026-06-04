#!/usr/bin/env bash

# Zuklo Database Backup Script
# Uses pg_dump to backup PostgreSQL and keeps the last 7 backups.
#
# Required environment variables:
#   PGHOST     - Database host (default: localhost)
#   PGPORT     - Database port (default: 5432)
#   PGDATABASE - Database name
#   PGUSER     - Database user
#   PGPASSWORD - Database password
#
# Optional:
#   BACKUP_DIR - Backup directory (default: ./backups)

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/zuklo_${TIMESTAMP}.sql.gz"
MAX_BACKUPS=7

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:?PGDATABASE is required}"
PGUSER="${PGUSER:?PGUSER is required}"
PGPASSWORD="${PGPASSWORD:?PGPASSWORD is required}"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup of $PGDATABASE..."

pg_dump \
  -h "$PGHOST" \
  -p "$PGPORT" \
  -U "$PGUSER" \
  -d "$PGDATABASE" \
  --no-owner \
  --no-privileges \
  | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup completed: $BACKUP_FILE ($BACKUP_SIZE)"

# Rotate old backups — keep last MAX_BACKUPS
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/zuklo_*.sql.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
  REMOVED=$((BACKUP_COUNT - MAX_BACKUPS))
  ls -1t "$BACKUP_DIR"/zuklo_*.sql.gz | tail -n "$REMOVED" | xargs rm -f
  echo "[$(date)] Rotated $REMOVED old backup(s), keeping last $MAX_BACKUPS"
fi

echo ""
echo "=== Cron Setup ==="
echo "To run this backup daily at 3 AM, add the following to your crontab:"
echo ""
echo "  crontab -e"
echo ""
echo "  0 3 * * * PGHOST=$PGHOST PGPORT=$PGPORT PGDATABASE=$PGDATABASE PGUSER=$PGUSER PGPASSWORD=$PGPASSWORD BACKUP_DIR=$BACKUP_DIR $(readlink -f "$0") >> /var/log/zuklo-backup.log 2>&1"
echo ""
echo "For remote backups (e.g. Supabase), use their connection string:"
echo "  PGPASSWORD=<password> pg_dump -h db.<project>.supabase.co -p 5432 -U postgres -d postgres ..."
