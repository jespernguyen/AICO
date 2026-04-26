export interface ModelMetrics {
  id: string;
  label: string;
  costUsdPer1MTokens: number;
  energyWhPer1KTokens: number;
  waterMlPer1KTokens: number;
  co2GramsPer1KTokens: number;
}

export const AICO_INTERNAL_MODEL_ID = "aico-internal";

// Cost: averaged across input/output pricing.
// CO2: sourced from carbon-llm.com/llm-co2-benchmark (gCO2e per 1K tokens).
//   Models not directly listed use the closest proxy: Claude 3.7 ≈ Claude 3.5 Sonnet,
//   Gemini 3.1 Pro ≈ Gemini 1.5 Pro, Llama 4 Maverick ≈ Llama 3 70B.
// Energy and water: approximate industry estimates (not available from benchmark).
const USER_FACING_MODELS: ModelMetrics[] = [
  {
    id: "gpt-4o",
    label: "GPT-4o (OpenAI)",
    costUsdPer1MTokens: 6.25,
    energyWhPer1KTokens: 1.20,
    waterMlPer1KTokens: 8.00,
    co2GramsPer1KTokens: 0.60,
  },
  {
    id: "claude-3-7-sonnet",
    label: "Claude 3.7 Sonnet (Anthropic)",
    costUsdPer1MTokens: 9.00,
    energyWhPer1KTokens: 1.80,
    waterMlPer1KTokens: 12.00,
    co2GramsPer1KTokens: 0.90,
  },
  {
    id: "gemini-3-1-pro",
    label: "Gemini 3.1 Pro (Google)",
    costUsdPer1MTokens: 5.60,
    energyWhPer1KTokens: 0.80,
    waterMlPer1KTokens: 5.50,
    co2GramsPer1KTokens: 0.30,
  },
  {
    id: "llama-4-maverick",
    label: "Llama 4 Maverick (Meta)",
    costUsdPer1MTokens: 0.52,
    energyWhPer1KTokens: 1.50,
    waterMlPer1KTokens: 10.50,
    co2GramsPer1KTokens: 0.55,
  },
  {
    id: "deepseek-v3",
    label: "DeepSeek V3",
    costUsdPer1MTokens: 0.69,
    energyWhPer1KTokens: 1.40,
    waterMlPer1KTokens: 9.80,
    co2GramsPer1KTokens: 0.50,
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
  label: "AICO Lightweight (internal)",
  costUsdPer1MTokens: 0.20,
  energyWhPer1KTokens: 0.35,
  waterMlPer1KTokens: 2.20,
  co2GramsPer1KTokens: 0.14,
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
