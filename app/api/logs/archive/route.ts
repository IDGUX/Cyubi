import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLogModel } from "@/lib/types";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const month = parseInt(searchParams.get("month") || "");
        const year = parseInt(searchParams.get("year") || "");

        if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
            return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
        }

        const logModel = getLogModel(prisma);

        // Calculate start and end dates
        const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
        const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0)); // First day of next month

        const logs = await logModel.findMany({
            where: {
                timestamp: {
                    gte: startDate,
                    lt: endDate
                }
            },
            orderBy: { timestamp: "asc" } // chronological for archives
        });

        if (logs.length === 0) {
            return NextResponse.json({ error: "No logs found for this period" }, { status: 404 });
        }

        // Format as JSONL (JSON Lines) for easy importing/parsing
        const jsonlContent = logs.map((l: any) => JSON.stringify({
            id: l.id,
            timestamp: l.timestamp,
            level: l.level,
            source: l.source,
            message: l.message,
            interpretation: l.interpretation,
            category: l.category,
            deviceType: l.deviceType,
            ipAddress: l.ipAddress,
            isAiAnalyzed: l.isAiAnalyzed,
            repeatCount: l.repeatCount,
        })).join("\n");


        // Update the last archive download date in Settings
        await prisma.setting.upsert({
            where: { key: "LAST_ARCHIVE_DOWNLOAD" },
            update: { value: new Date().toISOString() },
            create: { key: "LAST_ARCHIVE_DOWNLOAD", value: new Date().toISOString() }
        }).catch(err => console.warn("Could not save archive date:", err));


        // Return as a downloadable file
        const filename = `cyubi_archive_${year}_${month.toString().padStart(2, '0')}.jsonl`;
        const headers = new Headers();
        headers.set('Content-Disposition', `attachment; filename="${filename}"`);
        headers.set('Content-Type', 'application/jsonl');

        return new NextResponse(jsonlContent, {
            status: 200,
            headers
        });
    } catch (error: any) {
        console.error("Failed to generate archive:", error.message);
        return NextResponse.json({ error: "Failed to generate archive", detail: error.message }, { status: 500 });
    }
}
