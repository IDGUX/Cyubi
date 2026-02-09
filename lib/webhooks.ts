import axios from "axios";
import { prisma } from "./prisma";

/**
 * Send an alert to Discord or Slack via Webhook
 */
export async function sendWebhookAlert(title: string, message: string, category: string) {
  try {
    // @ts-ignore
    const model = (prisma as any).setting || (prisma as any).systemSetting;
    if (!model) return;

    // Check if alerts are enabled for this category
    const alertSetting = await model.findUnique({
      where: { key: `ALERT_${category.toUpperCase()}` }
    });

    if (alertSetting?.value !== "true" && category !== "Security") {
      // We always send security alerts by default unless explicitly disabled
      if (alertSetting?.value === "false") return;
    } else if (alertSetting?.value === "false") {
      return;
    }

    // Try to get from DB first, fall back to ENV
    const setting = await model.findUnique({
      where: { key: "WEBHOOK_URL" }
    });

    const webhookUrl = setting?.value || process.env.WEBHOOK_URL;

    if (!webhookUrl) return;

    const color = category === "Security" ? 0xff0000 : category === "Config" ? 0xffff00 : 0x00ff00;

    await axios.post(webhookUrl, {
      embeds: [{
        title: `🚨 LogVault Alert: ${title}`,
        description: message,
        color: color,
        timestamp: new Date().toISOString(),
      }]
    });
  } catch (error) {
    console.error("Failed to send webhook alert:", error);
  }
}
