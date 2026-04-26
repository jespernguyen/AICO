export interface ModelMetrics {
  id: string;
  label: string;
  costUsdPer1MTokens: number;
  energyWhPer1KTokens: number;
  waterMlPer1KTokens: number;
  co2GramsPer1KTokens: number;
}

// Cost: averaged across input/output pricing.
// CO2: sourced from carbon-llm.com/llm-co2-benchmark (gCO2e per 1K tokens).
//   Models not directly listed use the closest proxy: Claude 3.7 ≈ Claude 3.5 Sonnet,
//   Gemini 3.1 Pro ≈ Gemini 1.5 Pro, Llama 4 Maverick ≈ Llama 3 70B.
// Energy and water: approximate industry estimates (not available from benchmark).
export const MODELS: ModelMetrics[] = [
  {
    id: "default",
    label: "Default (Industry Average)",
    costUsdPer1MTokens: 2.50,
    energyWhPer1KTokens: 0.40,
    waterMlPer1KTokens: 3.00,
    co2GramsPer1KTokens: 2.50,
  },
  {
    id: "gpt-4o",
    label: "GPT-4o (OpenAI)",
    costUsdPer1MTokens: 6.25,
    energyWhPer1KTokens: 0.44,
    waterMlPer1KTokens: 4.80,
    co2GramsPer1KTokens: 0.37,
  },
  {
    id: "claude-3-7-sonnet",
    label: "Claude 3.7 Sonnet (Anthropic)",
    costUsdPer1MTokens: 9.00,
    energyWhPer1KTokens: 0.90,
    waterMlPer1KTokens: 7.2,
    co2GramsPer1KTokens: 0.85,
  },
  {
    id: "gemini-3-1-pro",
    label: "Gemini 3.1 Pro (Google)",
    costUsdPer1MTokens: 5.60,
    energyWhPer1KTokens: 0.26,
    waterMlPer1KTokens: 2.1,
    co2GramsPer1KTokens: 0.12,
  },
  {
    id: "llama-4-maverick",
    label: "Llama 4 Maverick (Meta)",
    costUsdPer1MTokens: 0.52,
    energyWhPer1KTokens: 1.11,
    waterMlPer1KTokens: 9.5,
    co2GramsPer1KTokens: 0.25,
  },
  {
    id: "deepseek-v3",
    label: "DeepSeek V3",
    costUsdPer1MTokens: 0.69,
    energyWhPer1KTokens: 1.08,
    waterMlPer1KTokens: 8.8,
    co2GramsPer1KTokens: 0.45,
  },
];

export const DEFAULT_MODEL = MODELS[0];

export function getModelById(id: string): ModelMetrics {
  return MODELS.find((m) => m.id === id) ?? DEFAULT_MODEL;
}
