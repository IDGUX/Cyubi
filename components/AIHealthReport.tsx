"use client";

import { useState, useEffect } from "react";
import { Sparkles, Activity, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";

export default function AIHealthReport({ onSearch }: { onSearch?: (query: string) => void }) {
    const [report, setReport] = useState<string | null>(null);
    const [status, setStatus] = useState<"healthy" | "warning" | "critical" | "unknown">("unknown");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReport = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/ai/health");
            const data = await res.json();

            if (data.error) {
                setError(data.error);
                return;
            }

            setReport(data.report);
            setStatus(data.status);
        } catch (e) {
            setError("Failed to generate AI health report");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
        // Refresh every 1 hour automatically
        const interval = setInterval(fetchReport, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColors = () => {
        switch (status) {
            case "healthy": return "border-green-500/30 bg-green-500/10 text-green-400";
            case "warning": return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
            case "critical": return "border-red-500/30 bg-red-500/10 text-red-400";
            default: return "border-white/10 bg-white/5 text-white/50";
        }
    };

    const StatusIcon = status === "healthy" ? ShieldCheck : status === "critical" ? AlertTriangle : Activity;

    // Parses the report to make [Timestamp] IP: clickable
    const renderReport = (text: string) => {
        if (!onSearch) return <p className="text-sm font-medium mt-1 leading-relaxed opacity-90">{text}</p>;

        const parts = text.split(/(-\s*\[\s*\d{4}-\d{2}-\d{2}T.*?Z\s*\].*)/gi);

        return (
            <div className="text-sm font-medium mt-1 leading-relaxed opacity-90 space-y-2">
                {parts.map((part, i) => {
                    if (part.trim().startsWith("- [") || part.trim().startsWith("-[")) {
                        // Extract the IP or Source to search for
                        const match = part.match(/\[(.*?)\]\s*([^:]+):/);
                        const searchQuery = match ? `${match[2].trim()}` : part.replace(/-\s*\[.*?\]/, "").trim();

                        return (
                            <button
                                key={i}
                                onClick={() => {
                                    if (onSearch) onSearch(searchQuery);
                                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                                }}
                                className="block w-full text-left p-2 rounded-xl bg-black/20 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group flex items-start gap-2"
                            >
                                <span className="text-purple-400 mt-0.5"><Sparkles size={14} className="group-hover:scale-110 transition-transform" /></span>
                                <span className="text-white/80 group-hover:text-white">{part.replace(/^-\s*/, '')}</span>
                            </button>
                        );
                    }
                    return <span key={i}>{part}</span>;
                })}
            </div>
        );
    };

    return (
        <div className={`p-5 rounded-2xl border transition-all ${getStatusColors()} relative overflow-hidden group`}>
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] rounded-full opacity-20 pointer-events-none 
                ${status === "healthy" ? "bg-green-500" : status === "warning" ? "bg-yellow-500" : status === "critical" ? "bg-red-500" : "bg-white"}
            `} />

            <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="flex gap-4 items-start w-full">
                    <div className="p-2 bg-black/20 rounded-xl shrink-0">
                        <StatusIcon size={24} />
                    </div>
                    <div className="w-full">
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-sm font-black uppercase tracking-widest">AI Health Monitor</h2>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/20 border border-white/10">
                                <Sparkles size={10} className="text-purple-400" />
                                <span className="text-[8px] font-bold text-white/60 uppercase">Token-Optimized</span>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                <p className="text-xs opacity-70">KI analysiert Netzwerkstatus...</p>
                            </div>
                        ) : error ? (
                            <p className="text-xs opacity-70 mt-1">{error} (KI evtl. nicht konfiguriert)</p>
                        ) : report ? (
                            renderReport(report)
                        ) : (
                            <p className="text-xs opacity-70 mt-1">Lade Systemstatus...</p>
                        )}
                    </div>
                </div>

                <button
                    onClick={fetchReport}
                    disabled={isLoading}
                    className="p-2 bg-black/20 hover:bg-black/40 rounded-xl transition-all disabled:opacity-50 shrink-0"
                    title="Aktualisieren"
                >
                    <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                </button>
            </div>
        </div>
    );
}
