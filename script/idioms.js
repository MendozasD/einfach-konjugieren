// Redewendungen (Idioms) section — browsable grid of multi-word verbs
import { fetchIdiomList } from "/script/api.js";
import { conjugator } from "/script/conjugator.js";

let allIdioms = [];

function buildIdiomCard({ phrase, gloss }) {
  const card = document.createElement("div");
  card.className = "idiom_card";

  const phraseEl = document.createElement("span");
  phraseEl.className = "idiom_phrase";
  phraseEl.textContent = phrase;
  card.appendChild(phraseEl);

  const glossEl = document.createElement("span");
  glossEl.className = "idiom_gloss";
  glossEl.textContent = gloss;
  card.appendChild(glossEl);

  card.addEventListener("click", () => handleIdiomClick(phrase));
  return card;
}

function filterIdioms(query) {
  const grid = document.getElementById("idioms_grid");
  if (!grid) return;

  const lower = query.toLowerCase();
  grid.innerHTML = "";

  const filtered = lower
    ? allIdioms.filter(
        (i) =>
          i.phrase.toLowerCase().includes(lower) ||
          i.gloss.toLowerCase().includes(lower)
      )
    : allIdioms;

  // Update count badge
  const badge = document.getElementById("idioms_count");
  if (badge) badge.textContent = filtered.length;

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty_state";
    empty.innerHTML =
      '<span class="material-symbols-outlined">search_off</span><p>Keine Redewendungen gefunden</p>';
    grid.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const idiom of filtered) {
    fragment.appendChild(buildIdiomCard(idiom));
  }
  grid.appendChild(fragment);
}

async function handleIdiomClick(phrase) {
  const verbInput = document.getElementById("verb_input");
  const conjugatorSection = document.getElementById("conjugator");

  // Scroll to conjugator
  conjugatorSection.scrollIntoView({ behavior: "smooth" });

  // Set input and conjugate
  verbInput.value = phrase;
  await conjugator(phrase);
}

export async function initIdioms() {
  allIdioms = await fetchIdiomList();
  if (!allIdioms.length) return;

  const grid = document.getElementById("idioms_grid");
  const badge = document.getElementById("idioms_count");
  const search = document.getElementById("idioms_search");

  if (badge) badge.textContent = allIdioms.length;

  // Render initial grid
  const fragment = document.createDocumentFragment();
  for (const idiom of allIdioms) {
    fragment.appendChild(buildIdiomCard(idiom));
  }
  grid.appendChild(fragment);

  // Attach search
  let searchTimer;
  search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => filterIdioms(search.value), 150);
  });
}
