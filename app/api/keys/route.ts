import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
    try {
        const keys = await prisma.apiKey.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(keys);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch keys" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name } = await req.json();
        if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

        const key = crypto.randomBytes(32).toString("hex");
        const apiKey = await prisma.apiKey.create({
            data: { key, name },
        });

        return NextResponse.json(apiKey);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create key" }, { status: 500 });
    }
}
