import { getApiKey } from "./storage";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent";

const OPTIMIZER_SYSTEM_PROMPT = `You are a prompt optimization assistant.
Given a user's prompt, rewrite it to be clearer, more concise, and more effective for AI models.
Return only the optimized prompt text.
Do not include markdown, code fences, explanations, or commentary.`;

function stripCodeFences(text: string): string {
  const fenced = text.match(/^```[a-zA-Z0-9_-]*\s*([\s\S]*?)\s*```$/);
  if (!fenced) {
    return text;
  }
  return fenced[1].trim();
}

export async function optimizePrompt(prompt: string): Promise<string> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error("Missing API key. Please add your Gemini API key in Options.");
  }

  let response: Response;
  try {
    response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${OPTIMIZER_SYSTEM_PROMPT}
      
      User prompt:
      ${prompt}
      
      Return only the optimized prompt text.`,
              },
            ],
          },
        ],
      }),
    });
  } catch {
    throw new Error("Network error while contacting Gemini.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message =
      error?.error?.message ?? `Failed to reach Gemini (HTTP ${response.status}).`;
    throw new Error(message);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  const optimizedPrompt = stripCodeFences(String(rawText ?? "").trim());

  if (!optimizedPrompt) {
    throw new Error("Gemini returned an empty optimized prompt.");
  }

  return optimizedPrompt;
}
