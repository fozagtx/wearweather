const STOP = new Set(["the", "and", "for", "with", "that", "this", "from", "into", "want", "like", "look", "wear", "some", "very"]);

const FASHION_SYNONYMS: Record<string, string[]> = {
  street: ["relaxed", "overshirt", "casual", "loose", "movement"],
  luxury: ["tailored", "blazer", "structured", "navy", "formal"],
  quiet: ["tailored", "blazer", "neutral", "beige", "tan"],
  suit: ["tailored", "jacket", "formal", "navy", "blazer"],
  blazer: ["jacket", "tailored", "coverage", "business"],
  dress: ["sundress", "wrap", "maxi", "slip", "sleeveless", "floral"],
  casual: ["relaxed", "smart_casual", "overshirt", "easy"],
  formal: ["tailored", "navy", "lining", "jacket"],
  summer: ["light", "sleeveless", "hot", "sheer"],
  winter: ["coverage", "jacket", "layer"],
  office: ["business", "blazer", "tailored", "shirt"],
  party: ["evening", "column", "bold"],
  honeymoon: ["sundress", "wrap", "maxi", "floral", "resort", "light", "sleeveless"],
  resort: ["sundress", "wrap", "maxi", "floral", "light", "sleeveless"],
  vacation: ["sundress", "wrap", "maxi", "floral", "light", "relaxed"],
  beach: ["maxi", "sundress", "wrap", "light", "sleeveless"],
  linen: ["light", "relaxed", "dress", "wrap"],
  dinner: ["tailored", "column", "evening"],
  weekend: ["relaxed", "easy", "overshirt", "casual"],
  travel: ["light", "easy", "relaxed", "movement"],
};

const MAKEUP_SYNONYMS: Record<string, string[]> = {
  smoky: ["evening", "glam", "bold", "night", "liner"],
  glam: ["evening", "bold", "party", "red", "berry"],
  natural: ["daily", "sheer", "nude", "soft", "fresh"],
  nude: ["daily", "sheer", "soft", "rosy"],
  red: ["evening", "bold", "berry", "lip"],
  korean: ["sheer", "fresh", "daily", "glass", "rosy"],
  glass: ["sheer", "gloss", "fresh"],
  office: ["chic", "rosy", "daily", "nude"],
  soft: ["daily", "rosy", "nude", "sheer"],
  evening: ["glam", "night", "bold", "berry"],
};

export function tokenizePrompt(prompt: string) {
  return prompt
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP.has(token));
}

export function expandFashionTokens(prompt: string) {
  const tokens = tokenizePrompt(prompt);
  const extra = tokens.flatMap((token) => FASHION_SYNONYMS[token] || []);
  return [...new Set([...tokens, ...extra])];
}

export function expandMakeupTokens(prompt: string) {
  const tokens = tokenizePrompt(prompt);
  const extra = tokens.flatMap((token) => MAKEUP_SYNONYMS[token] || []);
  return [...new Set([...tokens, ...extra])];
}

const HAIR_SYNONYMS: Record<string, string[]> = {
  slick: ["sleek", "bun", "updo", "pulled", "neat"],
  sleek: ["slick", "bun", "bob"],
  bun: ["updo", "slick", "knot"],
  updo: ["bun", "twist", "slick"],
  loose: ["wave", "layers", "soft", "long"],
  wave: ["loose", "curl", "volume"],
  short: ["bob", "pixie", "crop"],
  long: ["layers", "wave", "loose"],
  evening: ["volume", "set", "wave", "glam"],
  office: ["slick", "bob", "neat"],
};

export function expandHairTokens(prompt: string) {
  const tokens = tokenizePrompt(prompt);
  const extra = tokens.flatMap((token) => HAIR_SYNONYMS[token] || []);
  return [...new Set([...tokens, ...extra])];
}

export function scoreHaystack(haystack: string, tokens: string[]) {
  if (!tokens.length) return 0;
  const hay = haystack.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (hay.includes(token)) score += 4;
  }
  return score;
}
