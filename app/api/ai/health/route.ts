import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLogModel } from "@/lib/types";

export async function GET() {
    try {
        const logModel = getLogModel(prisma);

        // Fetch only CRITICAL, ERROR, WARN, or Security logs from the last 24 hours
        // This keeps token usage extremely low since routine INFO logs are ignored
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const criticalLogs = await logModel.findMany({
            where: {
                timestamp: { gte: yesterday },
                OR: [
                    { level: { in: ["CRITICAL", "ERROR", "WARN"] } },
                    { category: "Security" }
                ]
            },
            orderBy: { timestamp: "desc" },
            take: 100 // Hard limit to protect token budget
        });

        if (criticalLogs.length === 0) {
            return NextResponse.json({
                status: "healthy",
                report: "Das System läuft stabil. Es gab in den letzten 24 Stunden keine kritischen Warnungen oder Fehler."
            });
        }

        // Prepare context for the AI
        const contextData = criticalLogs.map((l: any) =>
            `[${l.level}] ${l.source}: ${l.message} (x${l.repeatCount || 0})`
        ).join("\n");

        // Fetch all relevant AI settings
        const settings = await prisma.setting.findMany({
            where: {
                key: {
                    in: [
                        "AI_ACTIVE_PROVIDER",
                        "SECRET_OPENAI_KEY", "AI_OPENAI_MODEL",
                        "SECRET_ANTHROPIC_KEY", "AI_ANTHROPIC_MODEL",
                        "SECRET_GEMINI_KEY", "AI_GEMINI_MODEL",
                        "SECRET_MISTRAL_KEY", "AI_MISTRAL_MODEL",
                        "AI_LOCAL_URL", "AI_LOCAL_MODEL"
                    ]
                }
            }
        });
        const config = settings.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});

        const provider = config.AI_ACTIVE_PROVIDER || "openai";
        let apiKey = "";
        let model = "";

        if (provider === "openai") {
            apiKey = config.SECRET_OPENAI_KEY;
            model = config.AI_OPENAI_MODEL || "gpt-4o";
        } else if (provider === "anthropic") {
            apiKey = config.SECRET_ANTHROPIC_KEY;
            model = config.AI_ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
        } else if (provider === "gemini") {
            apiKey = config.SECRET_GEMINI_KEY;
            model = config.AI_GEMINI_MODEL || "gemini-1.5-flash";
        } else if (provider === "mistral") {
            apiKey = config.SECRET_MISTRAL_KEY;
            model = config.AI_MISTRAL_MODEL || "mistral-large-latest";
        }

        if (!apiKey && provider !== "local") {
            return NextResponse.json({ error: "AI not configured for active provider" }, { status: 400 });
        }

        const prompt = `Du bist ein professioneller DevOps & Security Analyst. Lese die folgenden kritischen Vorfälle der letzten 24 Stunden. 
        Deine Aufgabe: Fasse die Systemgesundheit GANZ KURZ (max 2-3 Sätze) zusammen. Ignoriere irrelevante Ausreißer.
        Wenn ein Gerät abstürzt (z.B. OOM) oder bruteforced wird, schlage Alarm.
        Wenn es nur vereinzelt kleine Warnungen sind, stufe es als 'Stabil mit Auffälligkeiten' ein.
        
        LOGS:
        ${contextData}`;

        let report = "";

        if (provider === "openai") {
            const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
                body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 150, temperature: 0.3 })
            });
            if (!aiResponse.ok) throw new Error(`OpenAI API failed: ${aiResponse.statusText}`);
            const data = await aiResponse.json();
            report = data.choices?.[0]?.message?.content || "Keine Analyse möglich.";
        }
        else if (provider === "anthropic") {
            const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
                body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 150 })
            });
            if (!aiResponse.ok) throw new Error(`Anthropic API failed: ${aiResponse.statusText}`);
            const data = await aiResponse.json();
            report = data.content?.[0]?.text || "Keine Analyse möglich.";
        }
        else if (provider === "gemini") {
            const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!aiResponse.ok) throw new Error(`Gemini API failed: ${aiResponse.statusText}`);
            const data = await aiResponse.json();
            report = data.candidates?.[0]?.content?.parts?.[0]?.text || "Keine Analyse möglich.";
        }
        else if (provider === "mistral") {
            const aiResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
                body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 150, temperature: 0.3 })
            });
            if (!aiResponse.ok) throw new Error(`Mistral API failed: ${aiResponse.statusText}`);
            const data = await aiResponse.json();
            report = data.choices?.[0]?.message?.content || "Keine Analyse möglich.";
        }
        else if (provider === "local") {
            const localUrl = config.AI_LOCAL_URL || "http://localhost:11434";
            const aiResponse = await fetch(`${localUrl}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: config.AI_LOCAL_MODEL || "llama3", prompt: prompt, stream: false })
            });
            if (!aiResponse.ok) throw new Error(`Local LLM failed: ${aiResponse.statusText}`);
            const data = await aiResponse.json();
            report = data.response || "Keine Analyse möglich.";
        }

        const isCritical = report.toLowerCase().includes("alarm") || report.toLowerCase().includes("kritisch") || report.toLowerCase().includes("angriff");
        const status = isCritical ? "critical" : "warning";

        return NextResponse.json({
            status,
            report
        });
    } catch (error: any) {
        console.error("Health report failed:", error.message);
        return NextResponse.json({ error: "Health report failed", detail: error.message }, { status: 500 });
    }
}
