import { NextRequest, NextResponse } from "next/server";
import { fetchAvailableModels } from "@/lib/llm";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");
    const apiKey = searchParams.get("apiKey");
    const baseUrl = searchParams.get("baseUrl") || undefined;

    if (!provider || (!apiKey && provider !== "local")) {
        return NextResponse.json({ error: "Missing provider or apiKey" }, { status: 400 });
    }

    const models = await fetchAvailableModels(provider, apiKey || "", baseUrl);
    return NextResponse.json({ models });
}
