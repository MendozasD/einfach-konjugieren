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
  addSavedVerb,
  isSaved,
} from "/script/state.js";
import { saveVerb } from "/script/save_verb.js";
import { counter } from "/script/counter.js";

function renderLoading() {
  document.querySelector("#conjugator_result").innerHTML = `
    <div id="loading_state" class="animate__animated animate__fadeIn">
      <div class="loading_spinner"></div>
    </div>`;
}

function buildTenseCard(verb, tense, indicative) {
  if (!indicative[tense]) return null;

  const card = document.createElement("div");
  card.className = "tense_card animate__animated animate__fadeInUp";
  card.dataset.tense = tense;

  // Header
  const header = document.createElement("div");
  header.className = "tense_card_header";
  const h2 = document.createElement("h2");
  h2.textContent = TENSE_LABELS[tense];
  header.appendChild(h2);
  card.appendChild(header);

  // Conjugation rows — user data via textContent
  for (const p of PERSON_ORDER) {
    const row = document.createElement("div");
    row.className = "conjugated_row";

    const pronoun = document.createElement("p");
    pronoun.className = "pronoun_column";
    pronoun.textContent = PERSON_LABELS[p];
    row.appendChild(pronoun);

    const conj = document.createElement("p");
    conj.className = "conjugated_column";
    conj.textContent = indicative[tense][p];
    row.appendChild(conj);

    card.appendChild(row);
  }

  // Save button
  const alreadySaved = isSaved(verb, tense);
  const btn = document.createElement("button");
  btn.className = alreadySaved ? "card_save_btn pan_font saved" : "card_save_btn pan_font";
  btn.dataset.tense = tense;

  const btnIcon = document.createElement("span");
  btnIcon.className = "material-symbols-outlined";
  btnIcon.textContent = alreadySaved ? "check" : "bookmark";
  btn.appendChild(btnIcon);
  btn.appendChild(document.createTextNode(alreadySaved ? " Gespeichert" : " Speichern"));

  card.appendChild(btn);
  return card;
}

function renderAllTenses(verb, indicative) {
  const fragment = document.createDocumentFragment();

  // Verb header
  const verbHeader = document.createElement("div");
  verbHeader.id = "verb_header";
  verbHeader.className = "animate__animated animate__fadeInUp";

  const h1 = document.createElement("h1");
  h1.textContent = verb;
  verbHeader.appendChild(h1);

  const actions = document.createElement("div");
  actions.id = "verb_actions";
  actions.innerHTML = `
    <button id="new_search_btn" class="pan_font">
      <span class="material-symbols-outlined">search</span>
      Neues Verb
    </button>
    <button id="share_btn" class="pan_font">
      <span class="material-symbols-outlined">share</span>
      Teilen
    </button>`;
  verbHeader.appendChild(actions);
  fragment.appendChild(verbHeader);

  // Tenses grid
  const grid = document.createElement("div");
  grid.id = "tenses_grid";
  for (const tense of INDICATIVE_TENSES) {
    const card = buildTenseCard(verb, tense, indicative);
    if (card) grid.appendChild(card);
  }
  fragment.appendChild(grid);

  return fragment;
}

function renderError(verb) {
  const container = document.querySelector("#conjugator_result");
  container.innerHTML = "";
  const errDiv = document.createElement("div");
  errDiv.id = "conjugator_error";
  errDiv.className = "animate__animated animate__fadeInUp";
  errDiv.textContent = `Verb \u201E${verb}\u201C nicht gefunden.`;
  container.appendChild(errDiv);
}

function attachSaveHandlers(verb, indicative) {
  document.querySelectorAll(".card_save_btn").forEach((btn) => {
    if (btn.classList.contains("saved")) return;
    btn.addEventListener("click", () => {
      const tense = btn.dataset.tense;
      const conjugations = indicative[tense];
      if (!conjugations) return;

      const added = addSavedVerb(verb, tense, conjugations);
      if (added) {
        saveVerb(verb, tense, conjugations);
        counter();
        btn.classList.add("saved");
        btn.innerHTML = '<span class="material-symbols-outlined">check</span> Gespeichert';
      } else {
        btn.classList.add("duplicate");
        btn.innerHTML = '<span class="material-symbols-outlined">close</span> Schon gespeichert';
        setTimeout(() => {
          btn.classList.remove("duplicate");
          btn.innerHTML = '<span class="material-symbols-outlined">bookmark</span> Speichern';
        }, 1200);
      }
    });
  });
}

function attachShareHandler(verb) {
  const shareBtn = document.getElementById("share_btn");
  if (!shareBtn) return;
  shareBtn.addEventListener("click", () => {
    const url = `${window.location.origin}?verb=${encodeURIComponent(verb)}`;
    navigator.clipboard.writeText(url).then(() => {
      shareBtn.innerHTML = '<span class="material-symbols-outlined">check</span> Kopiert';
      setTimeout(() => {
        shareBtn.innerHTML = '<span class="material-symbols-outlined">share</span> Teilen';
      }, 1500);
    });
  });
}

function showInput() {
  const inputField = document.getElementById("input_field");
  const verbInput = document.getElementById("verb_input");
  inputField.classList.remove("hidden");
  document.querySelector("#conjugator_result").innerHTML = "";
  verbInput.value = "";
  verbInput.focus();
  history.replaceState(null, "", window.location.pathname);
}

export async function conjugator(inputVerb) {
  if (!inputVerb.trim()) return;

  const inputField = document.getElementById("input_field");
  inputField.classList.add("hidden");
  renderLoading();

  history.replaceState(null, "", `?verb=${encodeURIComponent(inputVerb)}`);

  try {
    const data = await fetchAllTenses(inputVerb);
    setCurrentVerb(inputVerb);
    setCurrentData(data);
    setCurrentTense("PRASENS");

    const indicative = getIndicativeTenses(data);
    const container = document.querySelector("#conjugator_result");
    container.innerHTML = "";
    container.appendChild(renderAllTenses(inputVerb, indicative));
    attachSaveHandlers(inputVerb, indicative);
    attachShareHandler(inputVerb);

    document.getElementById("new_search_btn").addEventListener("click", showInput);

    return true;
  } catch (e) {
    inputField.classList.remove("hidden");
    history.replaceState(null, "", window.location.pathname);
    renderError(inputVerb);
    return false;
  }
}
