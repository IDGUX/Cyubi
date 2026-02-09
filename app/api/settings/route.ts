import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        console.log("DEBUG: GET /api/settings requested");
        // @ts-ignore
        const model = (prisma as any).setting || (prisma as any).systemSetting;

        if (!model) {
            return NextResponse.json({
                error: "Prisma model not found",
                prismaKeys: Object.keys(prisma)
            }, { status: 500 });
        }

        try {
            const settings = await (prisma as any).setting.findMany();
            const config = settings.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});
            return NextResponse.json(config);
        } catch (e: any) {
            console.error("Settings fetch error:", e.message);
            return NextResponse.json({}); // Return empty config instead of crashing
        }
    } catch (error: any) {
        console.error("DEBUG: GET /api/settings error:", error.message);
        return NextResponse.json({
            error: "Failed to fetch settings",
            detail: error.message
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const model = (prisma as any).setting || (prisma as any).systemSetting;

        if (!model) {
            throw new Error("Prisma model 'setting' not found");
        }

        for (const [key, value] of Object.entries(body)) {
            await model.upsert({
                where: { key },
                update: { value: value as string },
                create: { key, value: value as string },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DEBUG: POST /api/settings error:", error.message);
        return NextResponse.json({ error: "Failed to update settings", detail: error.message }, { status: 500 });
    }
}
