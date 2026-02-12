"use client";

import { X, Copy, Check, Share2, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { anonymizeLog } from "./ShareUtil";
import type { LogEvent } from "@/lib/types";
import { useTranslation } from "@/lib/translations";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: LogEvent[];
}

export default function ShareModal({ isOpen, onClose, logs }: ShareModalProps) {
    const { t } = useTranslation();
    const [content, setContent] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (logs.length > 0) {
            const text = logs.map(l => anonymizeLog(l)).join("\n\n---\n\n");
            setContent(text + "\n\nShared via Cyubi 🛡️");
        }
    }, [logs]);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            // Fallback
            try {
                const textArea = document.createElement("textarea");
                textArea.value = content;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (e) {
                alert(t("copyFailed"));
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#09090b] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-2">
                        <Share2 size={18} className="text-purple-400" />
                        <h3 className="font-bold text-sm">Anonymized Share</h3>
                        <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Shield size={10} /> Safe for Public
                        </span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <p className="text-sm text-white/60">
                        {t("shareAnonymizedHint")}
                    </p>

                    <div className="relative">
                        <div className="absolute top-2 right-2 flex gap-2">
                            <button
                                onClick={copyToClipboard}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all border border-white/10"
                            >
                                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                {copied ? t("copied") : t("copy")}
                            </button>
                        </div>
                        <textarea
                            readOnly
                            value={content}
                            className="w-full h-64 bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-xs text-blue-300 resize-none focus:outline-none"
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 bg-white/5 flex justified-end">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-all"
                    >
                        {t("close")}
                    </button>
                </div>
            </div>
        </div>
    );
}
