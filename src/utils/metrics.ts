import { getEncoding, type Tiktoken } from "js-tiktoken";
import nlp from "compromise";
import type { PromptAnalysis, PromptComparison } from "../types/analysis";


// --- ENVIRONMENTAL & COST ESTIMATES ---
// Updated to reflect realistic industry averages for modern inference (e.g., GPT-4o, Gemini 3.1 Pro)
export const ESTIMATED_COST_USD_PER_1M_TOKENS = 2.50;
export const GLOBAL_AVG_ENERGY_WH_PER_1K_TOKENS = 0.40;
export const GLOBAL_AVG_WATER_ML_PER_1K_TOKENS = 3.0;
export const GLOBAL_AVG_CO2_GRAMS_PER_1K_TOKENS = 2.5;


const FALLBACK_CHARS_PER_TOKEN = 4;


// --- ALGORITHM WEIGHTS ---
// Tuned for extreme harshness: no hard caps, just aggressive mathematical penalization.
export const EFFICIENCY_WEIGHTS = {
 fluffMultiplier: 250,        // A 10% fluff ratio now drops the score by 25 points.
 repetitionMultiplier: 80,    // Repetition tanks the score twice as fast as before.
 vaguenessMultiplier: 120,    // Vague phrases are heavily penalized.
 structureMultiplier: 2.5,    // Less saving grace from structure signals.
 maxStructureBonus: 12.5,     // Lowered the maximum possible recovery bonus.
 lengthPenaltyStart: 150,     // Starts penalizing rambling extremely early.
 lengthPenaltyDivisor: 40,    // Length penalty scales up rapidly.
 maxLengthPenalty: 50,        // Rambling alone can now cut a score in half.
 contradictionPenalty: 35,    // A single logical contradiction causes a massive 35-point hit.
} as const;


// --- NLP DICTIONARIES ---
const FILLER_ADVERBS = [
 "basically", "actually", "just", "really", "very", "literally", "probably", "simply"
];


const FILLER_PHRASES = [
 "kind of", "sort of", "maybe", "perhaps", "i think", "i guess", "you know",
 "not really sure", "not exactly sure", "some sort of", "basically just", "more or less"
];


const VAGUE_TERMS = [
 "something", "anything", "everything", "stuff", "thing", "things", "somehow", "somewhere", "whatever"
];


const VAGUE_PHRASES = [
 "some way", "make it better", "help me with this", "do whatever makes sense", "whatever works", "something like that"
];


const STOP_WORDS = new Set([
 "the", "is", "at", "which", "on", "and", "a", "an", "of", "to", "in",
 "for", "with", "it", "that", "as", "be", "this", "or", "by", "from",
 "are", "was", "were", "will", "would", "can", "could", "should", "i",
 "you", "me", "my", "your", "we", "they", "them", "our", "their"
]);


