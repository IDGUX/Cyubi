"use client";

import { useState, useEffect } from "react";
import {
    Key,
    Bell,
    Shield,
    Trash2,
    Plus,
    Check,
    Copy,
    HelpCircle,
    Terminal,
    Monitor,
    Settings,
    Apple,
    Activity,
    Globe,
    List,
    Save,
    X,
    Cpu,
    Sparkles,
    Zap
} from "lucide-react";
import { useTranslation } from "@/lib/translations";

export default function SettingsView() {
    const { t, language, setLanguage } = useTranslation();
    const [webhookUrl, setWebhookUrl] = useState("");
    const [activeTab, setActiveTab] = useState<"GENERAL" | "SOURCES" | "GUIDE" | "PARSERS" | "AI">("GENERAL");
    const [alertConfig, setAlertConfig] = useState<Record<string, boolean>>({
        SECURITY: true,
        CONFIG: false,
        SYSTEM: false,
        INFO: false,
    });
    const [sources, setSources] = useState<any[]>([]);
    const [webhooks, setWebhooks] = useState<any[]>([]);
    const [parsers, setParsers] = useState<any[]>([]);
    const [newParser, setNewParser] = useState({ name: "", pattern: "", category: "Info", interpretation: "" });
    const [newWebhookUrl, setNewWebhookUrl] = useState("");
    const [newWebhookName, setNewWebhookName] = useState("");
    const [newSourceName, setNewSourceName] = useState("");
    const [newSourceIp, setNewSourceIp] = useState("");
    const [unknownSources, setUnknownSources] = useState<string[]>([]);
    const [lastSync, setLastSync] = useState(new Date());
    const [saving, setSaving] = useState(false);
    const [isCreatingSource, setIsCreatingSource] = useState(false);
    const [copying, setCopying] = useState<string | null>(null);
    const [host, setHost] = useState("localhost:3000");
    const [syslogConfig, setSyslogConfig] = useState({ enabled: false, port: "514" });
    const [usbConfig, setUsbConfig] = useState({ enabled: false, path: "/Volumes/LOGVAULT" });
    const [retentionConfig, setRetentionConfig] = useState({ days: "30", maxCount: "50000" });
    const [isClearingLogs, setIsClearingLogs] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
    const [passwordMessage, setPasswordMessage] = useState({ text: "", type: "" as "error" | "success" | "" });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [aiSettings, setAiSettings] = useState({
        SECRET_OPENAI_KEY: "",
        SECRET_ANTHROPIC_KEY: "",
        SECRET_GEMINI_KEY: "",
        SECRET_MISTRAL_KEY: "",
        AI_ACTIVE_PROVIDER: "openai",
        AI_OPENAI_MODEL: "gpt-4o",
        AI_ANTHROPIC_MODEL: "claude-3-5-sonnet-20240620",
        AI_GEMINI_MODEL: "gemini-1.5-flash",
        AI_MISTRAL_MODEL: "mistral-large-latest",
        AI_LOCAL_URL: "http://localhost:11434",
        AI_LOCAL_MODEL: "llama3",
        AI_AUTO_LEARNING: "false",
        AI_VALIDATION_MODE: "false",
    });

    const [availableModels, setAvailableModels] = useState<Record<string, string[]>>({
        openai: [],
        anthropic: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
        gemini: [],
        mistral: [],
        local: []
    });

    const [isFetchingModels, setIsFetchingModels] = useState<Record<string, boolean>>({});


    useEffect(() => {
        fetchSettings();
        fetchSources();
        fetchWebhooks();
        fetchParsers();
        fetchUnknownSources();
        if (typeof window !== "undefined") {
            setHost(window.location.host);
        }

        const interval = setInterval(() => {
            fetchSources();
            fetchUnknownSources();
            setLastSync(new Date());
        }, 30000); // Pulse every 30s

        return () => clearInterval(interval);
    }, []);



    const fetchSources = async () => {
        try {
            const res = await fetch("/api/sources");
            const data = await res.json();
            if (Array.isArray(data)) {
                setSources(data);
            } else {
                setSources([]);
            }
        } catch (e) { console.error("Failed to fetch sources:", e); }
    };

    const fetchUnknownSources = async () => {
        try {
            const res = await fetch("/api/sources/unknown");
            const data = await res.json();
            if (Array.isArray(data)) {
                setUnknownSources(data);
            }
        } catch (e) { console.error("Discovery failed:", e); }
    };

    const isOnline = (lastSeen: string | null) => {
        if (!lastSeen) return false;
        const lastDate = new Date(lastSeen);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastDate.getTime()) / (1000 * 60);
        return diffMinutes < 5; // Online if logs received in last 5 minutes
    };

    const fetchWebhooks = async () => {
        try {
            const res = await fetch("/api/webhooks");
            const data = await res.json();
            if (Array.isArray(data)) {
                setWebhooks(data);
            } else {
                setWebhooks([]);
            }
        } catch (e) { console.error("Failed to fetch webhooks:", e); }
    };

    const createWebhook = async () => {
        if (!newWebhookUrl || !newWebhookName) return;
        try {
            const res = await fetch("/api/webhooks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newWebhookName, url: newWebhookUrl }),
            });
            if (res.ok) {
                setNewWebhookName("");
                setNewWebhookUrl("");
                fetchWebhooks();
            }
        } catch (e) { console.error("Error creating webhook:", e); }
    };

    const deleteWebhook = async (id: string) => {
        try {
            await fetch(`/ api / webhooks / ${id} `, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });
            fetchWebhooks();
        } catch (e) { console.error("Error deleting webhook:", e); }
    };

    const fetchParsers = async () => {
        try {
            const res = await fetch("/api/parsers");
            const data = await res.json();
            if (Array.isArray(data)) setParsers(data);
        } catch (e) { console.error("Failed to fetch parsers:", e); }
    };

    const createParser = async () => {
        if (!newParser.name || !newParser.pattern || !newParser.interpretation) return;
        try {
            const res = await fetch("/api/parsers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newParser),
            });
            if (res.ok) {
                setNewParser({ name: "", pattern: "", category: "Info", interpretation: "" });
                fetchParsers();
            }
        } catch (e) { console.error("Error creating parser:", e); }
    };

    const deleteParser = async (id: string) => {
        try {
            await fetch(`/ api / parsers / ${id} `, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });
            fetchParsers();
        } catch (e) { console.error("Error deleting parser:", e); }
    };

    const createSource = async () => {
        if (!newSourceName || !newSourceIp) return;
        setIsCreatingSource(true);
        try {
            const res = await fetch("/api/sources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newSourceName,
                    ipAddress: newSourceIp
                }),
            });
            if (res.ok) {
                setNewSourceName("");
                setNewSourceIp("");
                await fetchSources();
            } else {
                const errorData = await res.json();
                console.error("Failed to create source:", errorData);
                alert("Fehler beim Erstellen der Quelle: " + (errorData.detail || errorData.error || "Unbekannter Fehler"));
            }
        } catch (e) {
            console.error("Error creating source:", e);
            alert("Verbindungsfehler beim Erstellen der Quelle.");
        } finally {
            setIsCreatingSource(false);
        }
    };

    const deleteSource = async (id: string) => {
        try {
            const res = await fetch(`/ api / sources / ${id} `, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                fetchSources();
            } else {
                const err = await res.json();
                alert(t("deleteError") + ": " + (err.detail || err.error));
            }
        } catch (e) {
            console.error("Error deleting source:", e);
            alert(t("deleteConnError"));
        }
    };

    const fetchModels = async (provider: string, overrideKey?: string, overrideUrl?: string) => {
        const apiKey = overrideKey !== undefined ? overrideKey : (
            provider === "openai" ? aiSettings.SECRET_OPENAI_KEY :
                provider === "anthropic" ? aiSettings.SECRET_ANTHROPIC_KEY :
                    provider === "gemini" ? aiSettings.SECRET_GEMINI_KEY :
                        provider === "mistral" ? aiSettings.SECRET_MISTRAL_KEY : ""
        );

        const baseUrl = overrideUrl !== undefined ? overrideUrl : aiSettings.AI_LOCAL_URL;

        if (!apiKey && provider !== "local") return;
        if (provider === "local" && !baseUrl) return;

        setIsFetchingModels(prev => ({ ...prev, [provider]: true }));
        try {
            const url = `/api/ai/models?provider=${provider}&apiKey=${encodeURIComponent(apiKey)}` +
                (provider === "local" ? `&baseUrl=${encodeURIComponent(baseUrl)}` : "");
            const res = await fetch(url);
            const data = await res.json();
            if (data.models) {
                setAvailableModels(prev => ({ ...prev, [provider]: data.models }));
            }
        } catch (e) {
            console.error(`Failed to fetch models for ${provider}:`, e);
        } finally {
            setIsFetchingModels(prev => ({ ...prev, [provider]: false }));
        }
    };

    useEffect(() => {
        if (activeTab === "AI") {
            const providers = ["openai", "gemini", "mistral", "local"];
            providers.forEach(p => fetchModels(p));
        }
    }, [activeTab]);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings");
            const data = await res.json();
            if (data.WEBHOOK_URL) setWebhookUrl(data.WEBHOOK_URL);
            setAlertConfig({
                SECURITY: data.ALERT_SECURITY === "true",
                CONFIG: data.ALERT_CONFIG === "true",
                SYSTEM: data.ALERT_SYSTEM === "true",
                INFO: data.ALERT_INFO === "true",
            });
            setSyslogConfig({
                enabled: data.SYSLOG_ENABLED === "true",
                port: data.SYSLOG_PORT || "514",
            });
            setUsbConfig({
                enabled: data.USB_AUTO_SYNC === "true",
                path: data.USB_PATH || "/Volumes/LOGVAULT",
            });
            setRetentionConfig({
                days: data.LOG_RETENTION_DAYS || "30",
                maxCount: data.MAX_LOG_COUNT || "50000",
            });
            setAiSettings({
                SECRET_OPENAI_KEY: data.SECRET_OPENAI_KEY || "",
                SECRET_ANTHROPIC_KEY: data.SECRET_ANTHROPIC_KEY || "",
                SECRET_GEMINI_KEY: data.SECRET_GEMINI_KEY || "",
                SECRET_MISTRAL_KEY: data.SECRET_MISTRAL_KEY || "",
                AI_ACTIVE_PROVIDER: data.AI_ACTIVE_PROVIDER || "openai",
                AI_OPENAI_MODEL: data.AI_OPENAI_MODEL || "gpt-4o",
                AI_ANTHROPIC_MODEL: data.AI_ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620",
                AI_GEMINI_MODEL: data.AI_GEMINI_MODEL || "gemini-1.5-flash",
                AI_MISTRAL_MODEL: data.AI_MISTRAL_MODEL || "mistral-large-latest",
                AI_LOCAL_URL: data.AI_LOCAL_URL || "http://localhost:11434",
                AI_LOCAL_MODEL: data.AI_LOCAL_MODEL || "llama3",
                AI_AUTO_LEARNING: data.AI_AUTO_LEARNING || "false",
                AI_VALIDATION_MODE: data.AI_VALIDATION_MODE || "false",
            });
        } catch (e) { console.error(e); }
    };


    const saveSettings = async () => {
        setSaving(true);
        try {
            const settings: Record<string, string> = {
                WEBHOOK_URL: webhookUrl,
                ALERT_SECURITY: alertConfig.SECURITY.toString(),
                ALERT_CONFIG: alertConfig.CONFIG.toString(),
                ALERT_SYSTEM: alertConfig.SYSTEM.toString(),
                ALERT_INFO: alertConfig.INFO.toString(),
                SYSLOG_ENABLED: syslogConfig.enabled.toString(),
                SYSLOG_PORT: syslogConfig.port,
                USB_AUTO_SYNC: usbConfig.enabled.toString(),
                USB_PATH: usbConfig.path,
                LOG_RETENTION_DAYS: retentionConfig.days,
                MAX_LOG_COUNT: retentionConfig.maxCount,
                SECRET_OPENAI_KEY: aiSettings.SECRET_OPENAI_KEY,
                SECRET_ANTHROPIC_KEY: aiSettings.SECRET_ANTHROPIC_KEY,
                SECRET_GEMINI_KEY: aiSettings.SECRET_GEMINI_KEY,
                SECRET_MISTRAL_KEY: aiSettings.SECRET_MISTRAL_KEY,
                AI_ACTIVE_PROVIDER: aiSettings.AI_ACTIVE_PROVIDER,
                AI_OPENAI_MODEL: aiSettings.AI_OPENAI_MODEL,
                AI_ANTHROPIC_MODEL: aiSettings.AI_ANTHROPIC_MODEL,
                AI_GEMINI_MODEL: aiSettings.AI_GEMINI_MODEL,
                AI_MISTRAL_MODEL: aiSettings.AI_MISTRAL_MODEL,
                AI_LOCAL_URL: aiSettings.AI_LOCAL_URL,
                AI_LOCAL_MODEL: aiSettings.AI_LOCAL_MODEL,
                AI_AUTO_LEARNING: aiSettings.AI_AUTO_LEARNING,
                AI_VALIDATION_MODE: aiSettings.AI_VALIDATION_MODE,
            };
            await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
        } catch (e) {
            console.error("Error saving settings:", e);
        }
        setSaving(false);
    };

    const logout = async () => {
        try {
            await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "logout" })
            });
            window.location.href = "/login";
        } catch (e) {
            console.error("Logout failed:", e);
        }
    };

    const changePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.new !== passwordForm.confirm) {
            setPasswordMessage({ text: t("passwordsDoNotMatch"), type: "error" });
            return;
        }
        if (passwordForm.new.length < 6) {
            setPasswordMessage({ text: "Das Passwort muss mindestens 6 Zeichen lang sein", type: "error" });
            return;
        }

        setIsChangingPassword(true);
        setPasswordMessage({ text: "", type: "" });

        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "change-password",
                    currentPassword: passwordForm.current,
                    newPassword: passwordForm.new
                })
            });
            const data = await res.json();
            if (res.ok) {
                setPasswordMessage({ text: t("passwordChanged"), type: "success" });
            } else {
                setPasswordMessage({ text: data.error || t("passwordError"), type: "error" });
            }
        } catch (e) {
            setPasswordMessage({ text: t("connectionError"), type: "error" });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const clearAllLogs = async () => {
        if (!showDeleteConfirm) {
            setShowDeleteConfirm(true);
            return;
        }
        setIsClearingLogs(true);
        try {
            const res = await fetch("/api/logs", { method: "DELETE" });
            if (res.ok) {
                alert(t("logsDeleted"));
                setShowDeleteConfirm(false);
            }
        } catch (e) {
            console.error("Error clearing logs:", e);
        } finally {
            setIsClearingLogs(false);
        }
    };

    const toggleAlert = (category: string) => {
        setAlertConfig(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopying(text);
            setTimeout(() => setCopying(null), 2000);
        } catch (err) {
            // Fallback for non-secure contexts (http://IP...) where navigator.clipboard might be blocked
            try {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed"; // Avoid scrolling to bottom
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);

                setCopying(text);
                setTimeout(() => setCopying(null), 2000);
            } catch (e) {
                console.error('Fallback copy failed', e);
                // Last resort: simple feedback that it failed
                alert(t("copyError"));
            }
        }
    };

    const baseWinCmd = `$body = @{ source = "Windows-Server"; message = "EventLog: System wurde erfolgreich gestartet"; level = "INFO" }; Invoke - RestMethod - Uri "http://${host}/api/logs" - Method Post - Body($body | ConvertTo - Json) - ContentType "application/json"`;
    const baseMacCmd = `curl - X POST http://${host}/api/logs -H "Content-Type: application/json" -d '{"source": "MacBook-Air", "message": "App started successfully", "level": "INFO"}'`;

    const snippets = {
        powershell: `$body = @{
    source = "Windows-Server"
    message = "EventLog: System wurde erfolgreich gestartet"
    level = "INFO"
}
Invoke-RestMethod -Uri "http://${host}/api/logs" -Method Post -Body ($body | ConvertTo-Json) -ContentType "application/json"`,
        curl: `curl -X POST http://${host}/api/logs -H "Content-Type: application/json" -d '{"source": "ExternalApp", "content": "Manual Test Log", "level": "Info"}'`,
        macos: `curl -X POST http://${host}/api/logs -H "Content-Type: application/json" -d '{"source": "MacBook", "content": "Desktop Event", "level": "System"}'`,
        cronjob: `${t("cronjobHeader")}\n*/5 * * * * curl -X POST http://${host}/api/logs -H "Content-Type: application/json" -d '{\"source\": \"$(hostname)\", \"content\": \"System Heartbeat\", \"level\": \"Info\"}'`,
        rsyslog: `# /etc/rsyslog.d/99-logvault.conf\n${t("rsyslogHeader")}\n*.* @${host.split(':')[0]}:514`,
        winAuto: `${t("winAutoHeader")}\n$host = \"${host}\"\nwhile($true) {\n  Invoke-RestMethod -Uri \"http://$host/api/logs\" -Method Post -Body (@{source=\"$(hostname)\"; content=\"WIN-HEARTBEAT\"; level=\"System\"} | ConvertTo-Json)\n  Start-Sleep -Seconds 300\n}`,
        macAuto: `${t("macAutoHeader")}\nmkdir -p ~/Library/LaunchAgents\ncat <<EOF > ~/Library/LaunchAgents/at.datadus.logvault.plist\n<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n<plist version=\"1.0\"><dict>\n<key>Label</key><string>at.datadus.logvault</string>\n<key>ProgramArguments</key><array><string>/bin/sh</string><string>-c</string><string>${baseMacCmd.replace(/"/g, '\\"')}</string></array>\n<key>RunAtLoad</key><true/><key>StartInterval</key><integer>300</integer>\n</dict></plist>\nEOF\nlaunchctl load ~/Library/LaunchAgents/at.datadus.logvault.plist`
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Settings Navigation */}
            <div className="flex flex-wrap gap-2 mb-8 bg-white/5 p-1 rounded-xl w-full sm:w-fit justify-center sm:justify-start">
                <button
                    onClick={() => setActiveTab("GENERAL")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeTab === "GENERAL" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
                >
                    <Settings size={14} /> <span className="truncate">{t("general")}</span>
                </button>
                <button
                    onClick={() => setActiveTab("SOURCES")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeTab === "SOURCES" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
                >
                    <Monitor size={14} /> <span className="truncate">{t("devicesSources")}</span>
                </button>
                <button
                    onClick={() => setActiveTab("PARSERS")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeTab === "PARSERS" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
                >
                    <Activity size={14} /> <span className="truncate">{t("logParsers")}</span>
                </button>
                <button
                    onClick={() => setActiveTab("GUIDE")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeTab === "GUIDE" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
                >
                    <List size={14} /> <span className="truncate">{t("integrationGuide")}</span>
                </button>
                <button
                    onClick={() => setActiveTab("AI")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeTab === "AI" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
                >
                    <Sparkles size={14} /> <span className="truncate">{t("aiIntelligence")}</span>
                </button>
            </div>

            {activeTab === "GENERAL" && (
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
                                    <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                                        <Monitor size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/50 font-bold uppercase">Web Interface</p>
                                        <p className="text-lg font-black font-mono">Port 3000 <span className="text-xs text-white/30 font-sans font-normal">(TCP)</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                        <Terminal size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/50 font-bold uppercase">{t("syslogReceiver")}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-black font-mono">
                                                Port: {syslogConfig.port} <span className="text-[10px] text-white/30 font-sans font-normal">(UDP)</span>
                                            </p>
                                            <div className={`w-2 h-2 rounded-full ${syslogConfig.enabled ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-white/40 flex items-center gap-2">
                                <Shield size={12} />
                                <span>{t("firewallNote")}</span>
                            </div>
                        </div>

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
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-white/60 uppercase tracking-widest">{t("webhookTargets")}</label>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={newWebhookName}
                                        onChange={(e) => setNewWebhookName(e.target.value)}
                                        placeholder={t("webhookNamePlaceholder")}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                                    />
                                    <input
                                        type="text"
                                        value={newWebhookUrl}
                                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                                        placeholder={t("webhookUrlPlaceholder")}
                                        className="flex-[2] bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                                    />
                                    <button
                                        onClick={createWebhook}
                                        className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg transition-all"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {webhooks.map((w) => (
                                        <div key={w.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-bold">{w.name}</div>
                                                <div className="text-[10px] text-white/30 truncate">{w.url}</div>
                                            </div>
                                            <button onClick={() => deleteWebhook(w.id)} className="p-2 text-white/10 hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {webhooks.length === 0 && (
                                        <div className="text-center py-4 text-white/10 border-2 border-dashed border-white/5 rounded-xl text-xs">
                                            {t("noWebhooks")}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-bold text-white/60 uppercase tracking-widest block mb-4">{t("alertFilters")}</label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {Object.entries(alertConfig).map(([cat, enabled]) => (
                                        <button
                                            key={cat}
                                            onClick={() => toggleAlert(cat)}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${enabled ? "bg-white/10 border-white/20 text-white shadow-lg" : "bg-transparent border-white/5 text-white/20"}`}
                                        >
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="text-xs font-black tracking-widest uppercase">{t(cat.toLowerCase())}</span>
                                                <span className="text-[9px] opacity-60">{enabled ? t("active") : t("inactive")}</span>
                                            </div>
                                            <div className={`w-2 h-2 rounded-full ${enabled ? "bg-green-500 animate-pulse" : "bg-white/10"}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

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
                                        <button
                                            onClick={() => setSyslogConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                                            className={`w-12 h-6 rounded-full transition-all relative ${syslogConfig.enabled ? "bg-blue-600" : "bg-white/10"}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${syslogConfig.enabled ? "left-7" : "left-1"}`} />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("defaultPort")}</label>
                                        <input
                                            type="text"
                                            value={syslogConfig.port}
                                            onChange={(e) => setSyslogConfig(prev => ({ ...prev, port: e.target.value }))}
                                            placeholder="514"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                        />
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
                                        <button
                                            onClick={() => setUsbConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                                            className={`w-12 h-6 rounded-full transition-all relative ${usbConfig.enabled ? "bg-orange-600" : "bg-white/10"}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${usbConfig.enabled ? "left-7" : "left-1"}`} />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("usbPath")}</label>
                                        <input
                                            type="text"
                                            value={usbConfig.path}
                                            onChange={(e) => setUsbConfig(prev => ({ ...prev, path: e.target.value }))}
                                            placeholder="/Volumes/USB-STICK"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity size={14} className="text-green-400" />
                                    <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">{t("logRetention")}</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("retentionDays")}</label>
                                        <input
                                            type="number"
                                            value={retentionConfig.days}
                                            onChange={(e) => setRetentionConfig(prev => ({ ...prev, days: e.target.value }))}
                                            placeholder="30"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-green-500/50 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("maxEntries")}</label>
                                        <input
                                            type="number"
                                            value={retentionConfig.maxCount}
                                            onChange={(e) => setRetentionConfig(prev => ({ ...prev, maxCount: e.target.value }))}
                                            placeholder="50000"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-green-500/50 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <button
                                        onClick={clearAllLogs}
                                        disabled={isClearingLogs}
                                        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${showDeleteConfirm
                                            ? "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                                            : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                                            }`}
                                    >
                                        {isClearingLogs ? t("deleting") : showDeleteConfirm ? t("nowIrrevocablyDelete") : t("clearAllLogs")}
                                    </button>
                                    {showDeleteConfirm && (
                                        <button
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="w-full mt-2 text-[10px] text-white/30 hover:text-white uppercase font-bold tracking-widest"
                                        >
                                            {t("cancel")}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-white/5">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <Shield size={14} className="text-red-400" />
                                        <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">{t("securityAccess")}</h3>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20"
                                    >
                                        {t("logout")}
                                    </button>
                                </div>

                                <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-4">
                                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">{t("changeMasterPassword")}</h4>
                                    <form onSubmit={changePassword} className="space-y-3">
                                        <input
                                            type="password"
                                            placeholder={t("currentPassword")}
                                            value={passwordForm.current}
                                            onChange={(e) => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50"
                                            required
                                        />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <input
                                                type="password"
                                                placeholder={t("newPassword")}
                                                value={passwordForm.new}
                                                onChange={(e) => setPasswordForm(p => ({ ...p, new: e.target.value }))}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50"
                                                required
                                            />
                                            <input
                                                type="password"
                                                placeholder={t("confirmPassword")}
                                                value={passwordForm.confirm}
                                                onChange={(e) => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50"
                                                required
                                            />
                                        </div>
                                        {passwordMessage.text && (
                                            <div className={`p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-center ${passwordMessage.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                                                {passwordMessage.text}
                                            </div>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={isChangingPassword}
                                            className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                        >
                                            {isChangingPassword ? t("saving") : t("updatePassword")}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            <button
                                onClick={saveSettings}
                                disabled={saving}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
                            >
                                {saving ? "..." : t("saveChanges")}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {activeTab === "AI" && (
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
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">
                                        {t("openaiApiKey")}
                                    </label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                        <input
                                            type="password"
                                            value={aiSettings.SECRET_OPENAI_KEY || ""}
                                            onChange={(e) => setAiSettings({ ...aiSettings, SECRET_OPENAI_KEY: e.target.value })}
                                            onBlur={(e) => fetchModels("openai", e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                                            placeholder="sk-..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">
                                        {t("anthropicApiKey")}
                                    </label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                        <input
                                            type="password"
                                            value={aiSettings.SECRET_ANTHROPIC_KEY || ""}
                                            onChange={(e) => setAiSettings({ ...aiSettings, SECRET_ANTHROPIC_KEY: e.target.value })}
                                            onBlur={(e) => fetchModels("anthropic", e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                                            placeholder="sk-ant-..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">
                                        {t("geminiApiKey")}
                                    </label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                        <input
                                            type="password"
                                            value={aiSettings.SECRET_GEMINI_KEY || ""}
                                            onChange={(e) => setAiSettings({ ...aiSettings, SECRET_GEMINI_KEY: e.target.value })}
                                            onBlur={(e) => fetchModels("gemini", e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                                            placeholder="AIza..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">
                                        {t("mistralApiKey")}
                                    </label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                        <input
                                            type="password"
                                            value={aiSettings.SECRET_MISTRAL_KEY || ""}
                                            onChange={(e) => setAiSettings({ ...aiSettings, SECRET_MISTRAL_KEY: e.target.value })}
                                            onBlur={(e) => fetchModels("mistral", e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                                            placeholder="your-key-here"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">
                                        {t("localLlmUrl")}
                                    </label>
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
                                {[
                                    { id: "openai", model: "AI_OPENAI_MODEL", label: "openaiModel" },
                                    { id: "anthropic", model: "AI_ANTHROPIC_MODEL", label: "anthropicModel" },
                                    { id: "gemini", model: "AI_GEMINI_MODEL", label: "geminiModel" },
                                    { id: "mistral", model: "AI_MISTRAL_MODEL", label: "mistralModel" },
                                    { id: "local", model: "AI_LOCAL_MODEL", label: "localLlmModel" },
                                ].map((p) => (
                                    <div key={p.id} className="space-y-2">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">
                                                {t(p.label as any)}
                                            </label>
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
                                            <button
                                                onClick={() => fetchModels(p.id)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-purple-400 transition-colors p-1"
                                                title="Refresh models"
                                            >
                                                <Sparkles size={14} className={isFetchingModels[p.id] ? "animate-pulse" : ""} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-white/5 my-2" />

                            {/* Provider Selection */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">
                                    {t("activeProvider")}
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {["openai", "anthropic", "gemini", "mistral", "local"].map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setAiSettings({ ...aiSettings, AI_ACTIVE_PROVIDER: p })}
                                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${aiSettings.AI_ACTIVE_PROVIDER === p ? "bg-purple-500/10 border-purple-500/40 text-white" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"}`}
                                        >
                                            <span className="font-bold capitalize text-xs">{p}</span>
                                            <div className={`w-1.5 h-1.5 rounded-full ${aiSettings.AI_ACTIVE_PROVIDER === p ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "bg-white/10"}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-white/5 my-2" />

                            {/* Toggles */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setAiSettings({ ...aiSettings, AI_AUTO_LEARNING: aiSettings.AI_AUTO_LEARNING === "true" ? "false" : "true" })}
                                    className={`flex items-start gap-4 p-5 rounded-2xl border transition-all text-left ${aiSettings.AI_AUTO_LEARNING === "true" ? "bg-blue-500/10 border-blue-500/40" : "bg-white/5 border-white/5 hover:bg-white/10"}`}
                                >
                                    <div className={`p-2 rounded-lg ${aiSettings.AI_AUTO_LEARNING === "true" ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-white/20"}`}>
                                        <Zap size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-sm tracking-tight">{t("aiAutoLearning")}</span>
                                            <div className={`w-2 h-2 rounded-full ${aiSettings.AI_AUTO_LEARNING === "true" ? "bg-blue-400 animate-pulse" : "bg-white/10"}`} />
                                        </div>
                                        <p className="text-[10px] text-white/40 leading-relaxed font-medium">
                                            {t("aiAutoLearningDesc")}
                                        </p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setAiSettings({ ...aiSettings, AI_VALIDATION_MODE: aiSettings.AI_VALIDATION_MODE === "true" ? "false" : "true" })}
                                    className={`flex items-start gap-4 p-5 rounded-2xl border transition-all text-left ${aiSettings.AI_VALIDATION_MODE === "true" ? "bg-purple-500/10 border-purple-500/40" : "bg-white/5 border-white/5 hover:bg-white/10"}`}
                                >
                                    <div className={`p-2 rounded-lg ${aiSettings.AI_VALIDATION_MODE === "true" ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-white/20"}`}>
                                        <Shield size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-sm tracking-tight">{t("aiValidation")}</span>
                                            <div className={`w-2 h-2 rounded-full ${aiSettings.AI_VALIDATION_MODE === "true" ? "bg-purple-400 animate-pulse" : "bg-white/10"}`} />
                                        </div>
                                        <p className="text-[10px] text-white/40 leading-relaxed font-medium">
                                            {t("aiValidationDesc")}
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Save Button Overlay */}
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={saveSettings}
                                disabled={saving}
                                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
                            >
                                <Save size={16} />
                                {saving ? t("saving") : t("saveChanges")}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {activeTab === "SOURCES" && (
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("deviceName")}</label>
                                <input
                                    type="text"
                                    value={newSourceName}
                                    onChange={(e) => setNewSourceName(e.target.value)}
                                    placeholder="e.g. Gateway"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-500/50 transition-colors"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("ipAddress")}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSourceIp}
                                        onChange={(e) => setNewSourceIp(e.target.value)}
                                        placeholder="192.168.1.1"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-500/50 transition-colors"
                                    />
                                    <button
                                        onClick={createSource}
                                        disabled={isCreatingSource}
                                        className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-xl h-[38px] w-[38px] flex items-center justify-center transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
                                    >
                                        {isCreatingSource ? (
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Plus size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

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
                                                <div className="font-bold text-sm tracking-tight flex items-center gap-2">
                                                    {s.name}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-white/30 font-mono bg-black/40 px-1.5 py-0.5 rounded leading-none">
                                                        {s.ipAddress}
                                                    </span>
                                                    <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
                                                        {s.lastSeen ? `${t("lastSeen")}: ${new Date(s.lastSeen).toLocaleTimeString()}` : t("neverSeen")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteSource(s.id)}
                                            className="p-2 text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                );
                            })}
                            {sources.length === 0 && (
                                <div className="col-span-full text-center py-12 text-white/10 border-2 border-dashed border-white/5 rounded-3xl">
                                    {t("noDevicesConfigured")}
                                </div>
                            )}
                        </div>

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
            )}

            {activeTab === "PARSERS" && (
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("parserName")}</label>
                                <input
                                    type="text"
                                    value={newParser.name}
                                    onChange={(e) => setNewParser(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. SSH Hunter"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("regexPattern")}</label>
                                <input
                                    type="text"
                                    value={newParser.pattern}
                                    onChange={(e) => setNewParser(prev => ({ ...prev, pattern: e.target.value }))}
                                    placeholder="failed password for .* from (\d+\.\d+\.\d+\.\d+)"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("interpretation")}</label>
                                <input
                                    type="text"
                                    value={newParser.interpretation}
                                    onChange={(e) => setNewParser(prev => ({ ...prev, interpretation: e.target.value }))}
                                    placeholder={t("interpretation")}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="space-y-1 flex-1">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t("category")}</label>
                                    <select
                                        value={newParser.category}
                                        onChange={(e) => setNewParser(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-colors text-white"
                                    >
                                        <option value="Info">Info</option>
                                        <option value="System">System</option>
                                        <option value="Config">Config</option>
                                        <option value="Security">Security</option>
                                    </select>
                                </div>
                                <button
                                    onClick={createParser}
                                    className="self-end bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-xl h-[38px] w-[38px] flex items-center justify-center transition-all shadow-lg shadow-purple-500/20"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {parsers.map((p) => (
                                <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-white/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${p.category === 'Security' ? 'bg-red-500/10 text-red-500' :
                                            p.category === 'Config' ? 'bg-orange-500/10 text-orange-500' :
                                                p.category === 'System' ? 'bg-blue-500/10 text-blue-500' :
                                                    'bg-white/10 text-white/40'
                                            }`}>
                                            {p.category.substring(0, 1)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm tracking-tight">{p.name}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-white/30 font-mono bg-black/40 px-1.5 py-0.5 rounded leading-none">
                                                    {p.pattern}
                                                </span>
                                                <span className="text-[10px] text-white/20 italic">
                                                    "{p.interpretation}"
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteParser(p.id)}
                                        className="p-2 text-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            {parsers.length === 0 && (
                                <div className="text-center py-12 text-white/10 border-2 border-dashed border-white/5 rounded-3xl">
                                    {t("noParsersConfigured")}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {activeTab === "GUIDE" && (
                <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="glass-card p-6 bg-blue-500/5 border-blue-500/20">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Settings size={18} className="text-blue-400" />
                            </div>
                            <h3 className="font-bold text-sm">{t("serverConfig")}</h3>
                        </div>
                        <p className="text-xs text-white/40 mb-4">{t("serverConfigDesc")}</p>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">{t("serverHostname")}</label>
                                    <input
                                        type="text"
                                        value={host}
                                        onChange={(e) => setHost(e.target.value)}
                                        placeholder="e.g. 192.168.1.50:3001"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        if (typeof window !== "undefined") setHost(window.location.host);
                                    }}
                                    className="self-end px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-all"
                                >
                                    {t("reset")}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <section className="glass-card p-6 flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                                    <Monitor size={20} className="text-blue-400" />
                                </div>
                                <h2 className="text-lg font-bold">{t("windows")}</h2>
                            </div>
                            <p className="text-sm text-white/60 mb-6 font-medium">{t("psDesc")}</p>
                            <div className="relative flex-1 group">
                                <pre className="bg-black/60 rounded-xl p-4 text-[10px] font-mono text-blue-300 overflow-x-auto h-full border border-white/5 whitespace-pre-wrap">
                                    {snippets.powershell}
                                </pre>
                                <button
                                    onClick={() => copyToClipboard(snippets.powershell)}
                                    className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                >
                                    {copying === snippets.powershell ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </section>

                        <section className="glass-card p-6 flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
                                    <Terminal size={20} className="text-green-400" />
                                </div>
                                <h2 className="text-lg font-bold">{t("linux")}</h2>
                            </div>
                            <p className="text-sm text-white/60 mb-6 font-medium">{t("linuxDesc")}</p>
                            <div className="relative flex-1 group">
                                <pre className="bg-black/60 rounded-xl p-4 text-[10px] font-mono text-green-300 overflow-x-auto h-full border border-white/5 whitespace-pre-wrap">
                                    {snippets.curl}
                                </pre>
                                <button
                                    onClick={() => copyToClipboard(snippets.curl)}
                                    className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                >
                                    {copying === snippets.curl ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </section>

                        <section className="glass-card p-6 flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-gray-500/20 rounded-lg border border-gray-500/30">
                                    <Apple size={20} className="text-gray-400" />
                                </div>
                                <h2 className="text-lg font-bold">{t("macos")}</h2>
                            </div>
                            <p className="text-sm text-white/60 mb-6 font-medium">{t("macDesc")}</p>
                            <div className="relative flex-1 group">
                                <pre className="bg-black/60 rounded-xl p-4 text-[10px] font-mono text-gray-300 overflow-x-auto h-full border border-white/5 whitespace-pre-wrap">
                                    {snippets.macos}
                                </pre>
                                <button
                                    onClick={() => copyToClipboard(snippets.macos)}
                                    className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                >
                                    {copying === snippets.macos ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </section>

                        <section className="glass-card p-6 flex flex-col md:col-span-3 border-2 border-purple-500/30 overflow-hidden">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
                                    <Activity size={20} className="text-purple-400" />
                                </div>
                                <h2 className="text-lg font-bold">{t("autoReporter")}</h2>
                            </div>
                            <p className="text-sm text-white/60 mb-6 font-medium">{t("autoReporterDesc")}</p>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="space-y-4 relative group flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
                                            <Monitor size={14} />
                                        </div>
                                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest block">{t("windowsAutomation")}</span>
                                    </div>
                                    <pre className="bg-black/60 rounded-xl p-4 text-[9px] font-mono text-blue-300 overflow-x-auto border border-white/5 whitespace-pre-wrap flex-1 min-h-[120px]">
                                        {snippets.winAuto}
                                    </pre>
                                    <button
                                        onClick={() => copyToClipboard(snippets.winAuto)}
                                        className="absolute top-8 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        {copying === snippets.winAuto ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                    </button>
                                    <p className="text-[10px] text-white/20 italic">{t("winAutoDesc")}</p>
                                </div>

                                <div className="space-y-4 relative group flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-green-500/10 rounded-lg text-green-400">
                                            <Terminal size={14} />
                                        </div>
                                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest block">{t("linuxAutomation")}</span>
                                    </div>
                                    <pre className="bg-black/60 rounded-xl p-4 text-[9px] font-mono text-green-300 overflow-x-auto border border-white/5 whitespace-pre-wrap flex-1 min-h-[120px]">
                                        {snippets.rsyslog}
                                    </pre>
                                    <button
                                        onClick={() => copyToClipboard(snippets.rsyslog)}
                                        className="absolute top-8 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        {copying === snippets.rsyslog ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                    </button>
                                    <p className="text-[10px] text-white/20 italic">{t("linuxAutoDesc")}</p>
                                </div>

                                <div className="space-y-4 relative group flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-gray-500/10 rounded-lg text-gray-400">
                                            <Apple size={14} />
                                        </div>
                                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest block">{t("macosAutomation")}</span>
                                    </div>
                                    <pre className="bg-black/60 rounded-xl p-4 text-[9px] font-mono text-gray-300 overflow-x-auto border border-white/5 whitespace-pre-wrap flex-1 min-h-[120px]">
                                        {snippets.macAuto}
                                    </pre>
                                    <button
                                        onClick={() => copyToClipboard(snippets.macAuto)}
                                        className="absolute top-8 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        {copying === snippets.macAuto ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                    </button>
                                    <p className="text-[10px] text-white/20 italic">{t("macAutoDesc")}</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}
