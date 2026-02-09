# LogVault Deployment Guide for Proxmox (Docker)

Diese Anleitung zeigt dir, wie du LogVault mit **Docker** auf deinem Proxmox-Server installierst. Das ist die einfachste und sauberste Methode.

Wir empfehlen, dafür eine kleine **Linux VM** (z.B. Ubuntu Server) oder einen **LXC Container** (Ubuntu/Debian Template) in Proxmox zu nutzen.

## Voraussetzungen auf dem Server

1.  Linux VM oder LXC Container läuft.
2.  Zugriff auf das Terminal (Konsole).

## Schritt 1: Docker installieren

Führe diese Befehle im Terminal deines Proxmox-Containers/VMs aus:

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Git und Curl installieren
sudo apt install -y git curl

# Docker installieren (Automatisches Skript)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker starten (bei manchen Systemen nötig)
sudo systemctl enable docker
sudo systemctl start docker
```

## Schritt 2: LogVault installieren

```bash
# 1. Repository herunterladen
git clone https://github.com/IDGUX/LogVault.git

# 2. In den Ordner wechseln
cd LogVault

# 3. Starten! (Der Profi-Weg)
chmod +x start-prod.sh
./start-prod.sh
```

Das Skript baut den Container, startet ihn im Hintergrund und zeigt dir am Ende direkt die IP-Adresse deiner Web-Oberfläche an.

## Schritt 3: Zugriff

Öffne deinen Browser und gib die IP-Adresse ein, die dir das Skript am Ende anzeigt (z.B. `http://192.168.1.100:3000`).

---

## Hilfreiche Befehle

*   **Logs ansehen:** `sudo docker compose logs -f`
*   **Neustarten:** `sudo docker compose restart`
*   **Update einspielen:**
    ```bash
    git pull
    sudo docker compose up -d --build
    ```
