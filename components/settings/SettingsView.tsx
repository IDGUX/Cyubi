"use client";

import { Settings, Monitor, Activity, List, Sparkles } from "lucide-react";
import { useSettings } from "./useSettings";
import GeneralTab from "./GeneralTab";
import SourcesTab from "./SourcesTab";
import ParsersTab from "./ParsersTab";
import AITab from "./AITab";
import GuideTab from "./GuideTab";

const TABS = [
    { id: "GENERAL" as const, icon: Settings, labelKey: "general" },
    { id: "SOURCES" as const, icon: Monitor, labelKey: "devicesSources" },
    { id: "PARSERS" as const, icon: Activity, labelKey: "logParsers" },
    { id: "GUIDE" as const, icon: List, labelKey: "integrationGuide" },
    { id: "AI" as const, icon: Sparkles, labelKey: "aiIntelligence" },
] as const;

export default function SettingsView() {
    const settings = useSettings();
    const { t, activeTab, setActiveTab } = settings;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-8 bg-white/5 p-1 rounded-xl w-full sm:w-fit justify-center sm:justify-start">
                {TABS.map(({ id, icon: Icon, labelKey }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeTab === id ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
                    >
                        <Icon size={14} /> <span className="truncate">{t(labelKey)}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "GENERAL" && <GeneralTab {...settings} />}
            {activeTab === "SOURCES" && <SourcesTab {...settings} />}
            {activeTab === "PARSERS" && <ParsersTab {...settings} />}
            {activeTab === "AI" && <AITab {...settings} />}
            {activeTab === "GUIDE" && <GuideTab {...settings} />}
        </div>
    );
}
