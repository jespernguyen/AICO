import type { AnalysisResult } from "../types/analysis";
import { getStorageItem } from "./storage";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const OPTIMIZER_SYSTEM_PROMPT = `You are a prompt optimization assistant.
Given a user's prompt, rewrite it to be clearer, more concise, and more effective for AI models.
Return only the optimized prompt — no explanations, no commentary.`;

export async function optimizePrompt(prompt: string): Promise<AnalysisResult> {
  const apiKey = await getStorageItem<string>("geminiApiKey");

  if (!apiKey) {
    throw new Error("No API key found. Please set your Gemini API key in Options.");
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: OPTIMIZER_SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message ?? `HTTP ${response.status}`);
  }

  const data = await response.json();
  const optimizedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const tokens = data.usageMetadata?.totalTokenCount ?? 0;

  return {
    summary: optimizedPrompt,
    tokens,
    model: "gemini-2.0-flash",
  };
}
