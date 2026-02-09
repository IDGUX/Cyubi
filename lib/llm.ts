import axios from "axios";
import { prisma } from "./prisma";

export interface AIInterpretation {
    interpretation: string;
    category: "Security" | "Config" | "System" | "Info";
    deviceType: "Gateway" | "Server" | "IoT" | "WebApp" | "Windows" | "macOS" | "Unknown";
    suggestedParser?: {
        pattern: string;
        interpretation: string;
        category: string;
    }
}

/**
 * Anonymizes a string by masking sensitive data like IPs and MAC addresses.
 */
function anonymize(text: string): string {
    if (!text) return text;
    // Mask IPv4
    let clean = text.replace(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.)\d{1,3}/g, "$1xxx");
    // Mask MAC Address
    clean = clean.replace(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/g, "XX:XX:XX:XX:XX:XX");
    return clean;
}

async function getSetting(key: string): Promise<string | null> {
    const setting = await prisma.setting.findUnique({
        where: { key }
    });
    return setting ? setting.value : null;
}

export async function fetchAvailableModels(provider: string, apiKey: string, baseUrl?: string): Promise<string[]> {
    try {
        if (provider === "openai") {
            const response = await axios.get("https://api.openai.com/v1/models", {
                headers: { "Authorization": `Bearer ${apiKey}` }
            });
            return response.data.data.map((m: any) => m.id).sort();
        }
        if (provider === "anthropic") {
            // Anthropic doesn't have a reliable models endpoint yet (ironicly)
            return ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"];
        }
        if (provider === "gemini") {
            const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            return response.data.models.map((m: any) => m.name.replace("models/", "")).sort();
        }
        if (provider === "mistral") {
            const response = await axios.get("https://api.mistral.ai/v1/models", {
                headers: { "Authorization": `Bearer ${apiKey}` }
            });
            return response.data.data.map((m: any) => m.id).sort();
        }
        if (provider === "local") {
            const url = baseUrl || "http://localhost:11434";
            const response = await axios.get(`${url}/api/tags`);
            return response.data.models.map((m: any) => m.name).sort();
        }
        return [];
    } catch (e) {
        console.error(`Failed to fetch models for ${provider}:`, (e as any).message);
        return [];
    }
}

export async function callLLM(message: string, source: string): Promise<AIInterpretation | null> {
    try {
        const provider = await getSetting("AI_ACTIVE_PROVIDER") || "openai";
        const openaiKey = await getSetting("SECRET_OPENAI_KEY");
        const anthropicKey = await getSetting("SECRET_ANTHROPIC_KEY");
        const geminiKey = await getSetting("SECRET_GEMINI_KEY");
        const mistralKey = await getSetting("SECRET_MISTRAL_KEY");
        const localUrl = await getSetting("AI_LOCAL_URL") || "http://localhost:11434";

        const openaiModel = await getSetting("AI_OPENAI_MODEL") || "gpt-4o";
        const anthropicModel = await getSetting("AI_ANTHROPIC_MODEL") || "claude-3-5-sonnet-20240620";
        const geminiModel = await getSetting("AI_GEMINI_MODEL") || "gemini-1.5-flash";
        const mistralModel = await getSetting("AI_MISTRAL_MODEL") || "mistral-large-latest";
        const localModel = await getSetting("AI_LOCAL_MODEL") || "llama3";

        const prompt = `
            Analyze the following Syslog message and provide a structured interpretation.
            Source: ${anonymize(source)}
            Message: ${anonymize(message)}

            Return ONLY a JSON object with the following structure:
            {
                "interpretation": "Short human-readable explanation in German",
                "category": "Security" | "Config" | "System" | "Info",
                "deviceType": "Gateway" | "Server" | "IoT" | "WebApp" | "Windows" | "macOS" | "Unknown",
                "suggestedParser": {
                    "pattern": "A regex pattern that matches this and similar logs, focusing on the static parts.",
                    "interpretation": "The interpretation string with placeholders like $1, $2 for variable parts matching capture groups in the pattern.",
                    "category": "Security" | "Config" | "System" | "Info"
                }
            }
        `;

        if (provider === "openai" && openaiKey) {
            const response = await axios.post("https://api.openai.com/v1/chat/completions", {
                model: openaiModel,
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            }, {
                headers: { "Authorization": `Bearer ${openaiKey}` }
            });
            return JSON.parse(response.data.choices[0].message.content);
        }

        if (provider === "anthropic" && anthropicKey) {
            const response = await axios.post("https://api.anthropic.com/v1/messages", {
                model: anthropicModel,
                max_tokens: 1024,
                messages: [{ role: "user", content: prompt }]
            }, {
                headers: {
                    "x-api-key": anthropicKey,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }
            });
            const content = response.data.content[0].text;
            return JSON.parse(content.substring(content.indexOf("{"), content.lastIndexOf("}") + 1));
        }

        if (provider === "gemini" && geminiKey) {
            const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`, {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            });
            return JSON.parse(response.data.candidates[0].content.parts[0].text);
        }

        if (provider === "mistral" && mistralKey) {
            const response = await axios.post("https://api.mistral.ai/v1/chat/completions", {
                model: mistralModel,
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            }, {
                headers: { "Authorization": `Bearer ${mistralKey}` }
            });
            return JSON.parse(response.data.choices[0].message.content);
        }

        if (provider === "local") {
            const response = await axios.post(`${localUrl}/api/generate`, {
                model: localModel,
                prompt: prompt,
                stream: false,
                format: "json"
            });
            return JSON.parse(response.data.response);
        }

        return null;
    } catch (error) {
        console.error("LLM call failed:", (error as any).message);
        return null;
    }
}
