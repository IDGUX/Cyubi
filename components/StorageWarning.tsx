"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, HardDrive } from "lucide-react";

export default function StorageWarning() {
    const [storage, setStorage] = useState<any>(null);

    const playBeep = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = "sine";
            // 880Hz is A5, a clear warning beep
            osc.frequency.setValueAtTime(880, ctx.currentTime);

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            // Sharp decay for a beep effect
            gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.5);

            // Double beep
            setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gainNode2 = ctx.createGain();
                osc2.type = "sine";
                osc2.frequency.setValueAtTime(880, ctx.currentTime);
                gainNode2.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode2.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
                osc2.connect(gainNode2);
                gainNode2.connect(ctx.destination);
                osc2.start();
                osc2.stop(ctx.currentTime + 0.5);
            }, 200);

        } catch (e) {
            console.error("Audio beep failed", e);
        }
    };

    useEffect(() => {
        let hasBeeped = false;

        const checkStorage = async () => {
            try {
                const res = await fetch("/api/system/storage");
                const data = await res.json();
                setStorage(data);

                if (data.warning && !hasBeeped) {
                    playBeep();
                    hasBeeped = true;
                } else if (!data.warning) {
                    hasBeeped = false; // Reset if usage drops below 80%
                }
            } catch (e) {
                console.error("Failed to check storage", e);
            }
        };

        checkStorage();
        // Check every 2 minutes
        const interval = setInterval(checkStorage, 120000);

        return () => clearInterval(interval);
    }, []);

    if (!storage || !storage.warning) return null;

    return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start sm:items-center gap-4 animate-in slide-in-from-top-4">
            <div className="p-3 bg-red-500/20 rounded-xl shrink-0">
                <AlertTriangle className="text-red-400" size={24} />
            </div>
            <div className="flex-1">
                <h3 className="text-red-400 font-bold text-sm sm:text-base">Kritischer Speicherplatz! (&gt;80% belegt)</h3>
                <div className="text-white/70 text-xs sm:text-sm mt-1 space-y-1">
                    {storage.local && storage.local.usagePercent >= 80 && (
                        <p className="flex items-center gap-2">
                            <HardDrive size={14} /> System Speicher: {Math.round(storage.local.usagePercent)}%
                        </p>
                    )}
                    {storage.usb && storage.usb.usagePercent >= 80 && (
                        <p className="flex items-center gap-2">
                            <HardDrive size={14} /> USB Backup: {Math.round(storage.usb.usagePercent)}%
                        </p>
                    )}
                    <p className="text-red-300 text-xs mt-2 font-medium">Bitte logs löschen oder USB-Speicher leeren, um Ausfälle wie z.B. bei der Internetverbindung zu vermeiden (Out-Of-Memory/Storage).</p>
                </div>
            </div>
        </div>
    );
}
