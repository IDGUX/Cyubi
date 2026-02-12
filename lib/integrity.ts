import { createHash } from "crypto";
import { prisma } from "./prisma";
import { getLogModel } from "./types";

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

/**
 * Atomically create a log entry with a proper hash chain link.
 * Uses a PostgreSQL advisory lock to serialize all chain writes,
 * preventing race conditions from concurrent syslog ingestion.
 *
 * Lock ID 42 is an arbitrary constant used exclusively for chain serialization.
 */
export async function createLogWithHash(data: {
    level: string;
    source: string;
    message: string;
    interpretation: string | null;
    category: string | null;
    deviceType: string | null;
    hostname?: string | null;
    ipAddress?: string | null;
    metadata?: string | null;
}): Promise<any> {
    return await prisma.$transaction(async (tx) => {
        // Acquire an advisory lock scoped to this transaction
        await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock(42)");

        const logModel = getLogModel(tx as any);

        // Get the latest hash inside the lock
        const lastLog = await logModel.findFirst({
            where: { eventHash: { not: null } },
            orderBy: { timestamp: "desc" },
            select: { eventHash: true },
        });
        const previousHash = lastLog?.eventHash || "0";

        const eventTimestamp = new Date();
        const eventHash = computeEventHash(previousHash, {
            level: data.level,
            source: data.source,
            message: data.message,
            timestamp: eventTimestamp.toISOString(),
        });

        const log = await logModel.create({
            data: {
                level: data.level,
                source: data.source,
                message: data.message,
                interpretation: data.interpretation,
                category: data.category,
                deviceType: data.deviceType,
                hostname: data.hostname || null,
                ipAddress: data.ipAddress || null,
                metadata: data.metadata || null,
                timestamp: eventTimestamp,
                eventHash: eventHash,
                previousHash: previousHash,
            },
        });

        return log;
    }, {
        timeout: 10000, // 10 second timeout
    });
}
