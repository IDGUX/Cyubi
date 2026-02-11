import { NextResponse } from "next/server";
import { verifyChain } from "@/lib/integrity";

/**
 * GET /api/verify
 * Verifies the integrity of the entire hash chain.
 * Returns whether the chain is intact and details about any breakage.
 */
export async function GET() {
    try {
        const result = await verifyChain();

        return NextResponse.json(result, {
            status: result.valid ? 200 : 409,
        });
    } catch (error: any) {
        console.error("Chain verification error:", error.message);
        return NextResponse.json(
            { error: "Verification failed", detail: error.message },
            { status: 500 }
        );
    }
}
