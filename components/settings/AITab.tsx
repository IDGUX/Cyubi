"use client";

import {
    Key, Shield, Save, X, Cpu, Globe,
    Sparkles, Zap, ShieldCheck, ShieldAlert, Loader2,
} from "lucide-react";
import type { UseSettingsReturn } from "./useSettings";

type Props = Pick<UseSettingsReturn,
    | "t" | "language"
    | "aiSettings" | "setAiSettings"
    | "availableModels" | "isFetchingModels" | "fetchModels"
    | "testing" | "testResult" | "setTestResult" | "testConnection"
    | "saving" | "saveSettings"
>;

export default function AITab(props: Props) {
    const {
        t,
        aiSettings, setAiSettings,
        availableModels, isFetchingModels, fetchModels,
        testing, testResult, setTestResult, testConnection,
        saving, saveSettings,
    } = props;

    const providers = [
        { id: "openai", key: "SECRET_OPENAI_KEY", placeholder: "sk-...", label: "openaiApiKey" },
        { id: "anthropic", key: "SECRET_ANTHROPIC_KEY", placeholder: "sk-ant-...", label: "anthropicApiKey" },
        { id: "gemini", key: "SECRET_GEMINI_KEY", placeholder: "AIza...", label: "geminiApiKey" },
        { id: "mistral", key: "SECRET_MISTRAL_KEY", placeholder: "your-key-here", label: "mistralApiKey" },
    ] as const;

    const modelConfigs = [
        { id: "openai", model: "AI_OPENAI_MODEL", label: "openaiModel" },
        { id: "anthropic", model: "AI_ANTHROPIC_MODEL", label: "anthropicModel" },
        { id: "gemini", model: "AI_GEMINI_MODEL", label: "geminiModel" },
        { id: "mistral", model: "AI_MISTRAL_MODEL", label: "mistralModel" },
        { id: "local", model: "AI_LOCAL_MODEL", label: "localLlmModel" },
    ] as const;

    return (
        <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="glass-card p-4 sm:p-6 rounded-3xl border border-white/5 bg-white/[0.02] relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
                        <Cpu size={24} className="text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">{t("aiIntelligence")}</h2>
                        <p className="text-sm text-white/40">{t("zeroKnowledgeNote")}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* API Key Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {providers.map((p) => (
                            <div key={p.id} className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">{t(p.label as any)}</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                    <input
                                        type="password"
                                        value={(aiSettings as any)[p.key] || ""}
                                        onChange={(e) => setAiSettings({ ...aiSettings, [p.key]: e.target.value })}
                                        onBlur={(e) => fetchModels(p.id, e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                                        placeholder={p.placeholder}
                                    />
                                </div>
                            </div>
                        ))}

                        {/* Local LLM URL */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">{t("localLlmUrl")}</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                <input
                                    type="text"
                                    value={aiSettings.AI_LOCAL_URL || ""}
                                    onChange={(e) => setAiSettings({ ...aiSettings, AI_LOCAL_URL: e.target.value })}
                                    onBlur={(e) => fetchModels("local", undefined, e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                                    placeholder="http://localhost:11434"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5 my-2" />

                    {/* Model Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {modelConfigs.map((p) => (
                            <div key={p.id} className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">{t(p.label as any)}</label>
                                    {isFetchingModels[p.id] && (
                                        <div className="w-3 h-3 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                                    )}
                                </div>
                                <div className="relative group">
                                    <select
                                        value={(aiSettings as any)[p.model]}
                                        onChange={(e) => setAiSettings({ ...aiSettings, [p.model]: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-purple-500/50 transition-colors appearance-none cursor-pointer pr-10"
                                    >
                                        {availableModels[p.id].length > 0 ? (
                                            availableModels[p.id].map(m => (
                                                <option key={m} value={m} className="bg-zinc-900">{m}</option>
                                            ))
                                        ) : (
                                            <option value={(aiSettings as any)[p.model]} className="bg-zinc-900">{(aiSettings as any)[p.model]}</option>
                                        )}
                                    </select>
                                    <button onClick={() => fetchModels(p.id)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-purple-400 transition-colors p-1" title="Refresh models">
                                        <Sparkles size={14} className={isFetchingModels[p.id] ? "animate-pulse" : ""} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="h-px bg-white/5 my-2" />

                    {/* Provider Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">{t("activeProvider")}</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {["openai", "anthropic", "gemini", "mistral", "local"].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setAiSettings({ ...aiSettings, AI_ACTIVE_PROVIDER: p })}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all group/p ${aiSettings.AI_ACTIVE_PROVIDER === p ? "bg-purple-500/10 border-purple-500/40 text-white" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"}`}
                                >
                                    <span className="font-bold capitalize text-xs">{p}</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${aiSettings.AI_ACTIVE_PROVIDER === p ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "bg-white/10 group-hover/p:bg-white/20"}`} />
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 flex flex-col gap-4">
                            <div>
                                <button onClick={testConnection} disabled={testing} className="w-full sm:w-auto px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {testing ? <Loader2 size={12} className="animate-spin text-purple-400" /> : <Zap size={12} className="text-purple-400" />}
                                    {testing ? t("testing") : t("testConnection")}
                                </button>
                            </div>

                            {/* Intelligence Terminal Output */}
                            {testResult && (
                                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm animate-in zoom-in-95 slide-in-from-top-2 duration-500">
                                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-2">{t("aiSampleOutput")}</span>
                                        </div>
                                        <button onClick={() => setTestResult(null)} className="text-white/20 hover:text-white transition-colors"><X size={14} /></button>
                                    </div>
                                    <div className="p-5 space-y-4 font-mono text-[11px]">
                                        <div className="flex items-start gap-4">
                                            <div className={`mt-0.5 p-1.5 rounded-lg ${testResult.success ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                                                {testResult.success ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className={`font-black uppercase tracking-widest mb-1 ${testResult.success ? "text-green-400" : "text-red-400"}`}>
                                                    {testResult.success ? t("connectionTestSuccess") : t("connectionTestFailed")}
                                                </div>
                                                <div className="text-white/50 leading-relaxed">
                                                    {testResult.success ? testResult.message : (testResult.error || testResult.message || "Unknown Error")}
                                                </div>
                                            </div>
                                        </div>
                                        {testResult.interpretation && (
                                            <div className="pt-4 border-t border-white/5 text-purple-400/70 leading-relaxed">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1 flex items-center gap-2">
                                                    <Sparkles size={10} /> {t("interpretationPrefix")}
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-white/20">➜</span>
                                                    <span className="flex-1">{testResult.interpretation}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-white/5 my-2" />

                    {/* Toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => setAiSettings({ ...aiSettings, AI_AUTO_LEARNING: aiSettings.AI_AUTO_LEARNING === "true" ? "false" : "true" })}
                            className={`flex items-start gap-4 p-5 rounded-2xl border transition-all text-left ${aiSettings.AI_AUTO_LEARNING === "true" ? "bg-blue-500/10 border-blue-500/40" : "bg-white/5 border-white/5 hover:bg-white/10"}`}
                        >
                            <div className={`p-2 rounded-lg ${aiSettings.AI_AUTO_LEARNING === "true" ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-white/20"}`}><Zap size={20} /></div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-sm tracking-tight">{t("aiAutoLearning")}</span>
                                    <div className={`w-2 h-2 rounded-full ${aiSettings.AI_AUTO_LEARNING === "true" ? "bg-blue-400 animate-pulse" : "bg-white/10"}`} />
                                </div>
                                <p className="text-[10px] text-white/40 leading-relaxed font-medium">{t("aiAutoLearningDesc")}</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setAiSettings({ ...aiSettings, AI_VALIDATION_MODE: aiSettings.AI_VALIDATION_MODE === "true" ? "false" : "true" })}
                            className={`flex items-start gap-4 p-5 rounded-2xl border transition-all text-left ${aiSettings.AI_VALIDATION_MODE === "true" ? "bg-purple-500/10 border-purple-500/40" : "bg-white/5 border-white/5 hover:bg-white/10"}`}
                        >
                            <div className={`p-2 rounded-lg ${aiSettings.AI_VALIDATION_MODE === "true" ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-white/20"}`}><Shield size={20} /></div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-sm tracking-tight">{t("aiValidation")}</span>
                                    <div className={`w-2 h-2 rounded-full ${aiSettings.AI_VALIDATION_MODE === "true" ? "bg-purple-400 animate-pulse" : "bg-white/10"}`} />
                                </div>
                                <p className="text-[10px] text-white/40 leading-relaxed font-medium">{t("aiValidationDesc")}</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-8 flex justify-end">
                    <button onClick={saveSettings} disabled={saving} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20">
                        <Save size={16} />
                        {saving ? t("saving") : t("saveChanges")}
                    </button>
                </div>
            </section>
        </div>
    );
}
