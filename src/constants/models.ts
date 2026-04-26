export interface ModelMetrics {
  id: string;
  label: string;
  costUsdPer1MTokens: number;
  energyWhPer1KTokens: number;
  waterMlPer1KTokens: number;
  co2GramsPer1KTokens: number;
}

export const AICO_INTERNAL_MODEL_ID = "aico-internal";

// NOTE:
// Prices are approximate blended rates assuming ~50% input / 50% output tokens.
// Environmental values are estimates, not official provider-reported numbers.
// We keep them conservative and internally consistent:
// - frontier models: ~0.6–1.2 Wh / 1K tokens
// - efficient open / MoE models: ~0.25–0.45 Wh / 1K tokens
// - water roughly scales with energy
// - CO2 assumes relatively clean datacenter energy

const USER_FACING_MODELS: ModelMetrics[] = [
  {
    id: "gpt-4o",
    label: "GPT-4o (OpenAI)",
    costUsdPer1MTokens: 10.00,
    energyWhPer1KTokens: 0.90,
    waterMlPer1KTokens: 6.00,
    co2GramsPer1KTokens: 0.45,
  },
  {
    id: "claude-3-7-sonnet",
    label: "Claude 3.7 Sonnet (Anthropic)",
    costUsdPer1MTokens: 9.00,
    energyWhPer1KTokens: 1.15,
    waterMlPer1KTokens: 7.75,
    co2GramsPer1KTokens: 0.58,
  },
  {
    id: "gemini-3-1-pro",
    label: "Gemini 3.1 Pro (Google)",
    costUsdPer1MTokens: 6.25,
    energyWhPer1KTokens: 0.70,
    waterMlPer1KTokens: 4.75,
    co2GramsPer1KTokens: 0.32,
  },
  {
    id: "llama-4-maverick",
    label: "Llama 4 Maverick (Meta)",
    costUsdPer1MTokens: 0.75,
    energyWhPer1KTokens: 0.38,
    waterMlPer1KTokens: 2.50,
    co2GramsPer1KTokens: 0.16,
  },
  {
    id: "deepseek-v3",
    label: "DeepSeek V3",
    costUsdPer1MTokens: 0.53,
    energyWhPer1KTokens: 0.42,
    waterMlPer1KTokens: 2.80,
    co2GramsPer1KTokens: 0.18,
  },
];

function getAverageMetric(
  models: ModelMetrics[],
  key: keyof Omit<ModelMetrics, "id" | "label">
): number {
  if (models.length === 0) {
    return 0;
  }
  const total = models.reduce((sum, model) => sum + model[key], 0);
  return total / models.length;
}

export const AVG_COST_USD_PER_1M_TOKENS = getAverageMetric(
  USER_FACING_MODELS,
  "costUsdPer1MTokens"
);
export const AVG_ENERGY_WH_PER_1K_TOKENS = getAverageMetric(
  USER_FACING_MODELS,
  "energyWhPer1KTokens"
);
export const AVG_WATER_ML_PER_1K_TOKENS = getAverageMetric(
  USER_FACING_MODELS,
  "waterMlPer1KTokens"
);
export const AVG_CO2_GRAMS_PER_1K_TOKENS = getAverageMetric(
  USER_FACING_MODELS,
  "co2GramsPer1KTokens"
);

export const INDUSTRY_AVERAGE_MODEL: ModelMetrics = {
  id: "default",
  label: "Default (Industry Average)",
  costUsdPer1MTokens: AVG_COST_USD_PER_1M_TOKENS,
  energyWhPer1KTokens: AVG_ENERGY_WH_PER_1K_TOKENS,
  waterMlPer1KTokens: AVG_WATER_ML_PER_1K_TOKENS,
  co2GramsPer1KTokens: AVG_CO2_GRAMS_PER_1K_TOKENS,
};

export const AICO_INTERNAL_MODEL: ModelMetrics = {
  id: AICO_INTERNAL_MODEL_ID,
  label: "AICO Lightweight (Gemma 3 27B)",
  costUsdPer1MTokens: 0.12,
  energyWhPer1KTokens: 0.12,
  waterMlPer1KTokens: 0.85,
  co2GramsPer1KTokens: 0.06,
};

export const MODELS: ModelMetrics[] = [
  INDUSTRY_AVERAGE_MODEL,
  ...USER_FACING_MODELS,
  AICO_INTERNAL_MODEL,
];

export const DEFAULT_MODEL = MODELS[0];

export function getModelById(id: string): ModelMetrics {
  return MODELS.find((m) => m.id === id) ?? DEFAULT_MODEL;
}

export function getAicoInternalModel(): ModelMetrics {
  return AICO_INTERNAL_MODEL;
}
