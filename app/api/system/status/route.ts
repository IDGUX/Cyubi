import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
    try {
        const logPath = "/tmp/receiver.log";
        let logContent = "No log file found.";

        if (fs.existsSync(logPath)) {
            // Get last 100 lines
            const content = fs.readFileSync(logPath, "utf-8");
            const lines = content.split("\n");
            logContent = lines.slice(-100).join("\n");
        }

        return NextResponse.json({
            status: "ready",
            timestamp: new Date().toISOString(),
            receiverLog: logContent,
            cwd: process.cwd()
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
