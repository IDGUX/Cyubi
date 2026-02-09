#!/bin/bash
echo "🚀 Starting LogVault in Production Mode..."
# Ensure settings are correct and schema is up to date
sudo docker compose run --rm app npx prisma db push --accept-data-loss
sudo docker compose run --rm app node scripts/fix-settings.js
sudo docker compose up --build -d

# Detect local IP address
IP_ADDR=$(hostname -I | awk '{print $1}')

# Fallback to localhost if IP detection fails
if [ -z "$IP_ADDR" ]; then
  IP_ADDR="localhost"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ LogVault is up and running!"
echo "🌐 Web UI:          http://$IP_ADDR:3000"
echo "📡 Syslog Receiver:  udp://$IP_ADDR:514"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Tipp: Nutze 'docker compose logs -f' um die Logs zu sehen."
echo ""
