#!/bin/sh
set -e

echo "🚀 Starting LogVault container..."

# Regenerate Prisma Client to match the current schema
echo "⚙️ Regenerating Prisma client..."
npx prisma generate

# Run prisma db push to ensure schema is up to date
# Note: Docker Compose healthcheck ensures PostgreSQL is ready before this runs
echo "📦 Initializing database..."
npx prisma db push

# Start the application
echo "🟢 Starting application..."
exec "$@"
