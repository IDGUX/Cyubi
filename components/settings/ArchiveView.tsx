"use client";

import { useState, useEffect } from "react";
import { Download, Calendar, Database } from "lucide-react";
import { useTranslation } from "@/lib/translations";

export default function ArchiveView() {
    const { t } = useTranslation();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [isDownloading, setIsDownloading] = useState(false);
    const [lastDownload, setLastDownload] = useState<string | null>(null);

    useEffect(() => {
        // Fetch the last archive download date
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                if (data.LAST_ARCHIVE_DOWNLOAD) {
                    setLastDownload(data.LAST_ARCHIVE_DOWNLOAD);
                }
            })
            .catch(() => { });
    }, []);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const url = `/api/logs/archive?month=${month}&year=${year}`;

            // Just redirecting to trigger standard browser download
            // The API sets Content-Disposition
            window.location.href = url;

            // Optimistically update last download
            setLastDownload(new Date().toISOString());
        } catch (e) {
            console.error("Archive download failed", e);
        } finally {
            setTimeout(() => setIsDownloading(false), 2000);
        }
    };

    return (
        <div className="space-y-4 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 mb-2">
                <Database size={14} className="text-blue-400" />
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">Manuelles Log-Archiv</h3>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                <p className="text-[10px] text-white/50">Lade alle Logs eines bestimmten Zeitraums als Datei herunter, um sie extern zu sichern (Compliance & Backup).</p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 flex gap-2">
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                        >
                            <option value={1}>Januar</option>
                            <option value={2}>Februar</option>
                            <option value={3}>März</option>
                            <option value={4}>April</option>
                            <option value={5}>Mai</option>
                            <option value={6}>Juni</option>
                            <option value={7}>Juli</option>
                            <option value={8}>August</option>
                            <option value={9}>September</option>
                            <option value={10}>Oktober</option>
                            <option value={11}>November</option>
                            <option value={12}>Dezember</option>
                        </select>
                        <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                        <Download size={14} />
                        {isDownloading ? "Wird geladen..." : "Archiv laden"}
                    </button>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-white/30 pt-2 border-t border-white/5">
                    <Calendar size={12} />
                    <span>Letztes Backup: {lastDownload ? new Date(lastDownload).toLocaleString("de-DE") : "Noch nie"}</span>
                </div>
            </div>
        </div>
    );
}
