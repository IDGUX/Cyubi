import { Shield, Settings, Activity, Info, Monitor, Apple, ShieldAlert, ShieldCheck, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/lib/translations";
import { enUS, de } from "date-fns/locale";
import { format } from "date-fns";
import { useState } from "react";

interface Log {
    id: string;
    timestamp: string | Date;
    level: string;
    source: string;
    message: string;
    interpretation?: string;
    category?: string;
    deviceType?: string;
    ipAddress?: string;
    isAiAnalyzed?: boolean;
    repeatCount?: number;
}

const categoryIcons: Record<string, any> = {
    Security: Shield,
    Config: Settings,
    System: Activity,
    Info: Info,
};

const deviceIcons: Record<string, any> = {
    Windows: Monitor,
    macOS: Apple,
};

const levelColors: Record<string, string> = {
    ERROR: "text-red-400 border-red-500/50 bg-red-500/10",
    WARN: "text-yellow-400 border-yellow-500/50 bg-yellow-500/10",
    INFO: "text-blue-400 border-blue-500/50 bg-blue-500/10",
};

export default function LogCard({ log: initialLog }: { log: Log }) {
    const { t, language } = useTranslation();
    const [log, setLog] = useState(initialLog);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const Icon = categoryIcons[log.category || "Info"] || Info;
    const DeviceIcon = deviceIcons[log.deviceType || ""] || null;
    const colorClass = levelColors[log.level] || levelColors.INFO;

    const analyzeWithAi = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsAnalyzing(true);
        try {
            const res = await fetch("/api/analyze/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: log.message, source: log.source, saveRule: true })
            });
            const result = await res.json();
            if (result && !result.error) {
                setLog({
                    ...log,
                    interpretation: result.interpretation,
                    category: result.category,
                    deviceType: result.deviceType,
                    isAiAnalyzed: true
                });
            }
        } catch (e) {
            console.error("AI Analysis failed", e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="glass-card p-4 transition-all hover:border-white/20 group animate-in fade-in slide-in-from-left-4 duration-300 relative overflow-hidden">
            {/* AI Active Glow */}
            {log.isAiAnalyzed && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[40px] rounded-full -mr-16 -mt-16 pointer-events-none" />
            )}

            <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${colorClass} border transition-colors duration-500`}>
                        <Icon size={20} />
                    </div>
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            {DeviceIcon && (
                                <div className="p-1 bg-white/5 rounded border border-white/10 group-hover:border-white/20 transition-colors">
                                    <DeviceIcon size={12} className="text-white/40 group-hover:text-white/60 transition-colors" />
                                </div>
                            )}
                            <span className="font-bold text-sm tracking-wide text-white/90">{log.source}</span>
                            <span className="text-[10px] text-white/40 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                {t(log.deviceType || "unknownDevice")}
                            </span>
                            {log.ipAddress && (
                                <span className="text-[10px] text-white/40 font-mono bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/20">
                                    {t("ipAddress")}: {log.ipAddress}
                                </span>
                            )}
                            {(log.repeatCount ?? 0) > 0 && (
                                <span className="text-[10px] text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/30 animate-pulse" title="Dieses Log wurde mehrfach in kurzer Zeit empfangen und zusammengefasst, um Datenbank-Spam zu verhindern.">
                                    Wiederholt: {log.repeatCount}x
                                </span>
                            )}
                            <span className="text-[10px] text-white/20">•</span>
                            <span className="text-[10px] text-white/40 font-mono">
                                {(() => {
                                    try {
                                        const d = new Date(log.timestamp);
                                        return isNaN(d.getTime()) ? "--:--:--" : format(d, "HH:mm:ss", { locale: language === "de" ? de : enUS });
                                    } catch (e) {
                                        return "--:--:--";
                                    }
                                })()}
                            </span>

                            {/* AI Badges & Trigger */}
                            {log.isAiAnalyzed ? (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 animate-in zoom-in duration-300">
                                    <Sparkles size={10} />
                                    <span className="text-[9px] font-black uppercase tracking-tighter">{t("aiVerified")}</span>
                                </div>
                            ) : (
                                <button
                                    onClick={analyzeWithAi}
                                    disabled={isAnalyzing}
                                    className={`transition-all flex items-center gap-1.5 px-2 py-0.5 rounded-full border group/ai ${isAnalyzing
                                        ? "bg-purple-500/20 border-purple-500/40 text-purple-400 animate-pulse"
                                        : "bg-white/5 border-white/10 text-white/40 hover:bg-purple-500/20 hover:border-purple-500/40 hover:text-purple-400"
                                        }`}
                                >
                                    {isAnalyzing ? (
                                        <Loader2 size={10} className="animate-spin" />
                                    ) : (
                                        <Sparkles size={10} className="group-hover/ai:animate-pulse" />
                                    )}
                                    <span className="text-[9px] font-black uppercase tracking-tighter">
                                        {isAnalyzing ? "Analyzing..." : t("aiAnalysis")}
                                    </span>
                                </button>
                            )}
                        </div>
                        <p className={`text-sm font-medium leading-relaxed transition-colors duration-500 ${log.isAiAnalyzed ? "text-purple-100" : "text-white/80"}`}>
                            {log.interpretation || log.message}
                        </p>
                        {(log.interpretation || log.isAiAnalyzed) && (
                            <p className="text-[10px] text-white/20 font-mono mt-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                                Raw Log: {log.message}
                            </p>
                        )}
                    </div>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${colorClass} shadow-lg shadow-black/20 shrink-0`}>
                    {log.level}
                </div>
            </div>
        </div>
    );
}
