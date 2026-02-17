// Central state management with localStorage persistence

const STORAGE_KEY = "einfach_saved_verbs";

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSaved() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.savedVerbs));
}

const state = {
  currentVerb: null,
  currentTense: "PRASENS",
  currentData: null,
  savedVerbs: loadSaved(),
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
  persistSaved();
  return true;
}

export function removeSavedVerb(infinitive, tense) {
  state.savedVerbs = state.savedVerbs.filter(
    (v) => !(v.infinitive === infinitive && v.tense === tense)
  );
  persistSaved();
}

export function isSaved(infinitive, tense) {
  return state.savedVerbs.some(
    (v) => v.infinitive === infinitive && v.tense === tense
  );
}

export function getSavedVerbs() {
  return state.savedVerbs;
}

export function getSavedCount() {
  return state.savedVerbs.length;
}

export function clearAllSavedVerbs() {
  state.savedVerbs = [];
  persistSaved();
}
