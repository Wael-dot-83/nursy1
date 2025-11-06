#!/bin/bash
# wait-for-db.sh - Wait for PostgreSQL to be ready

set -e

host="${DB_HOST:-db}"
port="${DB_PORT:-5432}"
user="${DB_USER:-nursery_user}"
db="${DB_NAME:-nursery_db}"
timeout="${TIMEOUT:-60}"

echo "Waiting for PostgreSQL at $host:$port..."

elapsed=0
until pg_isready -h "$host" -p "$port" -U "$user" -d "$db" > /dev/null 2>&1; do
    if [ $elapsed -ge $timeout ]; then
        echo "Error: PostgreSQL did not become ready within ${timeout}s"
        exit 1
    fi
    
    echo "PostgreSQL is unavailable - sleeping (${elapsed}s/${timeout}s)"
    sleep 1
    elapsed=$((elapsed + 1))
done

echo "PostgreSQL is ready!"
exec "$@"
