import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        console.log("DEBUG: GET /api/sources requested");
        // Resilient model discovery: Find any property that matches 'syslogsource' case-insensitively
        const availableKeys = Object.keys(prisma);
        const modelName = availableKeys.find(k => k.toLowerCase() === "syslogsource") || "syslogSource";
        const model = (prisma as any)[modelName];

        if (!model) {
            const usefulKeys = availableKeys.filter(k => !k.startsWith("_") && !k.startsWith("$"));
            console.error("CRITICAL: SyslogSource model not found!", { available: usefulKeys });
            return NextResponse.json({
                error: "Database configuration error",
                detail: `Model 'SyslogSource' not found. Available: ${usefulKeys.join(", ")}`
            }, { status: 500 });
        }

        const sources = await model.findMany({
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(sources);
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch sources", detail: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, ipAddress, color } = body;

        if (!name || !ipAddress) {
            return NextResponse.json({ error: "Name and IP Address are required" }, { status: 400 });
        }

        // Resilient model discovery: Find any property that matches 'syslogsource' case-insensitively
        const availableKeys = Object.keys(prisma);
        const modelName = availableKeys.find(k => k.toLowerCase() === "syslogsource") || "syslogSource";
        const model = (prisma as any)[modelName];

        if (!model) {
            const usefulKeys = availableKeys.filter(k => !k.startsWith("_") && !k.startsWith("$"));
            console.error("CRITICAL: SyslogSource model not found!", { available: usefulKeys });
            return NextResponse.json({
                error: "Database configuration error",
                detail: `Model 'SyslogSource' not found. Available: ${usefulKeys.join(", ")}`
            }, { status: 500 });
        }

        const source = await model.upsert({
            where: { ipAddress },
            update: { name, color },
            create: { name, ipAddress, color },
        });

        return NextResponse.json(source);
    } catch (error: any) {
        console.error("DEBUG: Failed to save source:", error.message, error.stack);
        return NextResponse.json({ error: "Failed to save source", detail: error.message }, { status: 500 });
    }
}
