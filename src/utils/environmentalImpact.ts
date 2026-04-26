import {
  DEFAULT_MODEL,
  getAicoInternalModel,
  type ModelMetrics,
} from "../constants/models";
import type { AnalysisRecord } from "../types/analysis";
import type {
  CalculateOptimizationImpactInput,
  ImpactBreakdown,
  OptimizationImpactResult,
} from "../types/environmental";
import { countTokens } from "./metrics";

const CHARS_PER_TOKEN_FALLBACK = 4;
const TOKENS_PER_1K_TOKENS = 1000;
const WH_PER_KWH = 1000;
const GRAMS_PER_KILOGRAM = 1000;
const MILLILITERS_PER_LITER = 1000;
const OPTIMIZER_SYSTEM_PROMPT_TOKEN_OVERHEAD = 50;

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

function estimateTokenCost(tokens: number, model: ModelMetrics): ImpactBreakdown {
  const tokenUnits = tokens / TOKENS_PER_1K_TOKENS;
  return {
    energyWh: tokenUnits * model.energyWhPer1KTokens,
    co2g: tokenUnits * model.co2GramsPer1KTokens,
    waterMl: tokenUnits * model.waterMlPer1KTokens,
  };
}

export function calculateOptimizationImpact({
  originalPromptTokens,
  optimizedPromptTokens,
  baselineModel = DEFAULT_MODEL,
  aicoModel = getAicoInternalModel(),
}: CalculateOptimizationImpactInput): OptimizationImpactResult {
  const originalCost = estimateTokenCost(originalPromptTokens, baselineModel);
  const optimizedCost = estimateTokenCost(optimizedPromptTokens, baselineModel);
  const optimizerTokens =
    OPTIMIZER_SYSTEM_PROMPT_TOKEN_OVERHEAD + originalPromptTokens;
  const optimizationCost = estimateTokenCost(optimizerTokens, aicoModel);

  const grossSaved = {
    energyWh: originalCost.energyWh - optimizedCost.energyWh,
    co2g: originalCost.co2g - optimizedCost.co2g,
    waterMl: originalCost.waterMl - optimizedCost.waterMl,
  };

  const netSaved = {
    energyWh: grossSaved.energyWh - optimizationCost.energyWh,
    co2g: grossSaved.co2g - optimizationCost.co2g,
    waterMl: grossSaved.waterMl - optimizationCost.waterMl,
  };

  return {
    originalCost,
    optimizedCost,
    optimizationCost,
    grossSaved,
    netSaved,
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
  baselineModel: ModelMetrics
): OptimizationImpactResult[] {
  return [...records]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((record) =>
      calculateOptimizationImpact({
        originalPromptTokens: record.originalAnalysis.tokenCount,
        optimizedPromptTokens: record.optimizedAnalysis.tokenCount,
        baselineModel,
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
