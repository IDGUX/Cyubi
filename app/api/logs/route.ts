import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeLog } from "@/lib/analyst";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { level, source, message, metadata, hostname, ipAddress } = body;

        // 1. Pulse: Update lastSeen for the Source
        let resolvedSource = source || "Default";
        try {
            const availableKeys = Object.keys(prisma);
            const sourceModelName = availableKeys.find(k => k.toLowerCase() === "syslogsource");
            const sourceModel = sourceModelName ? (prisma as any)[sourceModelName] : (prisma as any).syslogSource;

            if (sourceModel && (ipAddress || (source && source.match(/^(\d{1,3}\.){3}\d{1,3}$/)))) {
                const lookupIp = ipAddress || source;
                const foundSource = await sourceModel.findUnique({
                    where: { ipAddress: lookupIp }
                });

                if (foundSource) {
                    resolvedSource = foundSource.name;
                    // Update lastSeen asynchronously
                    sourceModel.update({
                        where: { id: foundSource.id },
                        data: { lastSeen: new Date() }
                    }).catch((err: any) => console.error("Failed to update lastSeen:", err));
                }
            }
        } catch (e) {
            console.warn("Pulse/Source resolution failed:", (e as any).message);
        }

        // 3. intelligent Analysis
        const analysis = await analyzeLog(message, resolvedSource);

        // 4. Store in DB (Robust model discovery)
        const logModel = (prisma as any).log || (prisma as any).Log || (prisma as any)[Object.keys(prisma).find(k => k.toLowerCase() === "log") || ""];

        if (!logModel) {
            throw new Error("Log model not found in Prisma client");
        }

        const log = await logModel.create({
            data: {
                level: level || "INFO",
                source: resolvedSource,
                message: message,
                interpretation: analysis.interpretation,
                category: analysis.category,
                deviceType: analysis.deviceType,
                hostname: hostname,
                ipAddress: ipAddress,
                metadata: metadata ? JSON.stringify(metadata) : null,
            },
        });

        // 5. Trigger Webhook Alerts for critical events
        if (analysis.category === "Security" || analysis.category === "Config") {
            const { sendWebhookAlert } = await import("@/lib/webhooks");
            await sendWebhookAlert(analysis.category, analysis.interpretation, analysis.category);
        }

        // 6. Alerting (if configured)
        if (["WARN", "ERROR", "CRITICAL"].includes(level)) {
            try {
                const availableKeys = Object.keys(prisma);
                const webhookModelName = availableKeys.find(k => k.toLowerCase() === "webhook");
                const webhookModel = webhookModelName ? (prisma as any)[webhookModelName] : (prisma as any).webhook;

                if (webhookModel) {
                    const webhooks = await webhookModel.findMany({ where: { enabled: true } });
                    for (const webhook of webhooks) {
                        try {
                            await fetch(webhook.url, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    text: `🚨 *LogVault Alarm* (${level})\n*Quelle:* ${resolvedSource}\n*Filter:* ${analysis.category}\n*Nachricht:* ${message}`
                                }),
                            });
                        } catch (err: any) {
                            console.error(`Failed to send alert to ${webhook.name}:`, err.message);
                        }
                    }
                }
            } catch (e: any) {
                console.warn("Alerting fetch failed:", e.message);
            }
        }

        // 7. Automatic USB-Sync (Flash-Archive)
        try {
            const settings = await prisma.setting.findMany({
                where: { key: { in: ["USB_AUTO_SYNC", "USB_PATH"] } }
            });
            const config = settings.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});

            if (config.USB_AUTO_SYNC === "true" && config.USB_PATH) {
                const fs = await import("fs/promises");
                const path = await import("path");
                const usbFilePath = path.join(config.USB_PATH, `logvault_sync_${new Date().toISOString().split('T')[0]}.jsonl`);
                const logLine = JSON.stringify({
                    timestamp: log.timestamp,
                    level: log.level,
                    source: log.source,
                    message: log.message,
                    interpretation: log.interpretation,
                    category: log.category,
                    ipAddress: log.ipAddress
                }) + "\n";

                await fs.appendFile(usbFilePath, logLine);
            }
        } catch (e) {
            console.error("USB Sync failed:", e);
        }

        return NextResponse.json(log);
    } catch (error: any) {
        console.error("Log ingestion error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const category = searchParams.get("category");
        const source = searchParams.get("source");
        const search = searchParams.get("search");

        // Robust model discovery for Log
        const logModel = (prisma as any).log || (prisma as any).Log || (prisma as any)[Object.keys(prisma).find(k => k.toLowerCase() === "log") || ""];

        if (!logModel) {
            throw new Error("Log model not found in Prisma client");
        }

        const logs = await logModel.findMany({
            where: {
                AND: [
                    category ? { category } : {},
                    source ? { source } : {},
                    search ? {
                        OR: [
                            { message: { contains: search } },
                            { interpretation: { contains: search } },
                            { source: { contains: search } },
                            { ipAddress: { contains: search } },
                        ]
                    } : {}
                ]
            },
            orderBy: { timestamp: "desc" },
            take: limit,
        });

        return NextResponse.json(logs);
    } catch (error: any) {
        console.error("Failed to fetch logs:", error.message);
        return NextResponse.json({ error: "Failed to fetch logs", detail: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action");

        // Robust model discovery for Log
        const logModel = (prisma as any).log || (prisma as any).Log || (prisma as any)[Object.keys(prisma).find(k => k.toLowerCase() === "log") || ""];

        if (!logModel) {
            throw new Error("Log model not found in Prisma client");
        }

        if (action === "prune") {
            const { pruneLogs } = await import("@/lib/lifecycle");
            await pruneLogs();
            return NextResponse.json({ success: true, message: "Pruning triggered" });
        }

        // Default: Delete ALL logs
        await logModel.deleteMany({});
        console.log("🗑️ All logs cleared by user.");
        return NextResponse.json({ success: true, message: "All logs cleared" });
    } catch (error: any) {
        console.error("Failed to clear logs:", error.message);
        return NextResponse.json({ error: "Failed to clear logs", detail: error.message }, { status: 500 });
    }
}
