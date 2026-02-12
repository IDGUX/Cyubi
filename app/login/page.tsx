"use client";

import { useState, useEffect } from "react";
import { Lock, Shield, Eye, EyeOff, Activity, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { useTranslation } from "@/lib/translations";

export default function LoginPage() {
    const { t } = useTranslation();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [needsSetup, setNeedsSetup] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const res = await fetch("/api/auth?action=check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "check" })
            });
            const data = await res.json();

            if (data.authenticated) {
                window.location.href = "/";
                return;
            }

            setNeedsSetup(data.needsSetup);
            setLoading(false);
        } catch (e) {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (needsSetup && password !== confirmPassword) {
            setError(t("passwordsDoNotMatch"));
            return;
        }

        if (password.length < 6) {
            setError(t("passwordTooShort"));
            return;
        }

        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    password,
                    action: needsSetup ? "setup" : "login"
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || t("authFailed"));
                return;
            }

            // Success - redirect to dashboard
            window.location.href = "/";
        } catch (e) {
            setError(t("connError"));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-white/20 font-black tracking-widest uppercase text-xs">{t("initializingExpertSystem")}</span>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
            {/* Background decoration consistent with dashboard */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 blur-[150px] rounded-full" />
            </div>

            <div className="w-full max-w-[420px] space-y-8 relative z-10">
                {/* Header/Logo */}
                <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-2xl">
                            <Shield className="text-white/80" size={32} />
                        </div>
                        <div className="text-left">
                            <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">
                                Cyu<span className="text-white/40">bi</span>
                            </h1>
                            <p className="text-[10px] text-white/30 font-bold tracking-[0.3em] uppercase">
                                {t("systemSecurity")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Login Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="glass-card p-8 md:p-10 relative group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <Lock size={18} className="text-blue-400" />
                        </div>
                        <h2 className="text-lg font-bold tracking-tight">
                            {needsSetup ? t("terminalSetup") : t("adminLogin")}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-1">
                                    {needsSetup ? t("setMasterPassword") : t("authKey")}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-500/30 transition-all font-mono tracking-widest"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {needsSetup && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    className="space-y-2"
                                >
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-1">
                                        {t("confirmKey")}
                                    </label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-500/30 transition-all font-mono tracking-widest"
                                    />
                                </motion.div>
                            )}
                        </div>

                        {error && (
                            <motion.div
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                <p className="text-xs font-bold text-red-400">{error}</p>
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            className="group relative w-full bg-white text-black py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-white/90 active:scale-[0.98] overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {needsSetup ? t("completeSetup") : t("requestAccess")}
                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </form>
                </motion.div>

                {/* Footer Info */}
                <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
                    <div className="flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{t("authServerActive")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield size={10} className="text-white/20" />
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{t("tlsEncrypted")}</span>
                        </div>
                    </div>
                    <p className="text-[9px] text-white/10 font-medium uppercase tracking-[0.4em]">
                        Cyubi Security Framework v1.0.4
                    </p>
                </div>
            </div>
        </main>
    );
}
