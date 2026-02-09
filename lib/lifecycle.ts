import { prisma } from "./prisma";

/**
 * Prunes logs from the database based on retention settings.
 * - Deletes logs older than LOG_RETENTION_DAYS.
 * - Deletes oldest logs if count exceeds MAX_LOG_COUNT.
 */
export async function pruneLogs() {
    console.log("🧹 Starting log maintenance...");
    try {
        // 1. Fetch current settings
        const settings = await prisma.setting.findMany({
            where: {
                key: { in: ["LOG_RETENTION_DAYS", "MAX_LOG_COUNT"] }
            }
        });

        const config = settings.reduce((acc: any, curr: any) => ({
            ...acc, [curr.key]: curr.value
        }), {
            LOG_RETENTION_DAYS: "30", // Default 30 days
            MAX_LOG_COUNT: "50000"    // Default 50k logs
        });

        const retentionDays = parseInt(config.LOG_RETENTION_DAYS) || 30;
        const maxLogs = parseInt(config.MAX_LOG_COUNT) || 50000;

        // Robust model discovery for Log
        const logModel = (prisma as any).log || (prisma as any).Log || (prisma as any)[Object.keys(prisma).find(k => k.toLowerCase() === "log") || ""];

        if (!logModel) {
            throw new Error("Log model not found in Prisma client");
        }

        // 2. Prune by Age
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const deletedByAge = await logModel.deleteMany({
            where: {
                timestamp: { lt: cutoffDate }
            }
        });

        if (deletedByAge.count > 0) {
            console.log(`✅ Deleted ${deletedByAge.count} logs older than ${retentionDays} days.`);
        }

        // 3. Prune by Count (Rotation)
        const currentCount = await logModel.count();
        if (currentCount > maxLogs) {
            // Find the ID of the N-th newest log to use as a cutoff
            const oldestToKeep = await logModel.findMany({
                orderBy: { timestamp: "desc" },
                take: 1,
                skip: maxLogs - 1,
                select: { timestamp: true }
            });

            if (oldestToKeep.length > 0) {
                const deletedByCount = await logModel.deleteMany({
                    where: {
                        timestamp: { lt: oldestToKeep[0].timestamp }
                    }
                });
                console.log(`✅ Deleted ${deletedByCount.count} oldest logs to keep count within ${maxLogs}.`);
            }
        }

        console.log("✨ Log maintenance completed.");
    } catch (error) {
        console.error("❌ Log maintenance failed:", error);
    }
}
