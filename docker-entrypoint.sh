#!/bin/sh
set -e

echo "🚀 Starting LogVault container..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
MAX_RETRIES=30
RETRY_COUNT=0
until npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ PostgreSQL not ready after ${MAX_RETRIES} retries. Exiting."
        exit 1
    fi
    echo "   Retry $RETRY_COUNT/$MAX_RETRIES..."
    sleep 2
done
echo "✅ PostgreSQL is ready."

# Regenerate Prisma Client to match the current schema
echo "⚙️ Regenerating Prisma client..."
npx prisma generate

# Run prisma db push to ensure schema is up to date
echo "📦 Initializing database..."
npx prisma db push

# Start the application
echo "🟢 Starting application..."
exec "$@"
