"use client";

import { useState, useEffect } from "react";
import { Terminal, Clock, Server } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RawLogView() {
    const [rawLogs, setRawLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRaw = async () => {
        try {
            const res = await fetch("/api/logs?limit=100");
            const data = await res.json();
            if (Array.isArray(data)) {
                setRawLogs(data);
            }
        } catch (e) { console.error("Failed to fetch raw logs:", e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchRaw();
        const interval = setInterval(fetchRaw, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Terminal size={20} className="text-blue-400" />
                </div>
                <div>
                    <h2 className="text-xl font-black">Raw Log Stream</h2>
                    <p className="text-xs text-white/40">Echtzeit-Ansicht aller eingehenden Nachrichten</p>
                </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[140px_160px_1fr] p-3 bg-white/5 border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40">
                    <div>Zeitstempel</div>
                    <div>Quelle / Host</div>
                    <div>Nachricht</div>
                </div>

                <div className="max-h-[600px] overflow-y-auto font-mono text-xs">
                    <AnimatePresence mode="popLayout">
                        {rawLogs.map((log) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="grid grid-cols-[140px_160px_1fr] p-3 border-b border-white/5 hover:bg-white/5 transition-colors group"
                            >
                                <div className="text-white/30 flex items-center gap-2">
                                    <Clock size={10} />
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </div>
                                <div className="text-blue-400/80 font-bold flex items-center gap-2 truncate pr-2">
                                    <Server size={10} />
                                    {log.source || log.ipAddress || "?"}
                                </div>
                                <div className="text-white/80 break-all select-all selection:bg-blue-500/30">
                                    {log.message}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {loading && (
                        <div className="p-8 text-center text-white/20 uppercase tracking-widest text-[10px] animate-pulse">
                            Initialisiere Stream...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
