import { getEncoding, type Tiktoken } from "js-tiktoken";
import nlp from "compromise";
import type { PromptAnalysis, PromptComparison } from "../types/analysis";

// --- ENVIRONMENTAL & COST ESTIMATES ---
// Note: These are rough industry averages for educational purposes.
// Datacenter efficiency varies significantly by location, hardware, and time of day.
export const ESTIMATED_COST_USD_PER_1M_TOKENS = 2.5;
export const GLOBAL_AVG_ENERGY_WH_PER_1K_TOKENS = 0.3;
export const GLOBAL_AVG_WATER_ML_PER_1K_TOKENS = 0.5;
export const GLOBAL_AVG_CO2_GRAMS_PER_1K_TOKENS = 0.12;

const FALLBACK_CHARS_PER_TOKEN = 4;

// --- ALGORITHM WEIGHTS ---
// Configurable weights for the efficiency score calculation
export const EFFICIENCY_WEIGHTS = {
  fluffMultiplier: 200,
  repetitionMultiplier: 20,
  vaguenessMultiplier: 15,
  structureMultiplier: 2,
  maxStructureBonus: 10,
  lengthPenaltyStart: 1000,
  lengthPenaltyDivisor: 100,
  maxLengthPenalty: 25,
} as const;

// --- NLP DICTIONARIES ---
// Split based on how we query them in the compromise NLP engine

// Penalize these only if they are used as adverbs (e.g., catches "just do this", ignores "a just cause")
const FILLER_ADVERBS = [
  "basically", "actually", "just", "really", "very", "literally", "probably"
];

// Multi-word phrases that are generally fluff regardless of part of speech
const FILLER_PHRASES = [
  "kind of", "sort of", "maybe", "perhaps", "i think", "i guess", "you know"
];

// Vague nouns/pronouns
const VAGUE_TERMS = [
  "something", "anything", "everything", "stuff", "thing", "somehow", "somewhere", "whatever"
];

const STRUCTURE_KEYWORDS = [
  "goal", "context", "constraints", "output format", "example", "requirements"
];

// Common English stop words to prevent penalizing natural sentence length
const STOP_WORDS = new Set([
  "the", "is", "at", "which", "on", "and", "a", "an", "of", "to", "in",
  "for", "with", "it", "that", "as", "be", "this", "or", "by", "from",
  "are", "was", "were", "will", "would", "can", "could", "should"
]);

let encoderSingleton: Tiktoken | null | undefined;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
  
  // Initialize the NLP document
  const doc = nlp(text);

  // Use Compromise to get an array of normalized words, stripping punctuation
  const words = doc.terms().out('array');
  const wordCount = words.length;
  const tokenCount = countTokens(text);

  // --- SMART MATCHING WITH COMPROMISE ---
  
  // 1. Find filler adverbs, but ONLY when tagged as adverbs (#Adverb)
  const adverbMatches = doc.match('#Adverb').match(`(${FILLER_ADVERBS.join('|')})`).length;
  
  // 2. Find general filler phrases
  const phraseMatches = doc.match(`(${FILLER_PHRASES.join('|')})`).length;
  
  const fillerCount = adverbMatches + phraseMatches;
  const fillerRatio = wordCount === 0 ? 0 : fillerCount / wordCount;

  // Repetition logic (filtering out stop words)
  const meaningfulWords = words.filter((word: string) => !STOP_WORDS.has(word.toLowerCase()));
  const meaningfulWordCount = meaningfulWords.length;
  const uniqueMeaningfulWordCount = new Set(meaningfulWords).size;

  const repetitionScore =
    meaningfulWordCount === 0 
      ? 0 
      : (meaningfulWordCount - uniqueMeaningfulWordCount) / meaningfulWordCount;

  // Find vague terms
  const vaguenessCount = doc.match(`(${VAGUE_TERMS.join('|')})`).length;
  const vaguenessScore = wordCount === 0 ? 0 : vaguenessCount / wordCount;

  // Structure detection
  const bulletStructureMatches = rawText.match(/^\s*[-*]\s/gim)?.length ?? 0;
  const numberedStructureMatches = rawText.match(/^\s*\d+\.\s/gim)?.length ?? 0;
  
  const keywordStructureMatches = STRUCTURE_KEYWORDS.filter((keyword) =>
    doc.has(keyword)
  ).length;
  
  const structureSignals = bulletStructureMatches + numberedStructureMatches + keywordStructureMatches;
  const structureScore = Math.min(5, structureSignals);

  // --- EFFICIENCY & RESOURCE CALCULATION ---
  
  const fluffRatioPenalty = fillerRatio * EFFICIENCY_WEIGHTS.fluffMultiplier;
  const lengthPenalty =
    tokenCount > EFFICIENCY_WEIGHTS.lengthPenaltyStart
      ? Math.min(
          EFFICIENCY_WEIGHTS.maxLengthPenalty, 
          (tokenCount - EFFICIENCY_WEIGHTS.lengthPenaltyStart) / EFFICIENCY_WEIGHTS.lengthPenaltyDivisor
        )
      : 0;
  const repetitionPenalty = repetitionScore * EFFICIENCY_WEIGHTS.repetitionMultiplier;
  const vaguenessPenalty = vaguenessScore * EFFICIENCY_WEIGHTS.vaguenessMultiplier;
  const structureBonus = Math.min(
    EFFICIENCY_WEIGHTS.maxStructureBonus, 
    structureScore * EFFICIENCY_WEIGHTS.structureMultiplier
  );

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

  const estimatedCostUsd = (tokenCount / 1_000_000) * ESTIMATED_COST_USD_PER_1M_TOKENS;
  const estimatedEnergyWh = (tokenCount / 1_000) * GLOBAL_AVG_ENERGY_WH_PER_1K_TOKENS;
  const estimatedWaterMl = (tokenCount / 1_000) * GLOBAL_AVG_WATER_ML_PER_1K_TOKENS;
  const estimatedCo2Grams = (tokenCount / 1_000) * GLOBAL_AVG_CO2_GRAMS_PER_1K_TOKENS;

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
