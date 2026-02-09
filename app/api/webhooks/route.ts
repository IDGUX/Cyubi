import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const availableKeys = Object.keys(prisma);
        const webhookModelName = availableKeys.find(k => k.toLowerCase() === "webhook");
        const model = webhookModelName ? (prisma as any)[webhookModelName] : null;

        if (!model) {
            console.error("CRITICAL: Webhook model not found!", { available: availableKeys });
            throw new Error(`Model 'webhook' not found. Available: ${availableKeys.join(", ")}`);
        }

        const webhooks = await model.findMany({
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(webhooks);
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch webhooks", detail: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, url } = body;

        if (!name || !url) {
            return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
        }

        const availableKeys = Object.keys(prisma);
        const webhookModelName = availableKeys.find(k => k.toLowerCase() === "webhook");
        const webhookModel = webhookModelName ? (prisma as any)[webhookModelName] : null;

        if (!webhookModel) throw new Error("Webhook model not found");

        const webhook = await webhookModel.create({
            data: { name, url }
        });

        return NextResponse.json(webhook);
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to save webhook", detail: error.message }, { status: 500 });
    }
}
