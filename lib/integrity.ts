import { createHash } from "crypto";
import { prisma } from "./prisma";

/**
 * LogVault Hash-Chain Integrity Module
 * 
 * Each event is cryptographically linked to its predecessor via SHA-256.
 * Hash = SHA-256(previousHash + level + source + message + timestamp)
 * 
 * This creates a tamper-proof chain: modifying, deleting, or reordering
 * any event breaks the chain and is immediately detectable.
 */

export interface HashPayload {
    level: string;
    source: string;
    message: string;
    timestamp: string;
}

/**
 * Compute the SHA-256 hash for an event, chaining it to the previous hash.
 */
export function computeEventHash(previousHash: string, payload: HashPayload): string {
    const data = `${previousHash}|${payload.level}|${payload.source}|${payload.message}|${payload.timestamp}`;
    return createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * Get the hash of the most recent log entry.
 * Returns "0" (genesis) if no entries exist.
 */
export async function getLastHash(): Promise<string> {
    const lastLog = await prisma.log.findFirst({
        where: { eventHash: { not: null } },
        orderBy: { timestamp: "desc" },
        select: { eventHash: true },
    });

    return lastLog?.eventHash || "0";
}

/**
 * Verify the integrity of the entire hash chain.
 * Returns detailed results including where the chain breaks (if at all).
 */
export async function verifyChain(): Promise<{
    valid: boolean;
    totalEvents: number;
    verifiedEvents: number;
    brokenAt?: number;
    brokenEventId?: string;
    details: string;
}> {
    const logs = await prisma.log.findMany({
        where: {
            eventHash: { not: null },
            previousHash: { not: null },
        },
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

    if (logs.length === 0) {
        return {
            valid: true,
            totalEvents: 0,
            verifiedEvents: 0,
            details: "No hash-chained events found. Chain is empty.",
        };
    }

    let previousHash = "0";

    for (let i = 0; i < logs.length; i++) {
        const log = logs[i];

        // Verify that the stored previousHash matches what we expect
        if (log.previousHash !== previousHash) {
            return {
                valid: false,
                totalEvents: logs.length,
                verifiedEvents: i,
                brokenAt: i + 1,
                brokenEventId: log.id,
                details: `Chain broken at event #${i + 1} (ID: ${log.id}). Expected previousHash "${previousHash}", found "${log.previousHash}".`,
            };
        }

        // Recompute the hash and verify it matches
        const expectedHash = computeEventHash(previousHash, {
            level: log.level,
            source: log.source,
            message: log.message,
            timestamp: log.timestamp.toISOString(),
        });

        if (log.eventHash !== expectedHash) {
            return {
                valid: false,
                totalEvents: logs.length,
                verifiedEvents: i,
                brokenAt: i + 1,
                brokenEventId: log.id,
                details: `Hash mismatch at event #${i + 1} (ID: ${log.id}). Event data may have been tampered with.`,
            };
        }

        previousHash = log.eventHash!;
    }

    return {
        valid: true,
        totalEvents: logs.length,
        verifiedEvents: logs.length,
        details: `All ${logs.length} events verified. Hash chain is intact.`,
    };
}
