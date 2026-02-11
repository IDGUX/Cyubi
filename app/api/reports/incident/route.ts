import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyChain } from "@/lib/integrity";

/**
 * POST /api/reports/incident
 * 
 * Generate a Markdown incident report from selected events.
 * 
 * Body options:
 *   { eventIds: string[] }     — specific event IDs
 *   { lastN: number }          — last N events
 *   { timeRange: { from: string, to: string } } — time-based selection
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { eventIds, lastN, timeRange } = body;

        // Fetch events based on selection criteria
        let events;

        if (eventIds && Array.isArray(eventIds) && eventIds.length > 0) {
            events = await prisma.log.findMany({
                where: { id: { in: eventIds } },
                orderBy: { timestamp: "asc" },
            });
        } else if (timeRange?.from && timeRange?.to) {
            events = await prisma.log.findMany({
                where: {
                    timestamp: {
                        gte: new Date(timeRange.from),
                        lte: new Date(timeRange.to),
                    },
                },
                orderBy: { timestamp: "asc" },
            });
        } else {
            const take = Math.min(lastN || 10, 100);
            events = await prisma.log.findMany({
                orderBy: { timestamp: "desc" },
                take: take,
            });
            events.reverse(); // chronological order
        }

        if (events.length === 0) {
            return NextResponse.json(
                { error: "No events found for the given criteria." },
                { status: 404 }
            );
        }

        // Verify hash chain integrity for these events
        const chainStatus = await verifyChain();

        // Generate the report
        const report = generateMarkdownReport(events, chainStatus);

        return NextResponse.json({
            report,
            format: "markdown",
            eventCount: events.length,
            chainValid: chainStatus.valid,
        });
    } catch (error: any) {
        console.error("Report generation error:", error.message);
        return NextResponse.json(
            { error: "Failed to generate report", detail: error.message },
            { status: 500 }
        );
    }
}

interface LogEvent {
    id: string;
    timestamp: Date;
    level: string;
    source: string;
    message: string;
    interpretation: string | null;
    category: string | null;
    deviceType: string | null;
    hostname: string | null;
    ipAddress: string | null;
    eventHash: string | null;
    previousHash: string | null;
}

interface ChainStatus {
    valid: boolean;
    totalEvents: number;
    verifiedEvents: number;
    details: string;
}

function generateMarkdownReport(events: LogEvent[], chainStatus: ChainStatus): string {
    const now = new Date();
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];

    // Count categories
    const categoryCounts: Record<string, number> = {};
    const levelCounts: Record<string, number> = {};
    const sources = new Set<string>();

    for (const event of events) {
        categoryCounts[event.category || "Unknown"] = (categoryCounts[event.category || "Unknown"] || 0) + 1;
        levelCounts[event.level] = (levelCounts[event.level] || 0) + 1;
        sources.add(event.source);
    }

    const securityEvents = categoryCounts["Security"] || 0;
    const configEvents = categoryCounts["Config"] || 0;
    const criticalLevels = (levelCounts["CRITICAL"] || 0) + (levelCounts["ERROR"] || 0);

    // Determine severity
    let severity = "ℹ️ Informational";
    if (securityEvents > 0 || criticalLevels > 0) {
        severity = "🔴 Critical";
    } else if (configEvents > 0 || (levelCounts["WARN"] || 0) > 0) {
        severity = "🟡 Warning";
    }

    // Build the report
    let md = `# 🛡️ LogVault Incident Report\n\n`;
    md += `**Generated:** ${now.toISOString()}\n`;
    md += `**Period:** ${firstEvent.timestamp.toISOString()} → ${lastEvent.timestamp.toISOString()}\n`;
    md += `**Events Analyzed:** ${events.length}\n`;
    md += `**Severity:** ${severity}\n\n`;

    md += `---\n\n`;

    // Integrity Status
    md += `## 🔗 Hash Chain Integrity\n\n`;
    if (chainStatus.valid) {
        md += `✅ **Chain is intact.** All ${chainStatus.verifiedEvents} events have been verified. No tampering detected.\n\n`;
    } else {
        md += `❌ **Chain is broken.** ${chainStatus.details}\n\n`;
        md += `> ⚠️ This report may contain tampered data. Investigate the integrity breach before relying on this report.\n\n`;
    }

    md += `---\n\n`;

    // Summary
    md += `## 📊 Was ist passiert?\n\n`;
    md += `Im Zeitraum von **${formatTimestamp(firstEvent.timestamp)}** bis **${formatTimestamp(lastEvent.timestamp)}** `;
    md += `wurden **${events.length} Ereignisse** aus **${sources.size} Quelle(n)** erfasst.\n\n`;

    if (securityEvents > 0) {
        md += `⚠️ **${securityEvents} sicherheitsrelevante Ereignisse** wurden erkannt.\n\n`;
    }
    if (configEvents > 0) {
        md += `⚙️ **${configEvents} Konfigurationsprobleme** wurden festgestellt.\n\n`;
    }

    // Affected systems
    md += `**Betroffene Systeme:** ${Array.from(sources).join(", ")}\n\n`;

    md += `---\n\n`;

    // Why relevant
    md += `## ❓ Warum relevant?\n\n`;
    if (securityEvents > 0) {
        md += `- Sicherheitsereignisse deuten auf mögliche Angriffe, unbefugte Zugriffsversuche oder Konfigurationslücken hin\n`;
        md += `- Diese Vorfälle können rechtliche oder regulatorische Konsequenzen haben\n`;
    }
    if (configEvents > 0) {
        md += `- Konfigurationsfehler können zu Ausfällen oder Sicherheitslücken führen\n`;
    }
    if (criticalLevels > 0) {
        md += `- **${criticalLevels} kritische Meldungen** erfordern sofortige Aufmerksamkeit\n`;
    }
    if (securityEvents === 0 && configEvents === 0 && criticalLevels === 0) {
        md += `- Routineprotokollierung ohne auffällige Ereignisse\n`;
        md += `- Der Report dient der Dokumentation und Nachvollziehbarkeit\n`;
    }
    md += `\n`;

    md += `---\n\n`;

    // Timeline
    md += `## 📅 Timeline\n\n`;
    md += `| Zeit | Level | Quelle | Kategorie | Ereignis |\n`;
    md += `|------|-------|--------|-----------|----------|\n`;

    for (const event of events) {
        const time = formatTimestamp(event.timestamp);
        const levelBadge = getLevelBadge(event.level);
        const msg = event.message.length > 80 ? event.message.substring(0, 77) + "..." : event.message;
        md += `| ${time} | ${levelBadge} | ${event.source} | ${event.category || "-"} | ${msg} |\n`;
    }

    md += `\n`;

    // Detailed events
    md += `---\n\n`;
    md += `## 📝 Detaillierte Ereignisse\n\n`;

    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        md += `### Event #${i + 1} — ${formatTimestamp(event.timestamp)}\n\n`;
        md += `- **Level:** ${event.level}\n`;
        md += `- **Quelle:** ${event.source}\n`;
        if (event.hostname) md += `- **Hostname:** ${event.hostname}\n`;
        if (event.ipAddress) md += `- **IP-Adresse:** ${event.ipAddress}\n`;
        md += `- **Kategorie:** ${event.category || "Unbekannt"}\n`;
        md += `- **Gerätetyp:** ${event.deviceType || "Unbekannt"}\n`;
        md += `- **Nachricht:** ${event.message}\n`;
        if (event.interpretation) {
            md += `- **Interpretation:** ${event.interpretation}\n`;
        }
        if (event.eventHash) {
            md += `- **Hash:** \`${event.eventHash.substring(0, 16)}...\`\n`;
        }
        md += `\n`;
    }

    // Footer
    md += `---\n\n`;
    md += `## 📋 Zusammenfassung\n\n`;
    md += `| Kennzahl | Wert |\n`;
    md += `|----------|------|\n`;
    md += `| Gesamtereignisse | ${events.length} |\n`;
    md += `| Quellen | ${sources.size} |\n`;
    md += `| Sicherheitsereignisse | ${securityEvents} |\n`;
    md += `| Konfigurationsfehler | ${configEvents} |\n`;
    md += `| Kritische Meldungen | ${criticalLevels} |\n`;
    md += `| Hash-Chain Status | ${chainStatus.valid ? "✅ Intakt" : "❌ Gebrochen"} |\n`;
    md += `\n`;

    md += `---\n\n`;
    md += `*Dieser Report wurde automatisch von LogVault generiert. Die kryptografische Hash-Kette gewährleistet die Integrität der protokollierten Ereignisse.*\n`;

    return md;
}

function formatTimestamp(date: Date): string {
    return date.toISOString().replace("T", " ").substring(0, 19);
}

function getLevelBadge(level: string): string {
    switch (level.toUpperCase()) {
        case "CRITICAL": return "🔴 CRITICAL";
        case "ERROR": return "🔴 ERROR";
        case "WARN": return "🟡 WARN";
        case "WARNING": return "🟡 WARNING";
        case "INFO": return "🟢 INFO";
        case "DEBUG": return "⚪ DEBUG";
        default: return level;
    }
}
