import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeEventHash } from "@/lib/integrity";
import { getLogModel } from "@/lib/types";

/**
 * POST /api/verify/backfill
 * 
 * Retroactively computes hashes for all logs that don't have them yet.
 * Processes ALL logs in chronological order, building a proper chain
 * from the very first log entry.
 */
export async function POST() {
    try {
        const logModel = getLogModel(prisma);

        // Get ALL logs ordered chronologically
        const allLogs = await logModel.findMany({
            orderBy: { timestamp: "asc" },
            select: {
                id: true,
                level: true,
                source: true,
                message: true,
                timestamp: true,
                eventHash: true,
                previousHash: true,
            },
        });

        if (allLogs.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No logs to backfill.",
                backfilled: 0,
                total: 0,
            });
        }

        let previousHash = "0"; // Genesis
        let backfilled = 0;

        for (const log of allLogs) {
            const expectedHash = computeEventHash(previousHash, {
                level: log.level,
                source: log.source,
                message: log.message,
                timestamp: log.timestamp.toISOString(),
            });

            // Update if missing or if the chain was broken by prior inconsistency
            if (!log.eventHash || log.eventHash !== expectedHash || log.previousHash !== previousHash) {
                await logModel.update({
                    where: { id: log.id },
                    data: {
                        eventHash: expectedHash,
                        previousHash: previousHash,
                    },
                });
                backfilled++;
            }

            previousHash = expectedHash;
        }

        return NextResponse.json({
            success: true,
            message: `Backfill complete. ${backfilled} of ${allLogs.length} logs updated.`,
            backfilled,
            total: allLogs.length,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Backfill error:", message);
        return NextResponse.json(
            { success: false, error: "Backfill failed", detail: message },
            { status: 500 }
        );
    }
}
