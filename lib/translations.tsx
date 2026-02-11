"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "de" | "en";

interface Translations {
    [key: string]: {
        [lang in Language]: string;
    };
}

export const translations: Translations = {
    // General UI
    systemStatus: { de: "System Status", en: "System Status" },
    operational: { de: "Operational", en: "Operational" },
    centralLogManagement: { de: "Zentrales Log-Management", en: "Centralized Log Management" },
    intelligentAnalysis: { de: "Intelligente Analyse", en: "Intelligent Analysis" },
    logs: { de: "Logs", en: "Logs" },
    stream: { de: "Stream", en: "Stream" },
    settings: { de: "Einstellungen", en: "Settings" },
    share: { de: "Teilen", en: "Share" },
    masterAdmin: { de: "Master Admin", en: "Master Admin" },
    adminControls: { de: "Admin Steuerung", en: "Admin Controls" },
    logout: { de: "Abmelden", en: "Logout" },
    endSession: { de: "Sitzung beenden", en: "End Session" },
    systemSecurity: { de: "System & Sicherheit", en: "System & Security" },
    searchLogs: { de: "Logs durchsuchen...", en: "Search logs..." },
    noEntries: { de: "Keine Einträge gefunden", en: "No entries found" },
    healthScore: { de: "Gesundheits-Score", en: "Health Score" },
    safe: { de: "Sicher", en: "Safe" },
    warning: { de: "Warnung", en: "Warning" },
    critical: { de: "Kritisch", en: "Critical" },
    status: { de: "Status", en: "Status" },

    // Login & Setup
    terminalSetup: { de: "Terminal Setup", en: "Terminal Setup" },
    adminLogin: { de: "Administrator Login", en: "Administrator Login" },
    setMasterPassword: { de: "Master Passwort setzen", en: "Set Master Password" },
    authKey: { de: "Authentifizierungsschlüssel", en: "Authentication Key" },
    confirmKey: { de: "Schlüssel bestätigen", en: "Confirm Key" },
    authFailed: { de: "Authentifizierung fehlgeschlagen", en: "Authentication failed" },
    connError: { de: "Verbindungsfehler", en: "Connection error" },
    completeSetup: { de: "Setup abschließen", en: "Complete Setup" },
    requestAccess: { de: "Zugriff anfordern", en: "Request Access" },
    authServerActive: { de: "Auth Server Aktiv", en: "Auth Server Active" },
    tlsEncrypted: { de: "TLS Verschlüsselt", en: "TLS Encrypted" },
    passwordsDoNotMatch: { de: "Passwörter stimmen nicht überein", en: "Passwords do not match" },
    passwordTooShort: { de: "Passwort muss mindestens 6 Zeichen lang sein", en: "Password must be at least 6 characters" },
    initializingExpertSystem: { de: "Initialisiere Expert System...", en: "Initializing Expert System..." },

    // Settings Navigation
    general: { de: "Allgemein", en: "General" },
    devicesSources: { de: "Geräte / Quellen", en: "Devices / Sources" },
    logParsers: { de: "Log-Parser", en: "Log Parsers" },
    integrationGuide: { de: "Integrations-Leitfaden", en: "Integration Guide" },

    // General Settings tab
    language: { de: "Systemsprache", en: "System Language" },
    selectLanguage: { de: "Sprache auswählen", en: "Select Language" },
    german: { de: "Deutsch", en: "German" },
    english: { de: "Englisch", en: "English" },
    statusInfo: { de: "Alle Systeme sind betriebsbereit.", en: "All systems operational." },
    firewallNote: { de: "Bitte stelle sicher, dass diese Ports in deiner Firewall freigegeben sind.", en: "Please ensure these ports are open in your firewall." },
    notifications: { de: "Zentrale Benachrichtigungen", en: "Centralized Notifications" },
    notificationsDesc: { de: "Hier kannst du festlegen, wann und wohin Alarme gesendet werden.", en: "Set when and where alerts are sent." },
    webhookTargets: { de: "Webhook Alarm-Ziele", en: "Webhook Alert Targets" },
    webhookNamePlaceholder: { de: "Name", en: "Name" },
    webhookUrlPlaceholder: { de: "URL", en: "URL" },
    noWebhooks: { de: "Noch keine Webhooks konfiguriert", en: "No webhooks configured yet" },
    alertFilters: { de: "Benachrichtigungs-Filter", en: "Notification Filters" },
    active: { de: "Aktiv", en: "Active" },
    inactive: { de: "Inaktiv", en: "Inactive" },
    syslogReceiver: { de: "Syslog-Empfänger", en: "Syslog Receiver" },
    syslogDesc: { de: "Logs von Routern/Switchen empfangen.", en: "Receive logs from routers/switches." },
    defaultPort: { de: "Standard Port", en: "Default Port" },
    usbArchive: { de: "Flash-Archive (USB)", en: "Flash Archive (USB)" },
    usbSync: { de: "Echtzeit USB-Sync", en: "Real-time USB Sync" },
    usbDesc: { de: "Logs sofort physisch sichern.", en: "Backup logs physically in real-time." },
    usbPath: { de: "USB Zielpfad", en: "USB Destination Path" },
    logRetention: { de: "Vorhaltezeit & Speicher", en: "Retention & Storage" },
    retentionDays: { de: "Logs aufbewahren (Tage)", en: "Keep logs (Days)" },
    maxEntries: { de: "Maximale Logs in DB", en: "Max logs in DB" },
    autoDelete: { de: "Alte Logs automatisch löschen", en: "Auto-delete old logs" },
    securityAccess: { de: "Sicherheit & Zugang", en: "Security & Access" },
    changeMasterPassword: { de: "Master-Passwort ändern", en: "Change Master Password" },
    currentPassword: { de: "Aktuelles Passwort", en: "Current Password" },
    newPassword: { de: "Neues Master Passwort", en: "New Master Password" },
    confirmPassword: { de: "Passwort bestätigen", en: "Confirm Password" },
    updatePassword: { de: "Passwort aktualisieren", en: "Update Password" },
    saveChanges: { de: "Änderungen speichern", en: "Save changes" },
    saveChangesSuccess: { de: "Änderungen gespeichert", en: "Changes saved" },
    saveChangesError: { de: "Fehler beim Speichern", en: "Error saving changes" },
    applyChanges: { de: "Konfiguration übernehmen", en: "Apply configuration" },
    saving: { de: "Wird gespeichert...", en: "Saving..." },
    deleting: { de: "Lösche...", en: "Deleting..." },
    cancel: { de: "Abbrechen", en: "Cancel" },
    dangerZone: { de: "Gefahrenzone", en: "Danger Zone" },
    clearLogs: { de: "Alle Logs löschen", en: "Clear all logs" },
    clearAllLogs: { de: "Alle Logs unwiderruflich löschen", en: "Irrevocably delete all logs" },
    clearLogsDesc: { de: "Dies kann nicht rückgängig gemacht werden. Alle Daten gehen verloren.", en: "This cannot be undone. All data will be lost." },
    clearNow: { de: "Jetzt löschen", en: "Clear Now" },
    nowIrrevocablyDelete: { de: "JETZT ENDGÜLTIG LÖSCHEN?", en: "IRREVOCABLY DELETE NOW?" },
    passwordChanged: { de: "Passwort erfolgreich geändert!", en: "Password changed successfully!" },
    passwordError: { de: "Fehler beim Ändern des Passworts", en: "Error changing password" },
    logsDeleted: { de: "Alle Logs wurden erfolgreich gelöscht.", en: "All logs successfully deleted." },
    deleteError: { de: "Fehler beim Löschen", en: "Error deleting logs" },
    deleteConnError: { de: "Verbindungsfehler beim Löschen", en: "Connection error during deletion" },
    copyError: { de: "Kopieren nicht möglich. Bitte manuell markieren.", en: "Copying not possible. Please mark manually." },
    devicePrefix: { de: "Gerät", en: "Device" },
    unknownDevicesDetected: { de: "Unbekannte Geräte entdeckt (Auto-Discovery)", en: "Unknown Devices Detected (Auto-Discovery)" },
    sourceIP: { de: "Quell-IP", en: "Source IP" },
    add: { de: "Hinzufügen", en: "Add" },

    // Devices & Sources
    registeredDevices: { de: "Registrierte Geräte", en: "Registered Devices" },
    devicesDesc: { de: "Verwalte bekannte Quellen und ihre IP-Adressen.", en: "Manage known sources and their IP addresses." },
    deviceName: { de: "Gerätename", en: "Device Name" },
    ipAddress: { de: "IP-Adresse", en: "IP Address" },
    addSource: { de: "Quelle hinzufügen", en: "Add Source" },
    lastSeen: { de: "Zuletzt", en: "Last seen" },
    neverSeen: { de: "Noch nie gesehen", en: "Never seen" },
    noDevicesConfigured: { de: "Keine Geräte konfiguriert", en: "No devices configured" },
    unknownSources: { de: "Unbekannte Quellen (Letzte 24h)", en: "Unknown Sources (Last 24h)" },
    unknownSourcesDesc: { de: "IPs, die Logs gesendet haben, aber nicht registriert sind.", en: "IPs that sent logs but are not registered." },
    register: { de: "Registrieren", en: "Register" },
    unknownDevice: { de: "Unbekannt", en: "Unknown" },

    // Intelligence & Parsers
    customLogParsers: { de: "Eigene Log-Parser", en: "Custom Log Parsers" },
    parsersDesc: { de: "Definiere Muster (Regex), um Raw-Logs in verständliche Sätze zu übersetzen.", en: "Define patterns (Regex) to translate raw logs into readable sentences." },
    parserName: { de: "Name des Parsers", en: "Parser Name" },
    regexPattern: { de: "Regex Muster", en: "Regex Pattern" },
    category: { de: "Kategorie", en: "Category" },
    interpretation: { de: "Interpretation (Variablen: $1, $2)", en: "Interpretation (Variables: $1, $2)" },
    addParser: { de: "Parser hinzufügen", en: "Add Parser" },
    noParsersConfigured: { de: "Keine Custom Parsers konfiguriert", en: "No custom parsers configured" },

    // Integration Guide
    serverConfig: { de: "Server-Konfiguration für Integrationen", en: "Server Configuration for Integrations" },
    serverConfigDesc: { de: "Ergänze optional die Server-Adresse an, um die Snippets anzupassen.", en: "Optional: Add the server address to customize the snippets." },
    serverHostname: { de: "Server Hostname", en: "Server Hostname" },
    reset: { de: "Reset", en: "Reset" },
    windows: { de: "Windows", en: "Windows" },
    linux: { de: "Linux", en: "Linux" },
    macos: { de: "macOS", en: "macOS" },
    psDesc: { de: "PowerShell für Windows-Ereignisse.", en: "PowerShell for Windows events." },
    linuxDesc: { de: "Standard cURL für Linux & Server.", en: "Standard cURL for Linux & servers." },
    macDesc: { de: "Einfacher cURL Befehl für Mac-User.", en: "Simple cURL command for Mac users." },
    windowsAutomation: { de: "Windows Automatisierung", en: "Windows Automation" },
    linuxAutomation: { de: "Linux Automatisierung", en: "Linux Automation" },
    macosAutomation: { de: "macOS Automatisierung", en: "macOS Automation" },
    linuxStandard: { de: "Linux (cURL)", en: "Linux (cURL)" },
    macStandard: { de: "macOS (cURL)", en: "macOS (cURL)" },
    autoReporter: { de: "Dauerhafte Einrichtung (Vollautomatisch)", en: "Permanent Setup (Fully Automated)" },
    autoReporterDesc: { de: "Damit der Rechner automatisch & dauerhaft Logs sendet.", en: "So the computer sends logs automatically & permanently." },
    winAutoDesc: { de: "Erstellt eine Windows-Aufgabe, die alle 5 Min den Puls sendet.", en: "Creates a Windows task that sends the pulse every 5 mins." },
    linuxAutoDesc: { de: "Echtzeit-Streaming via rsyslog (UDP 514). Maximale Power.", en: "Real-time streaming via rsyslog (UDP 514). Maximum power." },
    macAutoDesc: { de: "Nutzt LaunchAgents, um den Mac permanent zu überwachen.", en: "Uses LaunchAgents for permanent Mac monitoring." },
    copy: { de: "Kopieren", en: "Copy" },
    copied: { de: "Kopiert!", en: "Copied!" },
    rsyslogHeader: { de: "# Sendet ALLES an LogVault (via UDP 514)", en: "# Sends EVERYTHING to LogVault (via UDP 514)" },
    cronjobHeader: { de: "# Füge dies in die Crontab ein (crontab -e), um alle 5 Minuten zu senden:", en: "# Add this to crontab (crontab -e) to send every 5 minutes:" },
    winAutoHeader: { de: "# PowerShell Script für permanenten Herzschlag (In Aufgabenplanung legen):", en: "# PowerShell script for permanent heartbeat (Add to Task Scheduler):" },
    macAutoHeader: { de: "# macOS LaunchAgent für automatische Logs:", en: "# macOS LaunchAgent for automatic logs:" },

    // Chart & Dashboard
    logVolume: { de: "Live Log-Volumen (15 Min)", en: "Live Log Volume (15 Min)" },
    total: { de: "Gesamt", en: "Total" },
    errors: { de: "Fehler", en: "Errors" },
    all: { de: "Alle", en: "All" },
    security: { de: "Sicherheit", en: "Security" },
    config: { de: "Konfiguration", en: "Configuration" },
    system: { de: "System", en: "System" },
    // AI & Intelligence
    aiIntelligence: { de: "KI-Intelligenz", en: "AI Intelligence" },
    aiAnalysis: { de: "KI-Analyse", en: "AI Analysis" },
    aiAutoLearning: { de: "KI-Auto-Lernen", en: "AI Auto-Learning" },
    aiAutoLearningDesc: { de: "KI erstellt automatisch Parser-Regeln für unbekannte Logs.", en: "AI automatically creates parser rules for unknown logs." },
    aiValidation: { de: "KI-Validierung", en: "AI Validation" },
    aiValidationDesc: { de: "Regelmäßige Prüfung lokaler Regeln durch die KI zur Fehlerprävention.", en: "Periodic checking of local rules by AI to prevent errors." },
    aiVerified: { de: "KI Verifiziert", en: "AI Verified" },
    aiSuggestion: { de: "KI Vorschlag", en: "AI Suggestion" },
    saveAiRule: { de: "Diese Regel für die Zukunft speichern?", en: "Save this rule for next time?" },
    aiProvider: { de: "KI-Anbieter", en: "AI Provider" },
    openaiApiKey: { de: "OpenAI API Key (GPT-4o)", en: "OpenAI API Key (GPT-4o)" },
    anthropicApiKey: { de: "Claude API Key (3.5 Sonnet)", en: "Claude API Key (3.5 Sonnet)" },
    geminiApiKey: { de: "Gemini API Key (Flash/Pro)", en: "Gemini API Key (Flash/Pro)" },
    activeProvider: { de: "Aktiver Anbieter", en: "Active Provider" },
    modelSelection: { de: "Modell Auswahl", en: "Model Selection" },
    openaiModel: { de: "OpenAI Modell", en: "OpenAI Model" },
    anthropicModel: { de: "Claude Modell", en: "Claude Model" },
    geminiModel: { de: "Gemini Modell", en: "Gemini Model" },
    mistralApiKey: { de: "Mistral API Key", en: "Mistral API Key" },
    mistralModel: { de: "Mistral Modell", en: "Mistral Model" },
    localLlmUrl: { de: "Lokale LLM URL (Ollama)", en: "Local LLM URL (Ollama)" },
    localLlmModel: { de: "Lokales Modell Name", en: "Local Model Name" },
    zeroKnowledgeNote: { de: "Kein technisches Wissen nötig. Die KI übernimmt die Konfiguration.", en: "No technical knowledge required. AI handles the configuration." },
    analyzeNow: { de: "Jetzt analysieren", en: "Analyze Now" },
    learningPhase: { de: "Lern-Phase", en: "Learning Phase" },
    testConn: { de: "Verbindung testen", en: "Test Connection" },
    testConnection: { de: "Verbindung testen", en: "Test Connection" },
    testing: { de: "Test läuft...", en: "Testing..." },
    providerSetup: { de: "Provider Einrichtung", en: "Provider Setup" },
    connectionTestSuccess: { de: "Verbindung erfolgreich", en: "Connection Successful" },
    connectionTestFailed: { de: "Verbindung fehlgeschlagen", en: "Connection Failed" },
    aiSampleOutput: { de: "KI-Output (Test-Vorschau)", en: "AI Output (Test Preview)" },
    interpretationPrefix: { de: "KI Interpretation", en: "AI Interpretation" },

    // Share Modal
    close: { de: "Schließen", en: "Close" },
    copyFailed: { de: "Kopieren fehlgeschlagen.", en: "Copy failed." },
    shareAnonymizedHint: { de: "IP-Adressen und MAC-Adressen wurden automatisch zensiert (x.x.x.x). Perfekt für Reddit, Discord oder Foren.", en: "IP addresses and MAC addresses have been automatically redacted (x.x.x.x). Perfect for Reddit, Discord or forums." },
};

interface TranslationContextType {
    t: (key: string) => string;
    language: Language;
    setLanguage: (lang: Language) => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>("de");

    useEffect(() => {
        const savedLang = localStorage.getItem("logvault_lang") as Language;
        if (savedLang && (savedLang === "de" || savedLang === "en")) {
            setLanguageState(savedLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("logvault_lang", lang);
    };

    const t = (key: string) => {
        if (!translations[key]) {
            console.warn(`Translation key missing: ${key}`);
            return key;
        }
        return translations[key][language];
    };

    return (
        <TranslationContext.Provider value={{ t, language, setLanguage }}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error("useTranslation must be used within a TranslationProvider");
    }
    return context;
}
