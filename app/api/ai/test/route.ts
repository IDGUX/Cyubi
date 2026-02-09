import { NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";

export async function POST(req: Request) {
    try {
        const { provider, apiKey, model, baseUrl, lang = "de" } = await req.json();

        if (!provider) {
            return NextResponse.json({ error: lang === "de" ? "Provider ist erforderlich" : "Provider is required" }, { status: 400 });
        }

        // Localized strings for the test
        const testPrompt = lang === "de"
            ? "Antworte kurz: Hallo von LogVault! Die Verbindung steht."
            : "Respond briefly: Hello from LogVault! Connection established.";

        const result = await callLLM(testPrompt, "LogVault-Test", {
            provider,
            apiKey,
            model,
            baseUrl
        });

        if (!result) {
            const errorMsg = lang === "de"
                ? "KI-Test fehlgeschlagen. Prüfe API-Key und Provider-Einstellungen."
                : "AI test failed. Check your API key and provider settings.";
            return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: lang === "de" ? "Verbindung erfolgreich!" : "Connection successful!",
            model: model || "default",
            interpretation: result.interpretation
        });
    } catch (error) {
        console.error("AI Test API error:", (error as any).message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
