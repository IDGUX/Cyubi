import { NextResponse } from "next/server";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // 1. Check local storage (where the root / is mounted)
        const localStats = await fs.statfs("/");
        const localTotal = localStats.blocks * localStats.bsize;
        const localFree = localStats.bfree * localStats.bsize;
        const localUsagePercent = ((localTotal - localFree) / localTotal) * 100;

        let usbUsagePercent = null;
        let usbTotal = null;
        let usbFree = null;

        // 2. Check USB storage if enabled
        const settings = await prisma.setting.findMany({
            where: { key: { in: ["USB_AUTO_SYNC", "USB_PATH"] } }
        });
        const config = settings.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});

        if (config.USB_AUTO_SYNC === "true" && config.USB_PATH) {
            try {
                // Ensure the path exists before checking statfs
                await fs.access(config.USB_PATH);
                const usbStats = await fs.statfs(config.USB_PATH);
                usbTotal = usbStats.blocks * usbStats.bsize;
                usbFree = usbStats.bfree * usbStats.bsize;
                usbUsagePercent = ((usbTotal - usbFree) / usbTotal) * 100;
            } catch (usbError: any) {
                console.warn(`Could not assess USB path ${config.USB_PATH}:`, usbError.message);
            }
        }

        const isWarning = localUsagePercent >= 80 || (usbUsagePercent !== null && usbUsagePercent >= 80);

        return NextResponse.json({
            local: {
                total: localTotal,
                free: localFree,
                usagePercent: localUsagePercent
            },
            usb: usbUsagePercent !== null ? {
                total: usbTotal,
                free: usbFree,
                usagePercent: usbUsagePercent
            } : null,
            warning: isWarning
        });
    } catch (error: any) {
        console.error("Failed to check storage:", error.message);
        return NextResponse.json({ error: "Failed to check storage", detail: error.message }, { status: 500 });
    }
}
