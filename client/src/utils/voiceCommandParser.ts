export interface VoiceCommand {
  intent: string;
  quantity: number;
  searchTerm: string;
}

const INTENT_WORDS = new Set(["add", "put", "get", "order", "buy"]);

const UNIT_WORDS = new Set([
  "pack",
  "packs",
  "packet",
  "packets",
  "bottle",
  "bottles",
  "bag",
  "bags",
  "piece",
  "pieces",
  "box",
  "boxes",
  "can",
  "cans",
  "jar",
  "jars",
  "bunch",
  "bunches",
  "kg",
  "kilo",
  "kilos",
  "liter",
  "liters",
  "litre",
  "litres",
  "dozen",
  "of",
]);

// Words that carry no meaning for the search itself — filtering these out
// stops phrases like "get me two bottles of milk" from searching for
// "me milk" instead of just "milk".
const FILLER_WORDS = new Set([
  "me",
  "please",
  "some",
  "a",
  "an",
  "the",
  "my",
  "to",
  "into",
  "cart",
  "for",
]);

const WORD_TO_NUMBER: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  a: 1,
  an: 1,
};

/**
 * Parses a voice transcript like "add two packs of milk" into structured data.
 *
 * @returns `null` if the transcript is empty or yields no search term.
 */
export function parseVoiceCommand(transcript: string): VoiceCommand | null {
  const raw = transcript.toLowerCase().trim();
  if (!raw) return null;

  const words = raw.split(/\s+/);
  let intent = "add";
  let quantity = 1;
  let quantityFound = false;

  const remaining: string[] = [];

  for (const word of words) {
    // Extract intent (only the very first word, before anything else has
    // been collected)
    if (INTENT_WORDS.has(word) && remaining.length === 0) {
      intent = word;
      continue;
    }

    // Extract numeric quantity ("2", "10")
    if (!quantityFound && /^\d+$/.test(word)) {
      quantity = parseInt(word, 10);
      quantityFound = true;
      continue;
    }

    // Extract word-based quantity ("two", "three")
    // Note: "a"/"an" are also valid articles (handled by FILLER_WORDS check
    // below), but since they map to quantity 1 anyway, letting them fall
    // through here first is harmless and keeps the quantity explicit.
    if (!quantityFound && word in WORD_TO_NUMBER) {
      quantity = WORD_TO_NUMBER[word];
      quantityFound = true;
      continue;
    }

    // Skip unit words and meaningless filler words — neither should ever
    // end up inside the product search term.
    if (UNIT_WORDS.has(word) || FILLER_WORDS.has(word)) {
      continue;
    }

    remaining.push(word);
  }

  const searchTerm = remaining.join(" ").trim();
  if (!searchTerm) return null;

  return { intent, quantity, searchTerm };
}