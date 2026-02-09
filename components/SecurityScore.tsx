"use client";

import { useEffect, useState } from "react";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface LogData {
    level: string;
}

export default function SecurityScore({ logs }: { logs: LogData[] }) {
    const [score, setScore] = useState(100);
    const [status, setStatus] = useState("Safe");

    useEffect(() => {
        if (!logs || logs.length === 0) {
            setScore(100);
            setStatus("Safe");
            return;
        }

        // Simple scoring algorithm
        // Start at 100
        // Deduct points for recent errors/threats
        let deductions = 0;
        const recentLogs = logs.slice(0, 100); // Analyze last 100 logs

        recentLogs.forEach(log => {
            if (['EMERGENCY', 'ALERT', 'CRITICAL'].includes(log.level)) {
                deductions += 10;
            } else if (['ERROR'].includes(log.level)) {
                deductions += 5;
            } else if (['WARN'].includes(log.level)) {
                deductions += 1;
            }
        });

        // Cap score at 0
        const finalScore = Math.max(0, 100 - deductions);
        setScore(finalScore);

        if (finalScore >= 90) setStatus("Safe");
        else if (finalScore >= 60) setStatus("Warning");
        else setStatus("Critical");

    }, [logs]);

    const getColor = () => {
        if (score >= 90) return "text-green-500";
        if (score >= 60) return "text-orange-500";
        return "text-red-500";
    };

    const getBgColor = () => {
        if (score >= 90) return "bg-green-500/10 border-green-500/20";
        if (score >= 60) return "bg-orange-500/10 border-orange-500/20";
        return "bg-red-500/10 border-red-500/20";
    };

    return (
        <div className={`w-full h-48 rounded-xl border p-6 relative overflow-hidden transition-all duration-500 ${getBgColor()}`}>
            <div className={`absolute top-0 right-0 p-4 opacity-10 pointer-events-none transition-colors duration-500 ${getColor()}`}>
                <Shield size={120} />
            </div>

            <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-black/20 ${getColor()}`}>
                        {score >= 90 ? <ShieldCheck size={16} /> : score >= 60 ? <Shield size={16} /> : <ShieldAlert size={16} />}
                    </div>
                    <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">Health Score</h3>
                </div>

                <div className="flex items-end gap-2">
                    <span className={`text-6xl font-black tracking-tighter transition-colors duration-500 ${getColor()}`}>
                        {score}
                    </span>
                    <span className="text-xl font-bold text-white/40 mb-2">/ 100</span>
                </div>

                <div className="space-y-1">
                    <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ease-out ${score >= 90 ? 'bg-green-500' : score >= 60 ? 'bg-orange-500' : 'bg-red-500'}`}
                            style={{ width: `${score}%` }}
                        />
                    </div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${getColor()}`}>
                        Status: {status}
                    </p>
                </div>
            </div>
        </div>
    );
}
