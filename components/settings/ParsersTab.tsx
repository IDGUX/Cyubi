"use client";

import { Activity, Plus, Trash2 } from "lucide-react";
import type { UseSettingsReturn } from "./useSettings";

type Props = Pick<UseSettingsReturn,
    | "t"
    | "parsers" | "newParser" | "setNewParser"
    | "createParser" | "deleteParser"
>;

export default function ParsersTab(props: Props) {
    const { t, parsers, newParser, setNewParser, createParser, deleteParser } = props;

    return (
        <section className="glass-card p-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
                    <Activity size={20} className="text-purple-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold">{t("customLogParsers")}</h2>
                    <p className="text-sm text-white/40">{t("parsersDesc")}</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* New Parser Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("parserName")}</label>
                        <input type="text" value={newParser.name} onChange={(e) => setNewParser(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. SSH Hunter" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-colors" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("regexPattern")}</label>
                        <input type="text" value={newParser.pattern} onChange={(e) => setNewParser(prev => ({ ...prev, pattern: e.target.value }))} placeholder="failed password for .* from (\d+\.\d+\.\d+\.\d+)" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-colors" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("interpretation")}</label>
                        <input type="text" value={newParser.interpretation} onChange={(e) => setNewParser(prev => ({ ...prev, interpretation: e.target.value }))} placeholder={t("interpretation")} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-colors" />
                    </div>
                    <div className="flex gap-2">
                        <div className="space-y-1 flex-1">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("category")}</label>
                            <select value={newParser.category} onChange={(e) => setNewParser(prev => ({ ...prev, category: e.target.value }))} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-colors text-white">
                                <option value="Info">Info</option>
                                <option value="System">System</option>
                                <option value="Config">Config</option>
                                <option value="Security">Security</option>
                            </select>
                        </div>
                        <button onClick={createParser} className="self-end bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-xl h-[38px] w-[38px] flex items-center justify-center transition-all shadow-lg shadow-purple-500/20">
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                {/* Parser List */}
                <div className="grid grid-cols-1 gap-4">
                    {parsers.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-white/20 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${p.category === 'Security' ? 'bg-red-500/10 text-red-500' : p.category === 'Config' ? 'bg-orange-500/10 text-orange-500' : p.category === 'System' ? 'bg-blue-500/10 text-blue-500' : 'bg-white/10 text-white/40'}`}>
                                    {p.category.substring(0, 1)}
                                </div>
                                <div>
                                    <div className="font-bold text-sm tracking-tight">{p.name}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-white/30 font-mono bg-black/40 px-1.5 py-0.5 rounded leading-none">{p.pattern}</span>
                                        <span className="text-[10px] text-white/20 italic">&quot;{p.interpretation}&quot;</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => deleteParser(p.id)} className="p-2 text-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                        </div>
                    ))}
                    {parsers.length === 0 && (
                        <div className="text-center py-12 text-white/10 border-2 border-dashed border-white/5 rounded-3xl">{t("noParsersConfigured")}</div>
                    )}
                </div>
            </div>
        </section>
    );
}
