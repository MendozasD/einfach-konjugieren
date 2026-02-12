import {
  fetchAllTenses,
  getIndicativeTenses,
  INDICATIVE_TENSES,
  TENSE_LABELS,
  PERSON_ORDER,
  PERSON_LABELS,
} from "/script/api.js";
import {
  setCurrentVerb,
  setCurrentTense,
  setCurrentData,
  getState,
} from "/script/state.js";

function renderLoading() {
  document.querySelector("#conjugator_result").innerHTML = `
    <div id="loading_state" class="animate__animated animate__fadeIn">
      <div class="loading_spinner"></div>
    </div>`;
}

function renderTensePills(activeTense) {
  const pills = INDICATIVE_TENSES.map(
    (t) =>
      `<button class="tense_pill${t === activeTense ? " active" : ""}" data-tense="${t}">${TENSE_LABELS[t]}</button>`
  ).join("");
  return `<div id="tense_selector">${pills}</div>`;
}

function renderConjugationCard(verb, tense, conjugations) {
  const rows = PERSON_ORDER.map(
    (p) => `
      <div class="conjugated_row">
        <p class="pronoun_column">${PERSON_LABELS[p]}</p>
        <p class="conjugated_column">${conjugations[p]}</p>
      </div>`
  ).join("");

  return `
    <div id="conjugated_box" class="animate__animated animate__fadeInUp">
      <div id="infinitive"><h1>${verb}</h1></div>
      <span class="tense_label">${TENSE_LABELS[tense]}</span>
      ${rows}
    </div>`;
}

function renderError(verb) {
  document.querySelector("#conjugator_result").innerHTML = `
    <div id="conjugator_error" class="animate__animated animate__fadeInUp">
      Verb \u201E${verb}\u201C nicht gefunden.
    </div>`;
}

function showTense(tense) {
  const { currentVerb, currentData } = getState();
  const indicative = getIndicativeTenses(currentData);
  if (!indicative[tense]) return;

  setCurrentTense(tense);
  const container = document.querySelector("#conjugator_result");
  container.innerHTML =
    renderTensePills(tense) + renderConjugationCard(currentVerb, tense, indicative[tense]);

  // Re-attach pill click handlers
  container.querySelectorAll(".tense_pill").forEach((pill) => {
    pill.addEventListener("click", () => showTense(pill.dataset.tense));
  });
}

export async function conjugator(inputVerb) {
  if (!inputVerb.trim()) return;
  renderLoading();

  try {
    const data = await fetchAllTenses(inputVerb);
    setCurrentVerb(inputVerb);
    setCurrentData(data);
    setCurrentTense("PRASENS");
    showTense("PRASENS");
    return true;
  } catch (e) {
    renderError(inputVerb);
    return false;
  }
}
