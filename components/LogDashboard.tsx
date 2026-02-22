"use client";

import { useState, useEffect } from "react";
import LogCard from "./LogCard";
import SettingsView from "./settings/SettingsView";
import RawLogView from "./RawLogView";
import LiveLogChart from "./LiveLogChart";
import SecurityScore from "./SecurityScore";
import ShareModal from "./ShareModal";
import StorageWarning from "./StorageWarning";
import AIHealthReport from "./AIHealthReport";
import { Search, Activity, Shield, Settings, List, Terminal, Share2, FileText, CheckCircle, XCircle, Download, X, Link } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useTranslation } from "@/lib/translations";

export default function LogDashboard() {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<any[]>([]);
    const [filter, setFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"LOGS" | "SETTINGS" | "STREAM">("LOGS");
    const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportContent, setReportContent] = useState<string | null>(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [chainStatus, setChainStatus] = useState<{ valid: boolean; totalEvents: number; details: string } | null>(null);
    const [chainRepairing, setChainRepairing] = useState(false);
    const [repairError, setRepairError] = useState<string | null>(null);

    // Verify chain on mount
    useEffect(() => {
        fetch("/api/verify")
            .then(res => res.json())
            .then(data => setChainStatus(data))
            .catch(() => setChainStatus(null));
    }, []);

    const generateReport = async (mode: "last10" | "last50" | "all") => {
        setReportLoading(true);
        try {
            const lastN = mode === "last10" ? 10 : mode === "last50" ? 50 : 100;
            const res = await fetch("/api/reports/incident", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lastN }),
            });
            const data = await res.json();
            if (data.report) {
                setReportContent(data.report);
            }
        } catch (e) {
            console.error("Report generation failed:", e);
        } finally {
            setReportLoading(false);
        }
    };

    const downloadReport = () => {
        if (!reportContent) return;
        const blob = new Blob([reportContent], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cyubi-incident-report-${new Date().toISOString().split("T")[0]}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const fetchLogs = async () => {
        try {
            const params = new URLSearchParams();
            params.append("limit", "1000"); // Increased limit for better stats/charts
            if (search) params.append("search", search);

            const res = await fetch(`/api/logs?${params.toString()}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setLogs(data);
            } else {
                setLogs([]);
            }
        } catch (e) {
            console.error("Failed to fetch logs:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(() => {
            if (!chainRepairing) fetchLogs();
        }, 5000);
        return () => clearInterval(interval);
    }, [chainRepairing]);

    const filteredLogs = logs.filter(log => {
        if (!log) return false;
        const matchesCategory = filter === "ALL" || log.category === filter;

        const message = (log.message || "").toLowerCase();
        const interpretation = (log.interpretation || "").toLowerCase();
        const source = (log.source || "").toLowerCase();
        const ip = (log.ipAddress || "").toLowerCase();
        const searchTerm = search.toLowerCase();

        const matchesSearch = message.includes(searchTerm) ||
            interpretation.includes(searchTerm) ||
            source.includes(searchTerm) ||
            ip.includes(searchTerm);

        return matchesCategory && matchesSearch;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="space-y-4">
                <StorageWarning />
                <AIHealthReport />
            </div>

            {/* View Switcher & Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white/5 border border-white/10 p-2 rounded-2xl gap-4">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setView("LOGS")}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${view === "LOGS" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-white/40 hover:text-white"}`}
                    >
                        <List size={18} /> {t("logs")}
                    </button>
                    <button
                        onClick={() => setView("STREAM")}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${view === "STREAM" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "text-white/40 hover:text-white"}`}
                    >
                        <Terminal size={18} /> {t("stream")}
                    </button>
                    <button
                        onClick={() => setView("SETTINGS")}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${view === "SETTINGS" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-white/40 hover:text-white"}`}
                    >
                        <Settings size={18} /> {t("settings")}
                    </button>
                </div>

                <div className="relative flex items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
                    {/* Incident Report Button */}
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white/40 hover:text-white hover:bg-orange-500/10 transition-all border border-transparent hover:border-orange-500/20"
                        title="Incident Report"
                    >
                        <FileText size={18} />
                        <span className="hidden sm:inline">Report</span>
                    </button>

                    {/* Chain Status Indicator */}
                    {chainStatus && (
                        <button
                            onClick={async () => {
                                if (chainStatus.valid || chainRepairing) return;
                                setChainRepairing(true);
                                setRepairError(null);
                                try {
                                    const backfillRes = await fetch("/api/verify/backfill", { method: "POST" });
                                    if (!backfillRes.ok) {
                                        const err = await backfillRes.json().catch(() => ({}));
                                        throw new Error(err.detail || "Backfill failed");
                                    }
                                    const res = await fetch("/api/verify");
                                    setChainStatus(await res.json());
                                } catch (err: any) {
                                    console.error("Repair failed:", err);
                                    setRepairError(err?.message || "Repair failed");
                                    setTimeout(() => setRepairError(null), 5000);
                                } finally {
                                    setChainRepairing(false);
                                }
                            }}
                            disabled={chainRepairing}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${repairError
                                ? "text-orange-400/80 bg-orange-500/5 border border-orange-500/10"
                                : chainStatus.valid
                                    ? "text-green-400/80 bg-green-500/5 border border-green-500/10"
                                    : "text-red-400/80 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 cursor-pointer"
                                }`}
                            title={repairError || (chainStatus.valid ? "Hash chain intact" : "Click to repair hash chain")}
                        >
                            {chainRepairing ? (
                                <div className="w-3.5 h-3.5 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                            ) : repairError ? <XCircle size={14} className="text-orange-400" /> : chainStatus.valid ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            <span className="hidden sm:inline">
                                {chainRepairing ? "Repairing..." : repairError ? "Error" : chainStatus.valid ? "Chain OK" : "Chain Broken"}
                            </span>
                            <Link size={12} />
                        </button>
                    )}
                    {/* Public Share Button */}
                    <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white/40 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/5"
                        title={t("share")}
                    >
                        <Share2 size={18} />
                        <span>{t("share")}</span>
                    </button>

                    <button
                        onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${isAdminMenuOpen ? "bg-white/10 text-white" : "text-red-400/60 hover:text-red-400 hover:bg-red-500/10"}`}
                    >
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                        <span className="truncate">{t("masterAdmin")}</span>
                    </button>

                    <AnimatePresence>
                        {isAdminMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40 bg-transparent"
                                    onClick={() => setIsAdminMenuOpen(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-2 w-56 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 overflow-hidden top-full"
                                >
                                    <div className="px-3 py-2 mb-1">
                                        <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{t("adminControls")}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setView("SETTINGS");
                                            setIsAdminMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-all text-left group"
                                    >
                                        <div className="p-1.5 bg-white/5 rounded-lg group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
                                            <Settings size={14} />
                                        </div>
                                        <div>
                                            <p>{t("settings")}</p>
                                            <p className="text-[9px] text-white/20 font-medium">{t("systemSecurity")}</p>
                                        </div>
                                    </button>
                                    <div className="h-px bg-white/5 my-1" />
                                    <button
                                        onClick={async () => {
                                            await fetch("/api/auth", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ action: "logout" })
                                            });
                                            window.location.href = "/login";
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-500/10 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 transition-all text-left group"
                                    >
                                        <div className="p-1.5 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                                            <Shield size={14} />
                                        </div>
                                        <div>
                                            <p>{t("logout")}</p>
                                            <p className="text-[9px] text-white/20 font-medium">{t("endSession")}</p>
                                        </div>
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {view === "LOGS" && (
                <>
                    {/* Viral Features: Live Graph & Score */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <LiveLogChart logs={logs} />
                        </div>
                        <div>
                            <SecurityScore logs={logs} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                                <input
                                    type="text"
                                    placeholder={t("searchLogs")}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-2 sm:py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-white/20 transition-all"
                                />
                            </div>

                            <div className="flex flex-wrap justify-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl w-full md:w-auto">
                                {["ALL", "Security", "Config", "System"].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilter(cat)}
                                        className={`flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${filter === cat ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
                                    >
                                        {cat === "ALL" ? t("all") : cat === "Security" ? t("security") : cat === "Config" ? t("config") : t("system")}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {filteredLogs.map((log) => (
                                    <motion.div
                                        key={log.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <LogCard log={log} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {!loading && filteredLogs.length === 0 && (
                                <div className="text-center py-20 glass-card rounded-3xl border-dashed border-2 border-white/5">
                                    <p className="text-white/20 font-black tracking-widest uppercase">{t("noEntries")}</p>
                                </div>
                            )}
                            {loading && logs.length === 0 && (
                                <div className="flex justify-center py-20">
                                    <div className="w-8 h-8 border-4 border-white/10 border-t-white/30 rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {view === "STREAM" && <RawLogView />}
            {view === "SETTINGS" && <SettingsView />}

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                logs={filteredLogs.slice(0, 100)}
            />

            {/* Incident Report Modal */}
            <AnimatePresence>
                {isReportModalOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            onClick={() => { setIsReportModalOpen(false); setReportContent(null); }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-4 sm:inset-10 z-50 bg-[#0a0a0f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-500/10 rounded-xl">
                                        <FileText size={20} className="text-orange-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-white">Incident Report Generator</h2>
                                        <p className="text-[10px] text-white/30 font-medium">Forensischer Vorfallsbericht mit Hash-Chain-Verifizierung</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setIsReportModalOpen(false); setReportContent(null); }}
                                    className="p-2 hover:bg-white/5 rounded-xl transition-all"
                                >
                                    <X size={20} className="text-white/40" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {!reportContent ? (
                                    <div className="max-w-md mx-auto space-y-6 py-10">
                                        <div className="text-center space-y-2">
                                            <p className="text-white/60 text-sm">Wähle den Zeitraum für den Incident Report:</p>
                                        </div>
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => generateReport("last10")}
                                                disabled={reportLoading}
                                                className="w-full px-6 py-4 bg-white/5 hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/20 rounded-2xl text-left transition-all group"
                                            >
                                                <p className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">Letzte 10 Events</p>
                                                <p className="text-[10px] text-white/30">Schnellübersicht der aktuellsten Ereignisse</p>
                                            </button>
                                            <button
                                                onClick={() => generateReport("last50")}
                                                disabled={reportLoading}
                                                className="w-full px-6 py-4 bg-white/5 hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/20 rounded-2xl text-left transition-all group"
                                            >
                                                <p className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">Letzte 50 Events</p>
                                                <p className="text-[10px] text-white/30">Detaillierter Vorfallsbericht</p>
                                            </button>
                                            <button
                                                onClick={() => generateReport("all")}
                                                disabled={reportLoading}
                                                className="w-full px-6 py-4 bg-white/5 hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/20 rounded-2xl text-left transition-all group"
                                            >
                                                <p className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">Alle Events (max. 100)</p>
                                                <p className="text-[10px] text-white/30">Vollständiger forensischer Report</p>
                                            </button>
                                        </div>
                                        {reportLoading && (
                                            <div className="flex justify-center py-4">
                                                <div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-400 rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <pre className="bg-white/5 border border-white/10 rounded-2xl p-6 text-xs text-white/80 font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed">
                                            {reportContent}
                                        </pre>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {reportContent && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                                    <button
                                        onClick={() => setReportContent(null)}
                                        className="px-4 py-2 text-xs font-bold text-white/40 hover:text-white transition-all"
                                    >
                                        ← Zurück
                                    </button>
                                    <button
                                        onClick={downloadReport}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-xl text-xs font-bold text-orange-400 transition-all"
                                    >
                                        <Download size={14} />
                                        Download (.md)
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
