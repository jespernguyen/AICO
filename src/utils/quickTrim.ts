const FILLER_ADVERBS = [
  "basically",
  "actually",
  "just",
  "really",
  "very",
  "literally",
  "probably",
  "simply",
];

const FILLER_PHRASES = [
  "kind of",
  "sort of",
  "i think",
  "i guess",
  "you know",
  "basically just",
  "more or less",
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const phrasePattern = [...FILLER_PHRASES]
  .sort((a, b) => b.length - a.length)
  .map(escapeRegex)
  .join("|");
const adverbPattern = FILLER_ADVERBS.map(escapeRegex).join("|");

const FILLER_PHRASE_REGEX = new RegExp(`\\b(?:${phrasePattern})\\b`, "gi");
const FILLER_ADVERB_REGEX = new RegExp(`\\b(?:${adverbPattern})\\b`, "gi");

export function quickTrim(text: string): string {
  if (!text) {
    return text;
  }

  let trimmed = text
    .replace(FILLER_PHRASE_REGEX, "")
    .replace(FILLER_ADVERB_REGEX, "");

  trimmed = trimmed.replace(/[ \t]{2,}/g, " ");
  trimmed = trimmed.replace(/\s+([,.!?;:])/g, "$1");
  trimmed = trimmed.replace(/([.!?])\s*,+\s*/g, "$1 ");
  trimmed = trimmed.replace(/^[\s,]+|[\s,]+$/g, "");
  trimmed = trimmed.replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, letter) => {
    void match;
    return `${prefix}${String(letter).toUpperCase()}`;
  });

  return trimmed;
}
