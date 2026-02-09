import { prisma } from "./prisma";

export interface AnalyzedLog {
  interpretation: string;
  category: "Security" | "Config" | "System" | "Info";
  deviceType: "Gateway" | "Server" | "IoT" | "WebApp" | "Windows" | "macOS" | "Unknown";
  isAiAnalyzed?: boolean;
  suggestedParser?: {
    pattern: string;
    interpretation: string;
    category: string;
  };
}

export async function analyzeLog(message: string, source: string): Promise<AnalyzedLog> {
  const msg = message.toLowerCase();
  const src = source.toLowerCase();

  // 1. Check for Custom Parser Rules from DB
  try {
    const customParsers = await prisma.logParser.findMany({
      where: { enabled: true },
      orderBy: { priority: "desc" }
    });

    for (const parser of customParsers) {
      try {
        const regex = new RegExp(parser.pattern, "i");
        if (regex.test(message)) {
          return {
            category: parser.category as any,
            interpretation: parser.interpretation,
            deviceType: "Unknown" // We could also make this customizable
          };
        }
      } catch (e) {
        console.error(`Invalid regex pattern in parser ${parser.name}:`, parser.pattern);
      }
    }
  } catch (e) {
    console.warn("Custom parsing fetch failed, falling back to static rules:", (e as any).message);
  }

  // 2. Detect Device Type (Static Rules)
  let deviceType: AnalyzedLog["deviceType"] = "Unknown";
  if (src.includes("gateway") || src.includes("router") || src.includes("firewall") || src.includes("usg") || src.includes("udm")) {
    deviceType = "Gateway";
  } else if (src.includes("proxmox") || src.includes("pve") || src.includes("node") || src.includes("server")) {
    deviceType = "Server";
  } else if (msg.includes("windows") || msg.includes("eventlog") || src.includes("win-") || msg.includes("service control manager")) {
    deviceType = "Windows";
  } else if (src.includes("app") || src.includes("web") || src.includes("service")) {
    deviceType = "WebApp";
  } else if (src.includes("macos") || src.includes("apple") || src.includes("macbook") || msg.includes("macos")) {
    deviceType = "macOS";
  }

  // 3. Ubiquiti / UniFi Specific Parsing
  if (src.includes("u7pro") || src.includes("unifi") || msg.includes("stahtd") || msg.includes("sta-tracker")) {
    if (msg.includes("roamed") || msg.includes("sta_assoc_tracker")) {
      return {
        category: "System",
        deviceType: "IoT",
        interpretation: "📶 Wi-Fi Roaming: Ein Gerät ist erfolgreich zu einem anderen Access Point gewechselt.",
      };
    }
    if (msg.includes("soft failure")) {
      return {
        category: "System",
        deviceType: "IoT",
        interpretation: "📡 Wi-Fi Signal-Optimierung: Ein Client hat kurzzeitig die Verbindung verloren oder wechselt die Frequenz.",
      };
    }
  }

  // 4. Analyze Content (Security)
  if (msg.includes("brute force") || msg.includes("failed login") || msg.includes("invalid password") || msg.includes("ssh-login-attempt")) {
    return {
      category: "Security",
      deviceType,
      interpretation: "⚠️ Ein möglicher Angriff wurde erkannt: Mehrere fehlgeschlagene Login-Versuche in kurzer Zeit.",
    };
  }

  // Refined check for status codes to avoid false positives in timestamps
  const hasAccessDenied = msg.includes("access denied") || msg.includes("forbidden") || /\b403\b/.test(message);
  if (hasAccessDenied) {
    return {
      category: "Security",
      deviceType,
      interpretation: "🚫 Zugriff verweigert: Jemand hat versucht, auf einen geschützten Bereich zuzugreifen.",
    };
  }

  // 5. Analyze Content (Config)
  if (msg.includes("config error") || msg.includes("invalid configuration") || msg.includes("missing file") || msg.includes("connection refused")) {
    return {
      category: "Config",
      deviceType,
      interpretation: "⚙️ Einstellungs-Fehler: Eine Komponente konnte nicht korrekt geladen werden. Prüfe die Konfigurationsdateien.",
    };
  }

  // 6. Proxmox specific
  if (src.includes("proxmox") || src.includes("pve")) {
    if (msg.includes("backup failed")) {
      return {
        category: "System",
        deviceType,
        interpretation: "💾 Backup-Fehler: Die Sicherung eines Containers oder einer VM ist fehlgeschlagen.",
      };
    }
    if (msg.includes("vm stopped") || msg.includes("container stopped")) {
      return {
        category: "System",
        deviceType,
        interpretation: "🛑 System-Status: Ein virtueller Server oder Container wurde unerwartet gestoppt.",
      };
    }
  }

  // 7. Network Gateway specific
  if (src.includes("gateway") || src.includes("router")) {
    if (msg.includes("high latency") || msg.includes("packet loss")) {
      return {
        category: "System",
        deviceType,
        interpretation: "🌐 Netzwerk-Probleme: Die Internetverbindung ist aktuell langsam oder instabil.",
      };
    }
  }

  // Default interpretation
  return {
    category: "Info",
    deviceType,
    interpretation: "📝 Informations-Eintrag: Ein normales Systemereignis wurde protokolliert.",
  };
}
