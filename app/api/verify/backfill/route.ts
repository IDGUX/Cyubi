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
 * 
 * Uses batched transactions for performance (chunks of 500).
 */
export async function POST() {
    try {
        const logModel = getLogModel(prisma);

        // Get ALL logs ordered chronologically
        const allLogs = await logModel.findMany({
            orderBy: [{ timestamp: "asc" }, { id: "asc" }],
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

        // Collect all updates first, then batch them
        const updates: { id: string; eventHash: string; previousHash: string }[] = [];

        for (const log of allLogs) {
            const expectedHash = computeEventHash(previousHash, {
                level: log.level,
                source: log.source,
                message: log.message,
                timestamp: log.timestamp.toISOString(),
            });

            if (!log.eventHash || log.eventHash !== expectedHash || log.previousHash !== previousHash) {
                updates.push({
                    id: log.id,
                    eventHash: expectedHash,
                    previousHash: previousHash,
                });
                backfilled++;
            }

            previousHash = expectedHash;
        }

        // Execute updates in batched transactions (chunks of 500)
        const CHUNK_SIZE = 500;
        for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
            const chunk = updates.slice(i, i + CHUNK_SIZE);
            await prisma.$transaction(
                chunk.map((u) =>
                    logModel.update({
                        where: { id: u.id },
                        data: {
                            eventHash: u.eventHash,
                            previousHash: u.previousHash,
                        },
                    })
                )
            );
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
