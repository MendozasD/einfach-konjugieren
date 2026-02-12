// Central state management for Einfach Konjugieren

const state = {
  currentVerb: null,
  currentTense: "PRASENS",
  currentData: null, // Full API response (all tenses)
  savedVerbs: [],     // Array of { infinitive, tense, conjugations }
};

export function getState() {
  return state;
}

export function setCurrentVerb(verb) {
  state.currentVerb = verb;
}

export function setCurrentTense(tense) {
  state.currentTense = tense;
}

export function setCurrentData(data) {
  state.currentData = data;
}

export function addSavedVerb(infinitive, tense, conjugations) {
  const exists = state.savedVerbs.some(
    (v) => v.infinitive === infinitive && v.tense === tense
  );
  if (exists) return false;
  state.savedVerbs.push({ infinitive, tense, conjugations });
  return true;
}

export function removeSavedVerb(infinitive, tense) {
  state.savedVerbs = state.savedVerbs.filter(
    (v) => !(v.infinitive === infinitive && v.tense === tense)
  );
}

export function getSavedVerbs() {
  return state.savedVerbs;
}

export function getSavedCount() {
  return state.savedVerbs.length;
}
