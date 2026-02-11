<div align="center">

# 🛡️ LogVault

### Forensic-Grade Event Vault for IT Teams

[![Status](https://img.shields.io/badge/Status-Production--Ready-blueviolet?style=for-the-badge)](https://github.com/IDGUX/LogVault)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

![LogVault Hero](public/assets/hero.png)

**LogVault** is a tamper-proof event vault for IT service providers and SMBs.
It captures, chains, and preserves security-relevant events with cryptographic integrity —
so you can prove what happened, when, and why.

[Features](#-core-features) • [What LogVault is NOT](#-what-logvault-is-not) • [Quick Start](#-quick-start) • [Deployment](#-deployment) • [Contributing](CONTRIBUTING.md)

</div>

---

## 🚫 What LogVault is NOT

LogVault is **not** a general-purpose log management system.

- ❌ **Not a log aggregator** — LogVault doesn't ingest terabytes of raw logs. It stores only **selected, relevant events**.
- ❌ **Not a monitoring tool** — LogVault doesn't do real-time dashboards or alerting pipelines. It focuses on **forensic proof**.
- ❌ **Not a log pipeline** — LogVault doesn't stream or transform logs. It's an **event vault** with cryptographic integrity.
- ❌ **Not an enterprise SIEM** — LogVault targets **small and mid-sized teams**, not hyperscaler environments.

**LogVault does one thing well:** It takes security-relevant events, chains them cryptographically, and makes them available as tamper-proof incident documentation.

---

## 🎯 Who is LogVault For?

**Primary audience:**
- 🏢 **IT Service Providers** — Document incidents for clients with proof
- 🏭 **SMBs (KMU)** — Affordable, self-hosted incident tracking without enterprise overhead
- 🔍 **Post-Incident Teams** — Reconstruct what happened after a breach or outage

**Not for:**
- ❌ Hyperscalers needing petabyte-scale log search
- ❌ Real-time monitoring / APM dashboards
- ❌ Big Data analytics pipelines

---

## ✨ Core Features

### 🔗 Tamper-Proof Hash Chain
Every event is cryptographically linked to its predecessor using SHA-256. If anyone modifies, deletes, or reorders an event, the chain breaks — and LogVault detects it. No blockchain overhead, just math.

### 📋 Incident Report Generator
Select events, generate a human-readable incident report with timeline, root cause summary, and relevance assessment. Export as Markdown. Show your client or management exactly what happened.

### 🛰️ Flight Recorder (USB Sync)
Mirror every incoming event to an external USB drive in real-time. Even if the server is compromised, your logs survive on physical media.

### 🧠 AI Intelligence (Opt-In)
Connect OpenAI, Anthropic, Gemini, Mistral, or a local LLM (Ollama). AI interprets events in real-time — but **only if you enable it**. No data leaves your system by default.

### 🎨 Premium Glass UI
A fully responsive, glassmorphic interface built for operators who care about clarity and design.

### 🛰️ Native Syslog Ingestion
Ingest from servers, gateways, IoT devices, or web apps. LogVault acts as a central event hub.

### 🔔 Smart Webhook Alarms
Fire alerts based on severity levels to Slack, Discord, or any webhook endpoint.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/IDGUX/LogVault.git
cd LogVault
npm install
```

### 2. Start PostgreSQL
```bash
docker compose up -d postgres
```

### 3. Initialize Database
```bash
npx prisma db push
```

### 4. Start
```bash
npm run dev
```

---

## 🐳 Deployment

Deploy anywhere in seconds. Optimized for Docker and Proxmox.

```yaml
# docker-compose.yml (included in repo)
services:
  app:
    build: .
    ports:
      - "3000:3000"
      - "514:5140/udp"
    environment:
      - DATABASE_URL=postgresql://logvault:logvault@postgres:5432/logvault
      - JWT_SECRET=your_ultra_secure_secret
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U logvault"]
```

---

## 💾 Backup & Persistence

LogVault uses PostgreSQL for reliable, concurrent data storage. Your data is protected through Docker volumes.

```bash
# Manual backup
docker exec logvault-db pg_dump -U logvault logvault > backup_logvault_$(date +%F).sql

# Restore
cat backup.sql | docker exec -i logvault-db psql -U logvault logvault
```

> **Note:** PostgreSQL was chosen over SQLite for its superior concurrency handling — see [DECISIONS.md](DECISIONS.md) for details.

---

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL 16 + Prisma ORM
- **Integrity:** SHA-256 Hash Chain
- **Intelligence:** OpenAI, Anthropic, Gemini, Mistral, Ollama (opt-in)
- **Styling:** Tailwind CSS + Glassmorphism
- **Real-time:** UDP Syslog Receiver

---

## 🌐 Powered by Datadus

Created with ❤️ by [Datadus](https://datadus.at). We build IT-Automation and AI-Agents that actually work.

---

<div align="center">
  <sub>Built with LogVault. Star if you love it! ⭐</sub>
</div>
