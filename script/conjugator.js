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

function renderAllTenses(verb, indicative) {
  const cards = INDICATIVE_TENSES.map((tense) => {
    if (!indicative[tense]) return "";
    const rows = PERSON_ORDER.map(
      (p) => `
        <div class="conjugated_row">
          <p class="pronoun_column">${PERSON_LABELS[p]}</p>
          <p class="conjugated_column">${indicative[tense][p]}</p>
        </div>`
    ).join("");

    return `
      <div class="tense_card animate__animated animate__fadeInUp">
        <div class="tense_card_header">
          <h2>${TENSE_LABELS[tense]}</h2>
        </div>
        ${rows}
      </div>`;
  }).join("");

  return `
    <div id="verb_header" class="animate__animated animate__fadeInUp">
      <h1>${verb}</h1>
    </div>
    <div id="tenses_grid">${cards}</div>`;
}

function renderError(verb) {
  document.querySelector("#conjugator_result").innerHTML = `
    <div id="conjugator_error" class="animate__animated animate__fadeInUp">
      Verb \u201E${verb}\u201C nicht gefunden.
    </div>`;
}

export async function conjugator(inputVerb) {
  if (!inputVerb.trim()) return;
  renderLoading();

  try {
    const data = await fetchAllTenses(inputVerb);
    setCurrentVerb(inputVerb);
    setCurrentData(data);
    setCurrentTense("PRASENS");

    const indicative = getIndicativeTenses(data);
    const container = document.querySelector("#conjugator_result");
    container.innerHTML = renderAllTenses(inputVerb, indicative);
    return true;
  } catch (e) {
    renderError(inputVerb);
    return false;
  }
}
