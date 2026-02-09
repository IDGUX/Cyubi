#!/bin/sh
set -e

echo "🚀 Starting LogVault container..."

# Restore schema backup if it exists (fixes volume shadowing)
if [ -f "/app/schema.prisma.backup" ]; then
    echo "🔄 Restoring prisma schema from backup..."
    cp /app/schema.prisma.backup /app/prisma/schema.prisma
fi

# Regenerate Prisma Client to match the current schema
echo "⚙️ Regenerating Prisma client..."
npx prisma generate

# Run prisma db push to ensure schema is up to date
echo "📦 initializing database..."
npx prisma db push

# Start the application
echo "🟢 Starting application..."
exec "$@"
