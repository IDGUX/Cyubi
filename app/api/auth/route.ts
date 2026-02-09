import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { password, action } = body;

        console.log(`[AUTH API] Action: ${action}, Protocol: ${req.nextUrl.protocol}`);

        // Check if master password exists
        const passwordSetting = await prisma.setting.findUnique({
            where: { key: "MASTER_PASSWORD_HASH" }
        });

        if (action === "setup") {
            // First-time setup
            if (passwordSetting) {
                return NextResponse.json({ error: "Password already set" }, { status: 400 });
            }

            const hash = await bcrypt.hash(password, 10);
            await prisma.setting.create({
                data: {
                    key: "MASTER_PASSWORD_HASH",
                    value: hash
                }
            });

            // Create session token
            const token = jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: "7d" });

            const response = NextResponse.json({ success: true, setup: true });
            const isSecure = req.nextUrl.protocol === "https:";
            console.log(`[AUTH API] Setting cookie. Secure: ${isSecure}`);

            response.cookies.set("auth-token", token, {
                httpOnly: true,
                secure: isSecure,
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            return response;
        }

        if (action === "login") {
            // Regular login
            if (!passwordSetting) {
                return NextResponse.json({ error: "No password set", needsSetup: true }, { status: 401 });
            }

            const isValid = await bcrypt.compare(password, passwordSetting.value);
            if (!isValid) {
                return NextResponse.json({ error: "Invalid password" }, { status: 401 });
            }

            // Create session token
            const token = jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: "7d" });

            const response = NextResponse.json({ success: true, login: true });
            const isSecure = req.nextUrl.protocol === "https:";
            console.log(`[AUTH API] Setting cookie. Secure: ${isSecure}`);

            response.cookies.set("auth-token", token, {
                httpOnly: true,
                secure: isSecure,
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            return response;
        }

        if (action === "logout") {
            const response = NextResponse.json({ success: true });
            response.cookies.delete("auth-token");
            return response;
        }

        if (action === "change-password") {
            const { currentPassword, newPassword } = body;

            if (!passwordSetting) {
                return NextResponse.json({ error: "No password set" }, { status: 401 });
            }

            const isValid = await bcrypt.compare(currentPassword, passwordSetting.value);
            if (!isValid) {
                return NextResponse.json({ error: "Aktuelles Passwort ist falsch" }, { status: 401 });
            }

            const hash = await bcrypt.hash(newPassword, 10);
            await prisma.setting.update({
                where: { key: "MASTER_PASSWORD_HASH" },
                data: { value: hash }
            });

            return NextResponse.json({ success: true, message: "Passwort erfolgreich geändert" });
        }

        if (action === "check") {
            const token = req.cookies.get("auth-token")?.value;
            let authenticated = false;

            if (token) {
                try {
                    jwt.verify(token, JWT_SECRET);
                    authenticated = true;
                    console.log("[AUTH API] Check: Valid token found");
                } catch (e) {
                    console.log("[AUTH API] Check: Invalid token");
                }
            } else {
                console.log("[AUTH API] Check: No token found");
            }

            return NextResponse.json({
                needsSetup: !passwordSetting,
                authenticated
            });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("Auth error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        // Check authentication status
        const token = req.cookies.get("auth-token")?.value;

        if (!token) {
            return NextResponse.json({ authenticated: false });
        }

        try {
            jwt.verify(token, JWT_SECRET);
            return NextResponse.json({ authenticated: true });
        } catch {
            return NextResponse.json({ authenticated: false });
        }
    } catch (error) {
        return NextResponse.json({ authenticated: false });
    }
}
