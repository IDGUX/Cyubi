"use client";

import {
    Bell, Shield, Trash2, Plus, Globe, Terminal,
    Monitor, Activity, Settings,
} from "lucide-react";
import type { UseSettingsReturn } from "./useSettings";

type Props = Pick<UseSettingsReturn,
    | "t" | "language" | "setLanguage"
    | "syslogConfig" | "setSyslogConfig"
    | "usbConfig" | "setUsbConfig"
    | "retentionConfig" | "setRetentionConfig"
    | "alertConfig" | "toggleAlert"
    | "webhooks" | "newWebhookName" | "setNewWebhookName"
    | "newWebhookUrl" | "setNewWebhookUrl"
    | "createWebhook" | "deleteWebhook"
    | "passwordForm" | "setPasswordForm"
    | "passwordMessage" | "isChangingPassword" | "changePassword"
    | "logout"
    | "isClearingLogs" | "showDeleteConfirm" | "setShowDeleteConfirm" | "clearAllLogs"
    | "saving" | "saveSettings"
>;

export default function GeneralTab(props: Props) {
    const {
        t, language, setLanguage,
        syslogConfig, setSyslogConfig,
        usbConfig, setUsbConfig,
        retentionConfig, setRetentionConfig,
        alertConfig, toggleAlert,
        webhooks, newWebhookName, setNewWebhookName,
        newWebhookUrl, setNewWebhookUrl,
        createWebhook, deleteWebhook,
        passwordForm, setPasswordForm,
        passwordMessage, isChangingPassword, changePassword,
        logout,
        isClearingLogs, showDeleteConfirm, setShowDeleteConfirm, clearAllLogs,
        saving, saveSettings,
    } = props;

    return (
        <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Language Selection */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <Globe size={20} className="text-blue-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold">{t("language")}</h2>
                    <p className="text-sm text-white/40">{t("selectLanguage")}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                <button
                    onClick={() => setLanguage("de")}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${language === "de" ? "bg-blue-500/10 border-blue-500/40 text-white" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"}`}
                >
                    <span className="font-bold">{t("german")}</span>
                    <div className={`w-2 h-2 rounded-full ${language === "de" ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-white/10"}`} />
                </button>
                <button
                    onClick={() => setLanguage("en")}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${language === "en" ? "bg-blue-500/10 border-blue-500/40 text-white" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"}`}
                >
                    <span className="font-bold">{t("english")}</span>
                    <div className={`w-2 h-2 rounded-full ${language === "en" ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-white/10"}`} />
                </button>
            </div>

            <div className="h-px bg-white/5 my-8" />

            <section className="glass-card p-6 border-2 border-purple-500/30 relative">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-purple-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-purple-500/40 animate-pulse z-20">
                    {t("masterAdmin")}
                </div>

                {/* System Status / Ports */}
                <div className="mb-8 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Shield size={100} />
                    </div>
                    <h3 className="text-sm font-bold text-blue-300 mb-4 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={16} /> {t("systemStatus")} & Firewall
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><Monitor size={20} /></div>
                            <div>
                                <p className="text-xs text-white/50 font-bold uppercase">Web Interface</p>
                                <p className="text-lg font-black font-mono">Port 3000 <span className="text-xs text-white/30 font-sans font-normal">(TCP)</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Terminal size={20} /></div>
                            <div>
                                <p className="text-xs text-white/50 font-bold uppercase">{t("syslogReceiver")}</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-black font-mono">Port: {syslogConfig.port} <span className="text-[10px] text-white/30 font-sans font-normal">(UDP)</span></p>
                                    <div className={`w-2 h-2 rounded-full ${syslogConfig.enabled ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-white/40 flex items-center gap-2">
                        <Shield size={12} /><span>{t("firewallNote")}</span>
                    </div>
                </div>

                {/* Notifications */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
                        <Bell size={20} className="text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">{t("notifications")}</h2>
                        <p className="text-sm text-white/40">{t("notificationsDesc")}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Webhooks */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-white/60 uppercase tracking-widest">{t("webhookTargets")}</label>
                        <div className="flex gap-2 mb-4">
                            <input type="text" value={newWebhookName} onChange={(e) => setNewWebhookName(e.target.value)} placeholder={t("webhookNamePlaceholder")} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-colors" />
                            <input type="text" value={newWebhookUrl} onChange={(e) => setNewWebhookUrl(e.target.value)} placeholder={t("webhookUrlPlaceholder")} className="flex-[2] bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-colors" />
                            <button onClick={createWebhook} className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg transition-all"><Plus size={20} /></button>
                        </div>
                        <div className="space-y-2">
                            {webhooks.map((w) => (
                                <div key={w.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-bold">{w.name}</div>
                                        <div className="text-[10px] text-white/30 truncate">{w.url}</div>
                                    </div>
                                    <button onClick={() => deleteWebhook(w.id)} className="p-2 text-white/10 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                </div>
                            ))}
                            {webhooks.length === 0 && (
                                <div className="text-center py-4 text-white/10 border-2 border-dashed border-white/5 rounded-xl text-xs">{t("noWebhooks")}</div>
                            )}
                        </div>
                    </div>

                    {/* Alert Filters */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-white/60 uppercase tracking-widest block mb-4">{t("alertFilters")}</label>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {Object.entries(alertConfig).map(([cat, enabled]) => (
                                <button key={cat} onClick={() => toggleAlert(cat)} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${enabled ? "bg-white/10 border-white/20 text-white shadow-lg" : "bg-transparent border-white/5 text-white/20"}`}>
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="text-xs font-black tracking-widest uppercase">{t(cat.toLowerCase())}</span>
                                        <span className="text-[9px] opacity-60">{enabled ? t("active") : t("inactive")}</span>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${enabled ? "bg-green-500 animate-pulse" : "bg-white/10"}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Syslog + USB */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Terminal size={14} className="text-blue-400" />
                                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">{t("syslogReceiver")}</h3>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-bold">UDP {t("syslogReceiver")}</span>
                                    <span className="text-[10px] text-white/40">{t("syslogDesc")}</span>
                                </div>
                                <button onClick={() => setSyslogConfig(prev => ({ ...prev, enabled: !prev.enabled }))} className={`w-12 h-6 rounded-full transition-all relative ${syslogConfig.enabled ? "bg-blue-600" : "bg-white/10"}`}>
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${syslogConfig.enabled ? "left-7" : "left-1"}`} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("defaultPort")}</label>
                                <input type="text" value={syslogConfig.port} onChange={(e) => setSyslogConfig(prev => ({ ...prev, port: e.target.value }))} placeholder="514" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield size={14} className="text-orange-400" />
                                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">{t("usbArchive")}</h3>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-bold">{t("usbSync")}</span>
                                    <span className="text-[10px] text-white/40">{t("usbDesc")}</span>
                                    <div className="flex items-center gap-1 mt-1">
                                        <div className="px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-[8px] text-orange-400 font-bold uppercase">Forensic Mode</div>
                                        <span className="text-[8px] text-white/20 italic">Append-only + Hardware Sync</span>
                                    </div>
                                </div>
                                <button onClick={() => setUsbConfig(prev => ({ ...prev, enabled: !prev.enabled }))} className={`w-12 h-6 rounded-full transition-all relative ${usbConfig.enabled ? "bg-orange-600" : "bg-white/10"}`}>
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${usbConfig.enabled ? "left-7" : "left-1"}`} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("usbPath")}</label>
                                <input type="text" value={usbConfig.path} onChange={(e) => setUsbConfig(prev => ({ ...prev, path: e.target.value }))} placeholder="/Volumes/USB-STICK" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500/50 transition-colors" />
                            </div>
                        </div>
                    </div>

                    {/* Retention */}
                    <div className="space-y-4 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity size={14} className="text-green-400" />
                            <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">{t("logRetention")}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("retentionDays")}</label>
                                <input type="number" value={retentionConfig.days} onChange={(e) => setRetentionConfig(prev => ({ ...prev, days: e.target.value }))} placeholder="30" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-green-500/50 transition-colors" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("maxEntries")}</label>
                                <input type="number" value={retentionConfig.maxCount} onChange={(e) => setRetentionConfig(prev => ({ ...prev, maxCount: e.target.value }))} placeholder="50000" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-green-500/50 transition-colors" />
                            </div>
                        </div>
                        <div className="pt-2">
                            <button onClick={clearAllLogs} disabled={isClearingLogs} className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${showDeleteConfirm ? "bg-red-600 hover:bg-red-500 text-white animate-pulse" : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"}`}>
                                {isClearingLogs ? t("deleting") : showDeleteConfirm ? t("nowIrrevocablyDelete") : t("clearAllLogs")}
                            </button>
                            {showDeleteConfirm && (
                                <button onClick={() => setShowDeleteConfirm(false)} className="w-full mt-2 text-[10px] text-white/30 hover:text-white uppercase font-bold tracking-widest">{t("cancel")}</button>
                            )}
                        </div>
                    </div>

                    {/* Security */}
                    <div className="space-y-4 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <Shield size={14} className="text-red-400" />
                                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">{t("securityAccess")}</h3>
                            </div>
                            <button onClick={logout} className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20">{t("logout")}</button>
                        </div>
                        <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-4">
                            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">{t("changeMasterPassword")}</h4>
                            <form onSubmit={changePassword} className="space-y-3">
                                <input type="password" placeholder={t("currentPassword")} value={passwordForm.current} onChange={(e) => setPasswordForm(p => ({ ...p, current: e.target.value }))} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50" required />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input type="password" placeholder={t("newPassword")} value={passwordForm.new} onChange={(e) => setPasswordForm(p => ({ ...p, new: e.target.value }))} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50" required />
                                    <input type="password" placeholder={t("confirmPassword")} value={passwordForm.confirm} onChange={(e) => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50" required />
                                </div>
                                {passwordMessage.text && (
                                    <div className={`p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-center ${passwordMessage.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>{passwordMessage.text}</div>
                                )}
                                <button type="submit" disabled={isChangingPassword} className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50">
                                    {isChangingPassword ? t("saving") : t("updatePassword")}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Save */}
                    <button onClick={saveSettings} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20">
                        {saving ? "..." : t("saveChanges")}
                    </button>
                </div>
            </section>
        </div>
    );
}
