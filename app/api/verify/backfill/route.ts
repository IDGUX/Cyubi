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

        const CHUNK_SIZE = 1000;
        let previousHash = "0"; // Genesis
        let backfilled = 0;
        let total = 0;
        let lastCursor: { id: string } | null = null;
        let hasMore = true;

        while (hasMore) {
            const logsChunk: any[] = await logModel.findMany({
                take: CHUNK_SIZE,
                skip: lastCursor ? 1 : 0,
                cursor: lastCursor ? lastCursor : undefined,
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

            if (logsChunk.length === 0) {
                hasMore = false;
                break;
            }

            total += logsChunk.length;
            const updates: { id: string; eventHash: string; previousHash: string }[] = [];

            for (const log of logsChunk) {
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
                lastCursor = { id: log.id };
            }

            if (updates.length > 0) {
                await prisma.$transaction(
                    updates.map((u) =>
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

            if (logsChunk.length < CHUNK_SIZE) {
                hasMore = false;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Backfill complete. ${backfilled} of ${total} logs updated.`,
            backfilled,
            total,
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
