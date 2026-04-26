import type { ModelMetrics } from "../constants/models";

export interface OptimizationTokenLoad {
  originalPromptTokens: number;
  optimizedPromptTokens: number;
}

export interface ImpactBreakdown {
  energyWh: number;
  co2g: number;
  waterMl: number;
}

export interface OptimizationImpactResult {
  originalCost: ImpactBreakdown;
  optimizedCost: ImpactBreakdown;
  optimizationCost: ImpactBreakdown;
  grossSaved: ImpactBreakdown;
  netSaved: ImpactBreakdown;
}

export interface CalculateOptimizationImpactInput extends OptimizationTokenLoad {
  baselineModel?: ModelMetrics;
  aicoModel?: ModelMetrics;
}
