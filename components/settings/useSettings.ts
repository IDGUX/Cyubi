"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/translations";

// ─── Types ────────────────────────────────────────────────────────────
export interface SettingsState {
    webhookUrl: string;
    alertConfig: Record<string, boolean>;
    syslogConfig: { enabled: boolean; port: string };
    usbConfig: { enabled: boolean; path: string };
    retentionConfig: { days: string; maxCount: string };
    aiSettings: AISettings;
}

export interface AISettings {
    SECRET_OPENAI_KEY: string;
    SECRET_ANTHROPIC_KEY: string;
    SECRET_GEMINI_KEY: string;
    SECRET_MISTRAL_KEY: string;
    AI_ACTIVE_PROVIDER: string;
    AI_OPENAI_MODEL: string;
    AI_ANTHROPIC_MODEL: string;
    AI_GEMINI_MODEL: string;
    AI_MISTRAL_MODEL: string;
    AI_LOCAL_URL: string;
    AI_LOCAL_MODEL: string;
    AI_AUTO_LEARNING: string;
    AI_VALIDATION_MODE: string;
}

export interface Source {
    id: string;
    name: string;
    ipAddress: string;
    lastSeen: string | null;
}

export interface Webhook {
    id: string;
    name: string;
    url: string;
}

export interface Parser {
    id: string;
    name: string;
    pattern: string;
    category: string;
    interpretation: string;
}

// ─── Default Values ───────────────────────────────────────────────────
const DEFAULT_AI_SETTINGS: AISettings = {
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
};

