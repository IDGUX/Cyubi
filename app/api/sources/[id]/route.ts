import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        console.log(`DEBUG: DELETE /api/sources/${id} requested`);

        // Robust model discovery
        const availableKeys = Object.keys(prisma);
        const modelName = availableKeys.find(k => k.toLowerCase() === "syslogsource") || "syslogSource";
        const model = (prisma as any)[modelName];

        if (!model) {
            console.error("DEBUG: SyslogSource model not found for deletion");
            throw new Error(`Model 'SyslogSource' not found.`);
        }

        const result = await model.delete({
            where: { id }
        });
        console.log(`DEBUG: Deleted source ${id}, result:`, result);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to delete source:", error.message);
        return NextResponse.json({ error: "Failed to delete source", detail: error.message }, { status: 500 });
    }
}
