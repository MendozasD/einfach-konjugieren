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
  PRASENS: "Präsens",
  PRATERITUM: "Präteritum",
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

let verbListCache = null;

export async function fetchVerbList() {
  if (verbListCache) return verbListCache;
  const res = await fetch("/api/german-verbs-api/verbs");
  if (!res.ok) return [];
  const json = await res.json();
  verbListCache = json.data || [];
  return verbListCache;
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
