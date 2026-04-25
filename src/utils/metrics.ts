import { ENV_FACTORS } from "../constants/env-factors";
import type { Stats } from "../types/stats";
//script to calculate score/environmental metric of the prompt.
export function computeMetrics(tokens: number): Stats {
  return {
    tokens,
    co2Grams: tokens * ENV_FACTORS.CO2_PER_TOKEN,
    waterMl: tokens * ENV_FACTORS.WATER_PER_TOKEN,
  };
}
