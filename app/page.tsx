"use client";

import LogDashboard from "@/components/LogDashboard";
import { Shield } from "lucide-react";
import { useTranslation } from "@/lib/translations";

export default function Home() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-[#09090b] text-white p-6 md:p-12 selection:bg-white/10">
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto mb-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left w-full sm:w-auto">
          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <Shield className="text-white/80" size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">
              Log<span className="text-white/40">Vault</span>
            </h1>
          </div>
          <p className="text-[10px] sm:text-xs text-white/30 font-medium tracking-[0.2em] uppercase sm:ml-11 text-center sm:text-left">
            {t("centralLogManagement")} • {t("intelligentAnalysis")}
          </p>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div className="flex flex-col items-center sm:items-end">
            <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest leading-none mb-1">{t("systemStatus")}</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-white/60 uppercase">Operational</span>
            </div>
          </div>
        </div>
      </div>

      <LogDashboard />
    </main>
  );
}
