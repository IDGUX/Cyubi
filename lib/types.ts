/**
 * Shared type definitions for LogVault.
 */

export interface LogEvent {
    id: string;
    timestamp: string | Date;
    level: string;
    source: string;
    message: string;
    interpretation?: string;
    category?: string;
    deviceType?: string;
    hostname?: string;
    ipAddress?: string;
    metadata?: string;
    isAiAnalyzed?: boolean;
    eventHash?: string;
    previousHash?: string;
}

/**
 * Returns the Prisma Log model safely.
 * Centralizes the model discovery pattern used across API routes.
 */
export function getLogModel(prisma: any) {
    const model = (prisma as any).log || (prisma as any).Log;
    if (!model) {
        throw new Error("Log model not found in Prisma client");
    }
    return model;
}
