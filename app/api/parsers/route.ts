import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const model = (prisma as any).logParser;
        if (!model) throw new Error("Model 'LogParser' not found on Prisma client.");

        const parsers = await model.findMany({
            orderBy: { priority: "desc" }
        });
        return NextResponse.json(parsers);
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch parsers", detail: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, pattern, level, category, interpretation, priority } = body;

        if (!name || !pattern || !interpretation) {
            return NextResponse.json({ error: "Name, Pattern, and Interpretation are required" }, { status: 400 });
        }

        const model = (prisma as any).logParser;
        const parser = await model.create({
            data: {
                name,
                pattern,
                level: level || "INFO",
                category: category || "Info",
                interpretation,
                priority: priority || 0
            }
        });

        return NextResponse.json(parser);
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to save parser", detail: error.message }, { status: 500 });
    }
}
