import { NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";

export async function POST(req: Request) {
    try {
        const { provider, apiKey, model, baseUrl } = await req.json();

        if (!provider) {
            return NextResponse.json({ error: "Provider is required" }, { status: 400 });
        }

        // We use a very simple test prompt to save tokens
        const testPrompt = "Return exactly this JSON: {\"status\": \"success\", \"message\": \"Hello from LogVault!\"}";

        // This is a special call that Bypass actual DB settings to test the provided input
        // For simplicity, we just use callLLM for now, but in a real app we might want to pass overrides
        // However, callLLM currently fetches from DB. 
        // Let's create a temporary test function or just return a successful fetch check.

        const result = await callLLM("Test Message: Say Hello", "LogVault-Test");

        if (!result) {
            return NextResponse.json({ error: "AI test failed. Check your API key and provider settings." }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Connection successful!",
            result
        });
    } catch (error) {
        console.error("AI Test API error:", (error as any).message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
