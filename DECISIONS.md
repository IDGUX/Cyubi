# Architecture Decision Records (ADR)

This document captures key design decisions for LogVault, including context, reasoning, and trade-offs. Each decision has a status: **Accepted**, **Superseded**, or **Deprecated**.

---

## ADR-001: SQLite as Reference Storage Implementation

**Status:** Superseded by ADR-005
**Date:** 2026-02-11

### Context
LogVault needs a storage layer. Enterprise tools use Elasticsearch, PostgreSQL, or custom distributed stores. Our target audience is SMBs and IT service providers running single-node deployments.

### Decision
Use SQLite via Prisma ORM as the default and reference storage implementation.

### Reasoning
- **Zero-config deployment** — no external database server needed
- **Single-file backup** — `cp prod.db backup.db` is a complete backup strategy
- **Performance** — SQLite handles hundreds of thousands of events easily on a single node
- **Prisma abstraction** — switching to PostgreSQL or MySQL requires only changing the datasource in `schema.prisma`

### Trade-offs
- No built-in replication or clustering
- Write concurrency limited (WAL mode mitigates this for our workload)
- Not suitable for multi-node deployments without a storage backend swap

---

## ADR-002: Hash Chain over Blockchain for Tamper Evidence

**Status:** Accepted
**Date:** 2026-02-11

### Context
LogVault needs to prove that events have not been modified, deleted, or reordered after capture. Options: Blockchain, Merkle Trees, simple hash chain, external timestamping authority.

### Decision
Use a sequential SHA-256 hash chain where each event's hash includes the previous event's hash, the event payload, and the timestamp.

### Reasoning
- **No infrastructure overhead** — no nodes, no consensus, no gas fees
- **Mathematically sound** — any modification breaks the chain, detectable in O(n)
- **Understandable** — a senior developer can audit the integrity logic in 10 minutes
- **Self-contained** — the proof travels with the data (export includes the chain)

### Trade-offs
- A compromised system *could* recompute the entire chain (mitigated by USB Sync / external backups)
- No distributed consensus — trust is in the deployment, not the protocol
- Optional improvement: external timestamping service or periodic signature checkpoints

---

## ADR-003: AI as Opt-In Plugin, Never Default

**Status:** Accepted
**Date:** 2026-02-11

### Context
AI-powered log interpretation is a valuable feature, but sending event data to external APIs creates GDPR (DSGVO) compliance risks. Community feedback will inevitably raise this concern.

### Decision
AI features are strictly opt-in. No event data is sent to any external service unless the user explicitly enables it.

### Reasoning
- **DSGVO-compliant by default** — zero external data flow out of the box
- **No ideological debates** — the user decides their own risk tolerance
- **Plugin architecture** — AI analysis can be a webhook, n8n flow, or direct API connection
- **Local LLM support** — Ollama integration allows fully offline AI analysis

### Configuration flags
```
external_ai: false (default)
redaction: enabled (default)
```

### Trade-offs
- New users don't see AI features until they configure a provider
- Requires clear onboarding UX to explain the value of enabling AI

---

## ADR-004: Target Audience — SMBs & IT Service Providers

**Status:** Accepted
**Date:** 2026-02-11

### Context
LogVault needs a clear target audience to guide feature priorities, complexity trade-offs, and communication.

### Decision
Primary target: IT service providers and SMBs (KMU) who need post-incident documentation and forensic traceability.

### Reasoning
- **Underserved market** — large tools are overkill, small tools lack integrity features
- **Clear use case** — "Something happened. Prove it. Explain it to the client."
- **Deployment simplicity** — single Docker container, no cluster management
- **Pricing-friendly** — open-source core with potential premium features for MSPs

### Non-targets
- Hyperscaler environments (use ELK/Splunk)
- Real-time monitoring/APM (use Grafana/Datadog)
- Big Data analytics (use Clickhouse/BigQuery)

### Impact
This decision shapes: UI complexity (simple > configurable), storage requirements (thousands, not billions), deployment model (single node > distributed), and documentation language (practical > academic).

---

## ADR-005: PostgreSQL as Default Storage Backend

**Status:** Accepted
**Date:** 2026-02-11

### Context
ADR-001 chose SQLite for zero-config simplicity. In practice, SQLite's single-writer limitation caused critical concurrency issues: the hash-chain backfill operation (sequential writes) combined with 5-second polling (reads) created database contention, causing the repair process to hang for 10+ minutes.

### Decision
Switch to PostgreSQL as the default storage backend, deployed as a Docker sidecar container.

### Reasoning
- **MVCC concurrency** — reads never block writes, solving the backfill + polling contention
- **Batch transactions** — native support for batched writes via `$transaction`
- **Production-grade** — proven at scale for log-heavy workloads
- **Prisma compatibility** — zero application code changes required (only `schema.prisma` provider swap)
- **Docker-friendly** — `postgres:16-alpine` adds ~80MB to deployment

### Trade-offs
- Requires a running PostgreSQL instance (Docker Compose handles this automatically)
- Backup is now `pg_dump` instead of `cp file.db` (documented in README)
- Slightly more complex local dev setup (need local PostgreSQL or Docker)
