// API client for German Verbs API

export const INDICATIVE_TENSES = [
  "PRASENS",
  "PRATERITUM",
  "PERFEKT",
  "PLUSQUAMPERFEKT",
  "FUTUR1",
  "FUTUR2",
];

export const TENSE_LABELS = {
  PRASENS: "Pr\u00e4sens",
  PRATERITUM: "Pr\u00e4teritum",
  PERFEKT: "Perfekt",
  PLUSQUAMPERFEKT: "Plusquamperfekt",
  FUTUR1: "Futur I",
  FUTUR2: "Futur II",
};

export const PERSON_ORDER = ["S1", "S2", "S3", "P1", "P2", "P3"];

export const PERSON_LABELS = {
  S1: "ich",
  S2: "du",
  S3: "er/sie/es",
  P1: "wir",
  P2: "ihr",
  P3: "sie/Sie",
};

const VERB_LIST_KEY = "einfach_verb_list_v3";
const VERB_LIST_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
let verbListCache = null;

export async function fetchVerbList() {
  if (verbListCache) return verbListCache;

  // Try localStorage first
  try {
    const stored = localStorage.getItem(VERB_LIST_KEY);
    if (stored) {
      const { data, ts } = JSON.parse(stored);
      if (Date.now() - ts < VERB_LIST_TTL) {
        verbListCache = data;
        return verbListCache;
      }
    }
  } catch { /* ignore */ }

  // Fetch from API
  try {
    const res = await fetch("/api/german-verbs-api/verbs");
    if (!res.ok) return [];
    const json = await res.json();
    verbListCache = json.data || [];
    localStorage.setItem(
      VERB_LIST_KEY,
      JSON.stringify({ data: verbListCache, ts: Date.now() })
    );
    return verbListCache;
  } catch {
    return [];
  }
}

export function getRandomVerb() {
  if (!verbListCache || verbListCache.length === 0) return null;
  return verbListCache[Math.floor(Math.random() * verbListCache.length)];
}

// Idiom list (multi-word verbs with glosses)
const IDIOM_LIST_KEY = "einfach_idiom_list_v1";
const IDIOM_LIST_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
let idiomListCache = null;

export async function fetchIdiomList() {
  if (idiomListCache) return idiomListCache;

  try {
    const stored = localStorage.getItem(IDIOM_LIST_KEY);
    if (stored) {
      const { data, ts } = JSON.parse(stored);
      if (Date.now() - ts < IDIOM_LIST_TTL) {
        idiomListCache = data;
        return idiomListCache;
      }
    }
  } catch { /* ignore */ }

  try {
    const res = await fetch("/api/german-verbs-api/idioms");
    if (!res.ok) return [];
    const json = await res.json();
    idiomListCache = json.data || [];
    localStorage.setItem(
      IDIOM_LIST_KEY,
      JSON.stringify({ data: idiomListCache, ts: Date.now() })
    );
    return idiomListCache;
  } catch {
    return [];
  }
}

export async function fetchAllTenses(verb) {
  const res = await fetch(
    `/api/german-verbs-api?verb=${encodeURIComponent(verb)}`
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error("Verb nicht gefunden");
  return json.data;
}

export function formatConjugation(parts) {
  if (typeof parts === "string") return parts;
  return parts.join(" ");
}

export function getIndicativeTenses(data) {
  const result = {};
  for (const tense of INDICATIVE_TENSES) {
    if (data[tense]) {
      result[tense] = {};
      for (const person of PERSON_ORDER) {
        result[tense][person] = formatConjugation(data[tense][person]);
      }
    }
  }
  return result;
}
