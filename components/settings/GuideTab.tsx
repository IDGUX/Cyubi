"use client";

import { useMemo } from "react";
import { Check, Copy, Monitor, Terminal, Apple, Activity, Settings } from "lucide-react";
import type { UseSettingsReturn } from "./useSettings";

type Props = Pick<UseSettingsReturn,
    | "t"
    | "copying" | "copyToClipboard"
    | "host" | "setHost"
>;

export default function GuideTab(props: Props) {
    const { t, copying, copyToClipboard, host, setHost } = props;

    const baseMacCmd = `curl -X POST http://${host}/api/logs -H "Content-Type: application/json" -d '{"source": "MacBook-Air", "message": "App started successfully", "level": "INFO"}'`;

    const snippets = useMemo(() => ({
        powershell: `$body = @{
    source = "Windows-Server"
    message = "EventLog: System wurde erfolgreich gestartet"
    level = "INFO"
}
Invoke-RestMethod -Uri "http://${host}/api/logs" -Method Post -Body ($body | ConvertTo-Json) -ContentType "application/json"`,
        curl: `curl -X POST http://${host}/api/logs -H "Content-Type: application/json" -d '{"source": "ExternalApp", "content": "Manual Test Log", "level": "Info"}'`,
        macos: `curl -X POST http://${host}/api/logs -H "Content-Type: application/json" -d '{"source": "MacBook", "content": "Desktop Event", "level": "System"}'`,
        cronjob: `${t("cronjobHeader")}\n*/5 * * * * curl -X POST http://${host}/api/logs -H "Content-Type: application/json" -d '{\"source\": \"$(hostname)\", \"content\": \"System Heartbeat\", \"level\": \"Info\"}'`,
        rsyslog: `# /etc/rsyslog.d/99-cyubi.conf\n${t("rsyslogHeader")}\n*.* @${host.split(':')[0]}:514`,
        winAuto: `${t("winAutoHeader")}\n$host = \"${host}\"\nwhile($true) {\n  Invoke-RestMethod -Uri \"http://$host/api/logs\" -Method Post -Body (@{source=\"$(hostname)\"; content=\"WIN-HEARTBEAT\"; level=\"System\"} | ConvertTo-Json)\n  Start-Sleep -Seconds 300\n}`,
        macAuto: `${t("macAutoHeader")}\nmkdir -p ~/Library/LaunchAgents\ncat <<EOF > ~/Library/LaunchAgents/at.datadus.cyubi.plist\n<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n<plist version=\"1.0\"><dict>\n<key>Label</key><string>at.datadus.cyubi</string>\n<key>ProgramArguments</key><array><string>/bin/sh</string><string>-c</string><string>${baseMacCmd.replace(/"/g, '\\"')}</string></array>\n<key>RunAtLoad</key><true/><key>StartInterval</key><integer>300</integer>\n</dict></plist>\nEOF\nlaunchctl load ~/Library/LaunchAgents/at.datadus.cyubi.plist`,
    }), [host, t, baseMacCmd]);

    const CopyButton = ({ text }: { text: string }) => (
        <button
            onClick={() => copyToClipboard(text)}
            className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100"
        >
            {copying === text ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
    );

    return (
        <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Server Config */}
            <div className="glass-card p-6 bg-blue-500/5 border-blue-500/20">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg"><Settings size={18} className="text-blue-400" /></div>
                    <h3 className="font-bold text-sm">{t("serverConfig")}</h3>
                </div>
                <p className="text-xs text-white/40 mb-4">{t("serverConfigDesc")}</p>
                <div className="grid grid-cols-1 gap-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">{t("serverHostname")}</label>
                            <input type="text" value={host} onChange={(e) => setHost(e.target.value)} placeholder="e.g. 192.168.1.50:3001" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors" />
                        </div>
                        <button onClick={() => { if (typeof window !== "undefined") setHost(window.location.host); }} className="self-end px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-all">{t("reset")}</button>
                    </div>
                </div>
            </div>

            {/* Quick Start Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <section className="glass-card p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30"><Monitor size={20} className="text-blue-400" /></div>
                        <h2 className="text-lg font-bold">{t("windows")}</h2>
                    </div>
                    <p className="text-sm text-white/60 mb-6 font-medium">{t("psDesc")}</p>
                    <div className="relative flex-1 group">
                        <pre className="bg-black/60 rounded-xl p-4 text-[10px] font-mono text-blue-300 overflow-x-auto h-full border border-white/5 whitespace-pre-wrap">{snippets.powershell}</pre>
                        <CopyButton text={snippets.powershell} />
                    </div>
                </section>

                <section className="glass-card p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30"><Terminal size={20} className="text-green-400" /></div>
                        <h2 className="text-lg font-bold">{t("linux")}</h2>
                    </div>
                    <p className="text-sm text-white/60 mb-6 font-medium">{t("linuxDesc")}</p>
                    <div className="relative flex-1 group">
                        <pre className="bg-black/60 rounded-xl p-4 text-[10px] font-mono text-green-300 overflow-x-auto h-full border border-white/5 whitespace-pre-wrap">{snippets.curl}</pre>
                        <CopyButton text={snippets.curl} />
                    </div>
                </section>

                <section className="glass-card p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gray-500/20 rounded-lg border border-gray-500/30"><Apple size={20} className="text-gray-400" /></div>
                        <h2 className="text-lg font-bold">{t("macos")}</h2>
                    </div>
                    <p className="text-sm text-white/60 mb-6 font-medium">{t("macDesc")}</p>
                    <div className="relative flex-1 group">
                        <pre className="bg-black/60 rounded-xl p-4 text-[10px] font-mono text-gray-300 overflow-x-auto h-full border border-white/5 whitespace-pre-wrap">{snippets.macos}</pre>
                        <CopyButton text={snippets.macos} />
                    </div>
                </section>

                {/* Auto Reporter */}
                <section className="glass-card p-6 flex flex-col md:col-span-3 border-2 border-purple-500/30 overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30"><Activity size={20} className="text-purple-400" /></div>
                        <h2 className="text-lg font-bold">{t("autoReporter")}</h2>
                    </div>
                    <p className="text-sm text-white/60 mb-6 font-medium">{t("autoReporterDesc")}</p>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Windows Automation */}
                        <div className="space-y-4 relative group flex flex-col">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400"><Monitor size={14} /></div>
                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest block">{t("windowsAutomation")}</span>
                            </div>
                            <pre className="bg-black/60 rounded-xl p-4 text-[9px] font-mono text-blue-300 overflow-x-auto border border-white/5 whitespace-pre-wrap flex-1 min-h-[120px]">{snippets.winAuto}</pre>
                            <button onClick={() => copyToClipboard(snippets.winAuto)} className="absolute top-8 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                {copying === snippets.winAuto ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                            <p className="text-[10px] text-white/20 italic">{t("winAutoDesc")}</p>
                        </div>

                        {/* Linux Automation */}
                        <div className="space-y-4 relative group flex flex-col">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-green-500/10 rounded-lg text-green-400"><Terminal size={14} /></div>
                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest block">{t("linuxAutomation")}</span>
                            </div>
                            <pre className="bg-black/60 rounded-xl p-4 text-[9px] font-mono text-green-300 overflow-x-auto border border-white/5 whitespace-pre-wrap flex-1 min-h-[120px]">{snippets.rsyslog}</pre>
                            <button onClick={() => copyToClipboard(snippets.rsyslog)} className="absolute top-8 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                {copying === snippets.rsyslog ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                            <p className="text-[10px] text-white/20 italic">{t("linuxAutoDesc")}</p>
                        </div>

                        {/* macOS Automation */}
                        <div className="space-y-4 relative group flex flex-col">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-gray-500/10 rounded-lg text-gray-400"><Apple size={14} /></div>
                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest block">{t("macosAutomation")}</span>
                            </div>
                            <pre className="bg-black/60 rounded-xl p-4 text-[9px] font-mono text-gray-300 overflow-x-auto border border-white/5 whitespace-pre-wrap flex-1 min-h-[120px]">{snippets.macAuto}</pre>
                            <button onClick={() => copyToClipboard(snippets.macAuto)} className="absolute top-8 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                {copying === snippets.macAuto ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                            <p className="text-[10px] text-white/20 italic">{t("macAutoDesc")}</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