// Contradiction patterns catch adversarial or confused prompts
const CONTRADICTION_PATTERNS = [
 /\b(very detailed|highly detailed)\b[\s\S]{0,40}\b(concise|brief)\b/i,
 /\b(concise|brief)\b[\s\S]{0,40}\b(very detailed|highly detailed)\b/i,
 /\bcover\s+everything\b[\s\S]{0,40}\bbrief(ly)?\b/i,
 /\bsimple\b[\s\S]{0,30}\bexpert(-|\s)?level\b/i,
 /\bexpert(-|\s)?level\b[\s\S]{0,30}\bsimple\b/i,
 /\bbeginner(\s|-)?friendly\b[\s\S]{0,30}\badvanced\b/i,
 /\badvanced\b[\s\S]{0,30}\bbeginner(\s|-)?friendly\b/i,
];


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
 if (!text.trim()) return 0;
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
 const doc = nlp(text);
 const words = doc.terms().out('array');
 const wordCount = words.length;
 const tokenCount = countTokens(text);


 // --- SMART MATCHING WITH COMPROMISE ---
 const adverbMatches = doc.match('#Adverb').match(`(${FILLER_ADVERBS.join('|')})`).length;
 const phraseMatches = doc.match(`(${FILLER_PHRASES.join('|')})`).length;
  const fillerCount = adverbMatches + phraseMatches;
 const fillerRatio = wordCount === 0 ? 0 : fillerCount / wordCount;


 const vaguenessCount = doc.match(`(${VAGUE_TERMS.join('|')})`).length;
 const vaguePhraseMatches = doc.match(`(${VAGUE_PHRASES.join('|')})`).length;
 const vaguenessScore = wordCount === 0 ? 0 : (vaguenessCount + (vaguePhraseMatches * 2)) / wordCount;


 // --- REPETITION (Mathematical + Burst Detection) ---
 const meaningfulWords = words.filter((word: string) => !STOP_WORDS.has(word.toLowerCase()));
 const meaningfulWordCount = meaningfulWords.length;
 const uniqueMeaningfulWordCount = new Set(meaningfulWords).size;


 const baseRepetition = meaningfulWordCount === 0
   ? 0
   : (meaningfulWordCount - uniqueMeaningfulWordCount) / meaningfulWordCount;


 // Catch adversarial repetition (e.g., "Help help help")
 const burstMatches = rawText.toLowerCase().match(/\b([a-z]{3,})\b(?:\W+\1\b){2,}/g);
 const burstPenalty = burstMatches ? Math.min(burstMatches.length * 0.15, 0.5) : 0;
  const repetitionScore = clamp(baseRepetition + burstPenalty, 0, 1);


 // --- STRUCTURE & ACTIONABILITY ---
 const hasGoal = /\b(goal|task|objective)\b/i.test(rawText);
 const hasContext = /\b(context|background)\b/i.test(rawText);
 const hasOutputFormat = /\b(output format|return|respond with|format|json|markdown|bullet points)\b/i.test(rawText);
 const hasConstraints = /\b(constraints|requirements|must|do not|avoid)\b/i.test(rawText);
 const hasExample = /\b(example|input|output)\b/i.test(rawText);
 const hasAudience = /\b(target audience|audience|for beginners|for engineers)\b/i.test(rawText);


 const structureSignals = [hasGoal, hasContext, hasOutputFormat, hasConstraints, hasExample, hasAudience].filter(Boolean).length;
 const structureScore = Math.min(6, structureSignals);


 // --- CONTRADICTION CHECK ---
 let contradictionCount = 0;
 for (const pattern of CONTRADICTION_PATTERNS) {
   if (pattern.test(rawText)) contradictionCount += 1;
 }


 // --- EFFICIENCY & RESOURCE CALCULATION ---
 const fluffRatioPenalty = fillerRatio * EFFICIENCY_WEIGHTS.fluffMultiplier;
 const repetitionPenalty = repetitionScore * EFFICIENCY_WEIGHTS.repetitionMultiplier;
 const vaguenessPenalty = vaguenessScore * EFFICIENCY_WEIGHTS.vaguenessMultiplier;
 const contradictionPenalty = contradictionCount * EFFICIENCY_WEIGHTS.contradictionPenalty;
  const lengthPenalty = tokenCount > EFFICIENCY_WEIGHTS.lengthPenaltyStart
   ? Math.min(
       EFFICIENCY_WEIGHTS.maxLengthPenalty,
       (tokenCount - EFFICIENCY_WEIGHTS.lengthPenaltyStart) / EFFICIENCY_WEIGHTS.lengthPenaltyDivisor
     )
   : 0;
    
 const structureBonus = Math.min(
   EFFICIENCY_WEIGHTS.maxStructureBonus,
   structureScore * EFFICIENCY_WEIGHTS.structureMultiplier
 );


 // The math alone handles the strictness now, naturally bringing bad prompts into the 20-50 range.
 const efficiencyScore = clamp(
   100 - fluffRatioPenalty - repetitionPenalty - lengthPenalty - vaguenessPenalty - contradictionPenalty + structureBonus,
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
