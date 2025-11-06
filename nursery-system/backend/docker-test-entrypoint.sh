#!/bin/bash
# ============================================
# Backend Test Entrypoint
# ============================================
# Prepares test environment before running tests

set -e

echo "🧪 Backend Test Container Starting..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL (test database)..."
until pg_isready -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" > /dev/null 2>&1; do
  echo "   PostgreSQL not ready, waiting..."
  sleep 1
done
echo "✅ PostgreSQL is ready!"

# Create test database if it doesn't exist
echo "🗄️  Ensuring test database exists..."
PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d postgres -tc \
  "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
  PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d postgres \
  -c "CREATE DATABASE ${DB_NAME} ENCODING 'UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';"

# Run database migrations for test database
echo "🔄 Running migrations on test database..."
python -c "from app.database import init_db; init_db()"

# Seed test data (idempotent)
echo "🌱 Seeding test data..."
python -c "from app.seed import seed_database; seed_database()"

echo "✅ Test environment ready!"
echo ""
echo "📋 Test Database Info:"
echo "   Host: ${DB_HOST}"
echo "   Database: ${DB_NAME}"
echo "   User: ${DB_USER}"
echo ""

# Execute the command passed to the container
exec "$@"
