export interface ModelEnvironmentalProfile {
  name: string;
  energyWhPer1kInputTokens: number;
  energyWhPer1kOutputTokens: number;
  co2gPerWh: number;
  waterMlPerWh: number;
}

// These values are conservative placeholders intended for relative comparison.
// Provider-level environmental metrics vary and are uncertain across hardware,
// utilization, and data-center energy mix. Tune these values over time.
export const AICO_MODEL_PROFILE: ModelEnvironmentalProfile = {
  name: "AICO Lightweight (Gemma-like)",
  energyWhPer1kInputTokens: 0.22,
  energyWhPer1kOutputTokens: 0.35,
  co2gPerWh: 0.38,
  waterMlPerWh: 1.7,
};

// These values are conservative placeholders intended for relative comparison.
// They represent a deeper reasoning model pathway (GPT-5/Opus-like) and should
// be replaced when trusted provider-level benchmarking is available.
export const BASELINE_MODEL_PROFILE: ModelEnvironmentalProfile = {
  name: "Baseline Heavy (GPT-5/Opus-like)",
  energyWhPer1kInputTokens: 1.05,
  energyWhPer1kOutputTokens: 1.5,
  co2gPerWh: 0.38,
  waterMlPerWh: 1.7,
};

// Conservative placeholder to estimate baseline output generation.
// Many heavy-model interactions produce meaningful output, so we estimate
// output tokens as a ratio of input tokens.
export const BASELINE_ASSUMED_OUTPUT_RATIO = 1;
