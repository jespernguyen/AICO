import { getEncoding, type Tiktoken } from "js-tiktoken";
import type { PromptAnalysis, PromptComparison } from "../types/analysis";

// Rough demo estimates, not scientifically calibrated
export const COST_USD_PER_1M_TOKENS = 2.5;
export const ENERGY_WH_PER_1K_TOKENS = 0.3;
export const WATER_ML_PER_1K_TOKENS = 0.5;
export const CO2_GRAMS_PER_1K_TOKENS = 0.12;

const FALLBACK_CHARS_PER_TOKEN = 4;

const FILLER_PHRASES = [
  "basically",
  "actually",
  "just",
  "really",
  "very",
  "kind of",
  "sort of",
  "maybe",
  "perhaps",
  "i think",
  "i guess",
  "probably",
  "literally",
  "you know",
] as const;

const VAGUE_PHRASES = [
  "something",
  "anything",
  "everything",
  "stuff",
  "things",
  "somehow",
  "somewhere",
  "whatever",
  "etc",
  "and so on",
] as const;

const STRUCTURE_KEYWORDS = [
  "goal",
  "context",
  "constraints",
  "output format",
  "example",
  "requirements",
] as const;

const BULLET_REGEX = /^\s*[-*]\s/gim;
const NUMBERED_LIST_REGEX = /^\s*\d+\.\s/gim;

let encoderSingleton: Tiktoken | null | undefined;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countWholePhraseMatches(text: string, phrases: readonly string[]): number {
  return phrases.reduce((count, phrase) => {
    const pattern = new RegExp(`\\b${escapeRegex(phrase)}\\b`, "gi");
    return count + (text.match(pattern)?.length ?? 0);
  }, 0);
}

function getEncoder(): Tiktoken | null {
  if (encoderSingleton !== undefined) {
    return encoderSingleton;
  }

  try {
    encoderSingleton = getEncoding("cl100k_base");
  } catch {
    encoderSingleton = null;
  }

  return encoderSingleton;
}

export function countTokens(text: string): number {
  if (!text.trim()) {
    return 0;
  }

  try {
    const encoder = getEncoder();
    if (encoder) {
      return encoder.encode(text).length;
    }
  } catch {
    encoderSingleton = null;
  }

  return Math.ceil(text.length / FALLBACK_CHARS_PER_TOKEN);
}

export function analyzePrompt(text: string): PromptAnalysis {
  const rawText = text;
  const normalizedText = text.toLowerCase();
  const words = normalizedText.match(/\b[\w']+\b/g) ?? [];

  const wordCount = words.length;
  const tokenCount = countTokens(text);

  const fillerCount = countWholePhraseMatches(normalizedText, FILLER_PHRASES);
  const fillerRatio = wordCount === 0 ? 0 : fillerCount / wordCount;

  const uniqueWordCount = new Set(words).size;
  const repetitionScore =
    wordCount === 0 ? 0 : (wordCount - uniqueWordCount) / wordCount;

  const vaguenessCount = countWholePhraseMatches(normalizedText, VAGUE_PHRASES);
  const vaguenessScore = wordCount === 0 ? 0 : vaguenessCount / wordCount;

  const bulletStructureMatches = normalizedText.match(BULLET_REGEX)?.length ?? 0;
  const numberedStructureMatches = normalizedText.match(NUMBERED_LIST_REGEX)?.length ?? 0;
  const keywordStructureMatches = STRUCTURE_KEYWORDS.filter((keyword) =>
    normalizedText.includes(keyword)
  ).length;
  const structureSignals =
    bulletStructureMatches + numberedStructureMatches + keywordStructureMatches;
  const structureScore = Math.min(5, structureSignals);

  const fluffRatioPenalty = fillerRatio * 200;
  const lengthPenalty =
    tokenCount > 1000 ? Math.min(25, (tokenCount - 1000) / 100) : 0;
  const repetitionPenalty = repetitionScore * 20;
  const vaguenessPenalty = vaguenessScore * 15;
  const structureBonus = Math.min(10, structureScore * 2);

  const efficiencyScore = clamp(
    100 -
      fluffRatioPenalty -
      repetitionPenalty -
      lengthPenalty -
      vaguenessPenalty +
      structureBonus,
    0,
    100
  );

  const estimatedCostUsd = (tokenCount / 1_000_000) * COST_USD_PER_1M_TOKENS;
  const estimatedEnergyWh = (tokenCount / 1_000) * ENERGY_WH_PER_1K_TOKENS;
  const estimatedWaterMl = (tokenCount / 1_000) * WATER_ML_PER_1K_TOKENS;
  const estimatedCo2Grams = (tokenCount / 1_000) * CO2_GRAMS_PER_1K_TOKENS;

  return {
    rawText,
    wordCount,
    tokenCount,
    fillerCount,
    fillerRatio,
    repetitionScore,
    vaguenessScore,
    structureScore,
    efficiencyScore,
    estimatedCostUsd,
    estimatedEnergyWh,
    estimatedWaterMl,
    estimatedCo2Grams,
  };
}

export function comparePromptAnalyses(
  original: PromptAnalysis,
  optimized: PromptAnalysis
): PromptComparison {
  const tokensSaved = original.tokenCount - optimized.tokenCount;

  return {
    originalTokens: original.tokenCount,
    optimizedTokens: optimized.tokenCount,
    tokensSaved,
    percentTokenReduction:
      original.tokenCount === 0 ? 0 : (tokensSaved / original.tokenCount) * 100,
    efficiencyImprovement: optimized.efficiencyScore - original.efficiencyScore,
    costSavedUsd: original.estimatedCostUsd - optimized.estimatedCostUsd,
    energySavedWh: original.estimatedEnergyWh - optimized.estimatedEnergyWh,
    waterSavedMl: original.estimatedWaterMl - optimized.estimatedWaterMl,
    co2SavedGrams: original.estimatedCo2Grams - optimized.estimatedCo2Grams,
  };
}
