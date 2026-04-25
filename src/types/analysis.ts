export interface PromptAnalysis {
  rawText: string;
  wordCount: number;
  tokenCount: number;
  fillerCount: number;
  fillerRatio: number;
  repetitionScore: number;
  vaguenessScore: number;
  structureScore: number;
  efficiencyScore: number;
  estimatedCostUsd: number;
  estimatedEnergyWh: number;
  estimatedWaterMl: number;
  estimatedCo2Grams: number;
}

export interface PromptComparison {
  originalTokens: number;
  optimizedTokens: number;
  tokensSaved: number;
  percentTokenReduction: number;
  efficiencyImprovement: number;
  costSavedUsd: number;
  energySavedWh: number;
  waterSavedMl: number;
  co2SavedGrams: number;
}

export interface AggregateStats {
  totalPromptsAnalyzed: number;
  totalTokensSaved: number;
  totalCostSavedUsd: number;
  totalCo2SavedGrams: number;
}

export interface AnalysisRecord {
  id: string;
  createdAt: number;
  originalAnalysis: PromptAnalysis;
  optimizedAnalysis: PromptAnalysis;
  comparison: PromptComparison;
}
