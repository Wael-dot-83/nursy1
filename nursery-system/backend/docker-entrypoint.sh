#!/bin/bash
set -e

echo "=== Nursery Management System Backend Startup ==="
echo "Environment: ${APP_ENV:-development}"
echo "Database: ${DATABASE_URL}"
echo ""

# Wait for database to be ready
echo "⏳ Waiting for database..."
echo "Waiting 10 seconds for database to initialize..."
sleep 10
echo "✅ Database should be ready"

# Run migrations
echo ""
echo "📦 Running database migrations..."
python -c "
import sys
sys.path.insert(0, '/app')
from app.database import init_db
print('Initializing database tables...')
init_db()
print('✅ Database tables initialized')
"

# Run seeds (idempotent)
echo ""
echo "🌱 Running database seeds..."
python -c "
import sys
sys.path.insert(0, '/app')
from app.seed import seed_database
print('Seeding database...')
seed_database()
print('✅ Database seeded successfully')
"

echo ""
echo "🚀 Starting application server..."
echo "==================================="
echo ""

# Execute the main command
exec "$@"
