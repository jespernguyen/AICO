import {
  AICO_MODEL_PROFILE,
  BASELINE_ASSUMED_OUTPUT_RATIO,
  BASELINE_MODEL_PROFILE,
  type ModelEnvironmentalProfile,
} from "../constants/modelProfiles";
import type { AnalysisRecord } from "../types/analysis";
import type {
  CalculateOptimizationImpactInput,
  EstimateImpactInput,
  ImpactBreakdown,
  OptimizationImpactResult,
} from "../types/environmental";
import { countTokens } from "./metrics";

const CHARS_PER_TOKEN_FALLBACK = 4;
const TOKENS_PER_1K = 1000;
const WH_PER_KWH = 1000;
const GRAMS_PER_KILOGRAM = 1000;
const MILLILITERS_PER_LITER = 1000;

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export function approximateTokenCount(text: string): number {
  if (!text.trim()) {
    return 0;
  }
  return Math.ceil(text.length / CHARS_PER_TOKEN_FALLBACK);
}

export function tokenizeOrApproximate(text: string): number {
  try {
    return countTokens(text);
  } catch {
    return approximateTokenCount(text);
  }
}

export function estimateImpact(
  tokens: EstimateImpactInput,
  modelProfile: ModelEnvironmentalProfile
): ImpactBreakdown {
  const inputEnergyWh =
    (tokens.inputTokens / TOKENS_PER_1K) * modelProfile.energyWhPer1kInputTokens;
  const outputEnergyWh =
    (tokens.outputTokens / TOKENS_PER_1K) * modelProfile.energyWhPer1kOutputTokens;
  const energyWh = inputEnergyWh + outputEnergyWh;
  const co2g = energyWh * modelProfile.co2gPerWh;
  const waterMl = energyWh * modelProfile.waterMlPerWh;

  return { energyWh, co2g, waterMl };
}

export function calculateOptimizationImpact({
  systemPromptTokens,
  originalPromptTokens,
  optimizedPromptTokens,
  aicoModelProfile = AICO_MODEL_PROFILE,
  baselineModelProfile = BASELINE_MODEL_PROFILE,
  baselineOutputRatio = BASELINE_ASSUMED_OUTPUT_RATIO,
}: CalculateOptimizationImpactInput & {
  aicoModelProfile?: ModelEnvironmentalProfile;
  baselineModelProfile?: ModelEnvironmentalProfile;
}): OptimizationImpactResult {
  const aicoInputTokens = systemPromptTokens + originalPromptTokens;
  const baselineOutputTokens = Math.max(
    0,
    Math.round(originalPromptTokens * baselineOutputRatio)
  );

  const aico = estimateImpact(
    {
      inputTokens: aicoInputTokens,
      outputTokens: optimizedPromptTokens,
    },
    aicoModelProfile
  );

  const baselineAvoided = estimateImpact(
    {
      inputTokens: originalPromptTokens,
      outputTokens: baselineOutputTokens,
    },
    baselineModelProfile
  );

  const net = {
    energyWh: baselineAvoided.energyWh - aico.energyWh,
    co2g: baselineAvoided.co2g - aico.co2g,
    waterMl: baselineAvoided.waterMl - aico.waterMl,
  };

  return {
    aico,
    baselineAvoided,
    net,
    hadNetSavings: net.energyWh > 0 || net.co2g > 0 || net.waterMl > 0,
  };
}

export function sumImpacts(impacts: ImpactBreakdown[]): ImpactBreakdown {
  return impacts.reduce<ImpactBreakdown>(
    (aggregate, impact) => ({
      energyWh: aggregate.energyWh + impact.energyWh,
      co2g: aggregate.co2g + impact.co2g,
      waterMl: aggregate.waterMl + impact.waterMl,
    }),
    { energyWh: 0, co2g: 0, waterMl: 0 }
  );
}

export function mapRecordsToImpacts(
  records: AnalysisRecord[],
  systemPromptTokens: number
): OptimizationImpactResult[] {
  return [...records]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((record) =>
      calculateOptimizationImpact({
        systemPromptTokens,
        originalPromptTokens: record.originalAnalysis.tokenCount,
        optimizedPromptTokens: record.optimizedAnalysis.tokenCount,
      })
    );
}

export function formatEnergy(valueWh: number): string {
  const absValue = Math.abs(valueWh);
  if (absValue >= WH_PER_KWH) {
    return `${numberFormatter.format(valueWh / WH_PER_KWH)} kWh`;
  }
  return `${numberFormatter.format(valueWh)} Wh`;
}

export function formatCo2(valueGrams: number): string {
  const absValue = Math.abs(valueGrams);
  if (absValue >= GRAMS_PER_KILOGRAM) {
    return `${numberFormatter.format(valueGrams / GRAMS_PER_KILOGRAM)} kg CO2e`;
  }
  return `${numberFormatter.format(valueGrams)} g CO2e`;
}

export function formatWater(valueMl: number): string {
  const absValue = Math.abs(valueMl);
  if (absValue >= MILLILITERS_PER_LITER) {
    return `${numberFormatter.format(valueMl / MILLILITERS_PER_LITER)} L`;
  }
  return `${numberFormatter.format(valueMl)} mL`;
}
