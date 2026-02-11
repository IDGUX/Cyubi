"use client";

import { Monitor, Plus, Shield, Trash2 } from "lucide-react";
import type { UseSettingsReturn } from "./useSettings";

type Props = Pick<UseSettingsReturn,
    | "t"
    | "sources" | "unknownSources"
    | "newSourceName" | "setNewSourceName"
    | "newSourceIp" | "setNewSourceIp"
    | "isCreatingSource" | "createSource" | "deleteSource" | "isOnline"
>;

export default function SourcesTab(props: Props) {
    const {
        t, sources, unknownSources,
        newSourceName, setNewSourceName,
        newSourceIp, setNewSourceIp,
        isCreatingSource, createSource, deleteSource, isOnline,
    } = props;

    return (
        <section className="glass-card p-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
                    <Monitor size={20} className="text-green-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold">{t("registeredDevices")}</h2>
                    <p className="text-sm text-white/40">{t("devicesDesc")}</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Add Source Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("deviceName")}</label>
                        <input type="text" value={newSourceName} onChange={(e) => setNewSourceName(e.target.value)} placeholder="e.g. Gateway" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-500/50 transition-colors" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("ipAddress")}</label>
                        <div className="flex gap-2">
                            <input type="text" value={newSourceIp} onChange={(e) => setNewSourceIp(e.target.value)} placeholder="192.168.1.1" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-500/50 transition-colors" />
                            <button onClick={createSource} disabled={isCreatingSource} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-xl h-[38px] w-[38px] flex items-center justify-center transition-all shadow-lg shadow-green-500/20 disabled:opacity-50">
                                {isCreatingSource ? (
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Plus size={20} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Source List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.isArray(sources) && sources.map((s) => {
                        const online = isOnline(s.lastSeen);
                        return (
                            <div key={s.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-white/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black relative ${online ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                        {(s.name || "?").substring(0, 1).toUpperCase()}
                                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a0a0b] ${online ? "bg-green-500 animate-pulse" : "bg-red-500"}`} title={online ? "Online" : "Offline"} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm tracking-tight flex items-center gap-2">{s.name}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-white/30 font-mono bg-black/40 px-1.5 py-0.5 rounded leading-none">{s.ipAddress}</span>
                                            <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
                                                {s.lastSeen ? `${t("lastSeen")}: ${new Date(s.lastSeen).toLocaleTimeString()}` : t("neverSeen")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => deleteSource(s.id)} className="p-2 text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                            </div>
                        );
                    })}
                    {sources.length === 0 && (
                        <div className="col-span-full text-center py-12 text-white/10 border-2 border-dashed border-white/5 rounded-3xl">{t("noDevicesConfigured")}</div>
                    )}
                </div>

                {/* Unknown Sources */}
                {unknownSources.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-white/5">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield size={16} className="text-orange-400" />
                            <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">{t("unknownDevicesDetected")}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {unknownSources.map(ip => (
                                <div key={ip} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-none mb-1">{t("sourceIP")}</span>
                                        <span className="text-xs font-mono font-bold text-orange-300">{ip}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setNewSourceIp(ip);
                                            setNewSourceName(`${t("devicePrefix")}_${ip.split('.').pop()}`);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-orange-500/20 transition-all"
                                    >
                                        {t("add")}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
