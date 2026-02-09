import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // 1. Get unique IPs from logs in the last 48 hours
        const fortyEightHoursAgo = new Date();
        fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

        // Robust model discovery for Log
        const availableKeys = Object.keys(prisma);
        const logModelName = availableKeys.find(k => k.toLowerCase() === "log");
        const logModel = logModelName ? (prisma as any)[logModelName] : null;

        if (!logModel) throw new Error("Log model not found");

        const recentLogs = await logModel.findMany({
            where: {
                timestamp: { gte: fortyEightHoursAgo },
                ipAddress: { not: null }
            },
            select: { ipAddress: true },
            distinct: ['ipAddress']
        });

        const logIps = recentLogs.map((l: any) => l.ipAddress);

        // 2. Get known IPs from SyslogSource
        const sourceModelName = availableKeys.find(k => k.toLowerCase() === "syslogsource");
        const sourceModel = sourceModelName ? (prisma as any)[sourceModelName] : null;

        const knownSources = sourceModel ? await sourceModel.findMany({
            select: { ipAddress: true }
        }) : [];

        const knownIps = new Set(knownSources.map((s: any) => s.ipAddress));

        // 3. Filter for unknown IPs
        const unknownIps = logIps.filter((ip: string) => !knownIps.has(ip));

        return NextResponse.json(unknownIps);
    } catch (error: any) {
        console.error("Discovery failed:", error);
        return NextResponse.json({ error: "Failed to discover sources", detail: error.message }, { status: 500 });
    }
}
