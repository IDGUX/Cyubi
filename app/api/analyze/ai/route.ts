import { NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { message, source, saveRule, logId } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const result = await callLLM(message, source || "Unknown");

        if (!result) {
            return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
        }

        // If logId is provided, update the specific log entry
        if (logId) {
            try {
                await prisma.log.update({
                    where: { id: logId },
                    data: {
                        interpretation: result.interpretation,
                        category: result.category,
                        deviceType: result.deviceType,
                        isAiAnalyzed: true
                    }
                });
            } catch (updateError) {
                console.error("Failed to update log with AI result:", (updateError as any).message);
            }
        }

        // If saveRule is true and we have a suggestion, save it to the DB
        if (saveRule && result.suggestedParser) {
            try {
                await prisma.logParser.create({
                    data: {
                        name: `AI Generated: ${result.interpretation.substring(0, 30)}...`,
                        pattern: result.suggestedParser.pattern,
                        interpretation: result.suggestedParser.interpretation,
                        category: result.suggestedParser.category,
                        enabled: true,
                        priority: 10 // High priority for AI learned rules
                    }
                });
            } catch (dbError) {
                console.error("Failed to save AI rule:", (dbError as any).message);
            }
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("AI API route error:", (error as any).message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
