"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";
import { useTranslation } from "@/lib/translations";

interface LogData {
    timestamp: string;
    level: string;
}

interface ChartData {
    time: string;
    total: number;
    errors: number;
}

export default function LiveLogChart({ logs }: { logs: LogData[] }) {
    const { t } = useTranslation();
    const [data, setData] = useState<ChartData[]>([]);

    useEffect(() => {
        // Group logs by minute (last 15 minutes)
        const now = new Date();
        const groups: Record<string, { total: number; errors: number }> = {};

        // Initialize last 15 minutes with 0
        for (let i = 14; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 60000);
            const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            groups[timeStr] = { total: 0, errors: 0 };
        }

        if (logs && logs.length > 0) {
            logs.forEach(log => {
                const d = new Date(log.timestamp);
                // Only consider logs from last 15 mins
                if (now.getTime() - d.getTime() > 15 * 60000) return;

                const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                if (groups[timeStr]) {
                    groups[timeStr].total += 1;
                    if (['ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY', 'WARN'].includes(log.level)) {
                        groups[timeStr].errors += 1;
                    }
                }
            });
        }

        const formattedData = Object.entries(groups).map(([time, val]) => ({
            time,
            total: val.total,
            errors: val.errors
        }));

        setData(formattedData);
    }, [logs]);

    if (!logs || logs.length === 0) return null;

    return (
        <div className="w-full h-48 bg-black/20 rounded-xl border border-white/5 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Activity size={100} />
            </div>
            <div className="flex items-center gap-2 mb-4 relative z-10">
                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <Activity size={16} className="text-blue-400" />
                </div>
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">{t("logVolume")}</h3>
            </div>
            <div className="w-full h-[calc(100%-2rem)] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="rgba(255,255,255,0.2)"
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            interval={4}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                            name={t("total")}
                            animationDuration={1000}
                        />
                        <Area
                            type="monotone"
                            dataKey="errors"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorError)"
                            name={t("errors")}
                            animationDuration={1000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
