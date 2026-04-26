export interface OptimizationTokenLoad {
  systemPromptTokens: number;
  originalPromptTokens: number;
  optimizedPromptTokens: number;
}

export interface ImpactBreakdown {
  energyWh: number;
  co2g: number;
  waterMl: number;
}

export interface OptimizationImpactResult {
  aico: ImpactBreakdown;
  baselineAvoided: ImpactBreakdown;
  net: ImpactBreakdown;
  hadNetSavings: boolean;
}

export interface EstimateImpactInput {
  inputTokens: number;
  outputTokens: number;
}

export interface CalculateOptimizationImpactInput extends OptimizationTokenLoad {
  baselineOutputRatio?: number;
}