// ─── Hook ─────────────────────────────────────────────────────────────
export function useSettings() {
    const { t, language, setLanguage } = useTranslation();

    // Tab state
    const [activeTab, setActiveTab] = useState<"GENERAL" | "SOURCES" | "GUIDE" | "PARSERS" | "AI">("GENERAL");

    // Core settings
    const [webhookUrl, setWebhookUrl] = useState("");
    const [alertConfig, setAlertConfig] = useState<Record<string, boolean>>({
        SECURITY: true, CONFIG: false, SYSTEM: false, INFO: false,
    });
    const [syslogConfig, setSyslogConfig] = useState({ enabled: false, port: "514" });
    const [usbConfig, setUsbConfig] = useState({ enabled: false, path: "/Volumes/LOGVAULT" });
    const [retentionConfig, setRetentionConfig] = useState({ days: "30", maxCount: "50000" });

    // AI
    const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
    const [availableModels, setAvailableModels] = useState<Record<string, string[]>>({
        openai: [], anthropic: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
        gemini: [], mistral: [], local: [],
    });
    const [isFetchingModels, setIsFetchingModels] = useState<Record<string, boolean>>({});
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<any | null>(null);

    // Sources
    const [sources, setSources] = useState<Source[]>([]);
    const [unknownSources, setUnknownSources] = useState<string[]>([]);
    const [newSourceName, setNewSourceName] = useState("");
    const [newSourceIp, setNewSourceIp] = useState("");
    const [isCreatingSource, setIsCreatingSource] = useState(false);

    // Webhooks
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [newWebhookName, setNewWebhookName] = useState("");
    const [newWebhookUrl, setNewWebhookUrl] = useState("");

    // Parsers
    const [parsers, setParsers] = useState<Parser[]>([]);
    const [newParser, setNewParser] = useState({ name: "", pattern: "", category: "Info", interpretation: "" });

    // Security
    const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
    const [passwordMessage, setPasswordMessage] = useState({ text: "", type: "" as "error" | "success" | "" });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // UI state
    const [saving, setSaving] = useState(false);
    const [isClearingLogs, setIsClearingLogs] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [copying, setCopying] = useState<string | null>(null);
    const [host, setHost] = useState("localhost:3000");

    // ─── Data Fetching ────────────────────────────────────────────────
    const fetchSources = useCallback(async () => {
        try {
            const res = await fetch("/api/sources");
            const data = await res.json();
            setSources(Array.isArray(data) ? data : []);
        } catch { /* silent */ }
    }, []);

    const fetchUnknownSources = useCallback(async () => {
        try {
            const res = await fetch("/api/sources/unknown");
            const data = await res.json();
            if (Array.isArray(data)) setUnknownSources(data);
        } catch { /* silent */ }
    }, []);

    const fetchWebhooks = useCallback(async () => {
        try {
            const res = await fetch("/api/webhooks");
            const data = await res.json();
            setWebhooks(Array.isArray(data) ? data : []);
        } catch { /* silent */ }
    }, []);

    const fetchParsers = useCallback(async () => {
        try {
            const res = await fetch("/api/parsers");
            const data = await res.json();
            if (Array.isArray(data)) setParsers(data);
        } catch { /* silent */ }
    }, []);

    const fetchSettings = useCallback(async () => {
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
        } catch { /* silent */ }
    }, []);

    // ─── Initialization ───────────────────────────────────────────────
    useEffect(() => {
        fetchSettings();
        fetchSources();
        fetchWebhooks();
        fetchParsers();
        fetchUnknownSources();
        if (typeof window !== "undefined") setHost(window.location.host);

        const interval = setInterval(() => {
            fetchSources();
            fetchUnknownSources();
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchSettings, fetchSources, fetchWebhooks, fetchParsers, fetchUnknownSources]);

    // ─── Actions ──────────────────────────────────────────────────────
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
                ...Object.fromEntries(Object.entries(aiSettings)),
            };
            await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
        } catch { /* silent */ }
        setSaving(false);
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
        } catch { /* silent */ }
    };

    const deleteWebhook = async (id: string) => {
        try {
            await fetch(`/api/webhooks/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" } });
            fetchWebhooks();
        } catch { /* silent */ }
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
        } catch { /* silent */ }
    };

    const deleteParser = async (id: string) => {
        try {
            await fetch(`/api/parsers/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" } });
            fetchParsers();
        } catch { /* silent */ }
    };

    const createSource = async () => {
        if (!newSourceName || !newSourceIp) return;
        setIsCreatingSource(true);
        try {
            const res = await fetch("/api/sources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newSourceName, ipAddress: newSourceIp }),
            });
            if (res.ok) {
                setNewSourceName("");
                setNewSourceIp("");
                await fetchSources();
            } else {
                const errorData = await res.json();
                alert(t("deleteError") + ": " + (errorData.detail || errorData.error || "Unknown"));
            }
        } catch {
            alert(t("deleteConnError"));
        } finally {
            setIsCreatingSource(false);
        }
    };

    const deleteSource = async (id: string) => {
        try {
            const res = await fetch(`/api/sources/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" } });
            if (res.ok) {
                fetchSources();
            } else {
                const err = await res.json();
                alert(t("deleteError") + ": " + (err.detail || err.error));
            }
        } catch {
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
        } catch { /* silent */ } finally {
            setIsFetchingModels(prev => ({ ...prev, [provider]: false }));
        }
    };

    useEffect(() => {
        if (activeTab === "AI") {
            ["openai", "gemini", "mistral", "local"].forEach(p => fetchModels(p));
        }
    }, [activeTab]);

    const testConnection = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const provider = aiSettings.AI_ACTIVE_PROVIDER;
            const apiKey = provider === "openai" ? aiSettings.SECRET_OPENAI_KEY :
                provider === "anthropic" ? aiSettings.SECRET_ANTHROPIC_KEY :
                    provider === "gemini" ? aiSettings.SECRET_GEMINI_KEY :
                        provider === "mistral" ? aiSettings.SECRET_MISTRAL_KEY : "";

            const res = await fetch("/api/ai/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider,
                    apiKey,
                    model: (aiSettings as any)[`AI_${provider.toUpperCase()}_MODEL`],
                    baseUrl: aiSettings.AI_LOCAL_URL,
                    lang: language,
                }),
            });
            setTestResult(await res.json());
        } catch {
            setTestResult({ success: false, message: "Connection failed internally." });
        } finally {
            setTesting(false);
        }
    };

    const toggleAlert = (category: string) => {
        setAlertConfig(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const logout = async () => {
        try {
            await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "logout" }),
            });
            window.location.href = "/login";
        } catch { /* silent */ }
    };

    const changePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.new !== passwordForm.confirm) {
            setPasswordMessage({ text: t("passwordsDoNotMatch"), type: "error" });
            return;
        }
        if (passwordForm.new.length < 6) {
            setPasswordMessage({ text: t("passwordTooShort"), type: "error" });
            return;
        }
        setIsChangingPassword(true);
        setPasswordMessage({ text: "", type: "" });
        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "change-password", currentPassword: passwordForm.current, newPassword: passwordForm.new }),
            });
            const data = await res.json();
            setPasswordMessage(res.ok
                ? { text: t("passwordChanged"), type: "success" }
                : { text: data.error || t("passwordError"), type: "error" }
            );
        } catch {
            setPasswordMessage({ text: t("connError"), type: "error" });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const clearAllLogs = async () => {
        if (!showDeleteConfirm) { setShowDeleteConfirm(true); return; }
        setIsClearingLogs(true);
        try {
            const res = await fetch("/api/logs", { method: "DELETE" });
            if (res.ok) { alert(t("logsDeleted")); setShowDeleteConfirm(false); }
        } catch { /* silent */ } finally {
            setIsClearingLogs(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopying(text);
            setTimeout(() => setCopying(null), 2000);
        } catch {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
                setCopying(text);
                setTimeout(() => setCopying(null), 2000);
            } catch {
                alert(t("copyError"));
            }
        }
    };

    const isOnline = (lastSeen: string | null) => {
        if (!lastSeen) return false;
        return (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60) < 5;
    };

    // ─── Return ───────────────────────────────────────────────────────
    return {
        // Translation
        t, language, setLanguage,
        // Tab
        activeTab, setActiveTab,
        // Settings
        webhookUrl, setWebhookUrl,
        alertConfig, toggleAlert,
        syslogConfig, setSyslogConfig,
        usbConfig, setUsbConfig,
        retentionConfig, setRetentionConfig,
        saving, saveSettings,
        // AI
        aiSettings, setAiSettings,
        availableModels, isFetchingModels, fetchModels,
        testing, testResult, setTestResult, testConnection,
        // Sources
        sources, unknownSources,
        newSourceName, setNewSourceName,
        newSourceIp, setNewSourceIp,
        isCreatingSource, createSource, deleteSource, isOnline,
        // Webhooks
        webhooks, newWebhookName, setNewWebhookName,
        newWebhookUrl, setNewWebhookUrl,
        createWebhook, deleteWebhook,
        // Parsers
        parsers, newParser, setNewParser,
        createParser, deleteParser,
        // Security
        passwordForm, setPasswordForm,
        passwordMessage, isChangingPassword, changePassword,
        logout,
        // Danger zone
        isClearingLogs, showDeleteConfirm, setShowDeleteConfirm, clearAllLogs,
        // Utility
        copying, copyToClipboard, host, setHost,
    };
}

export type UseSettingsReturn = ReturnType<typeof useSettings>;
