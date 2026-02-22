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

        // Use the settings from database
        const settings = await prisma.setting.findMany({
            where: { key: { in: ["AI_PROVIDER", "AI_API_KEY", "AI_MODEL", "AI_ENDPOINT"] } }
        });
        const config = settings.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});

        if (!config.AI_API_KEY) {
            return NextResponse.json({ error: "AI not configured" }, { status: 400 });
        }

        const prompt = `Du bist ein professioneller DevOps & Security Analyst. Lese die folgenden kritischen Vorfälle der letzten 24 Stunden. 
        Deine Aufgabe: Fasse die Systemgesundheit GANZ KURZ (max 2-3 Sätze) zusammen. Ignoriere irrelevante Ausreißer.
        Wenn ein Gerät abstürzt (z.B. OOM) oder bruteforced wird, schlage Alarm.
        Wenn es nur vereinzelt kleine Warnungen sind, stufe es als 'Stabil mit Auffälligkeiten' ein.
        
        LOGS:
        ${contextData}`;

        let report = "";

        // Very basic implementation: calling OpenAI since the prompt structure matches the default analyst
        // Extracting logic directly to avoid changing existing analyzeLog signature
        const apiUrl = config.AI_ENDPOINT || "https://api.openai.com/v1/chat/completions";
        const model = config.AI_MODEL || "gpt-3.5-turbo";

        const aiResponse = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.AI_API_KEY}`
            },
            body: JSON.stringify({
                model,
                messages: [{ role: "user", content: prompt }],
                max_tokens: 150,
                temperature: 0.3
            })
        });

        if (!aiResponse.ok) {
            throw new Error(`AI API failed: ${aiResponse.statusText}`);
        }

        const data = await aiResponse.json();
        report = data.choices?.[0]?.message?.content || "Keine Analyse möglich.";

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
