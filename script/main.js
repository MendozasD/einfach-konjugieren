import "animate.css";
import "/style/style.scss";
import { conjugator } from "/script/conjugator.js";
import { saveVerb } from "/script/save_verb.js";
import { counter } from "/script/counter.js";
import { getState, addSavedVerb } from "/script/state.js";
import {
  INDICATIVE_TENSES,
  TENSE_LABELS,
  getIndicativeTenses,
  fetchVerbList,
} from "/script/api.js";

document.querySelector("#app").innerHTML = `
  <div id="container">
    <div id="conjugator">
      <h1 class="title">Einfach Konjugieren</h1>
      <section id="input_field">
        <input type="text" id="verb_input" placeholder="Wort eingeben" autocomplete="off" />
        <span id="search_btn" class="material-symbols-outlined">
          arrow_circle_right
        </span>
        <ul id="autocomplete_list"></ul>
      </section>
      <section id="conjugator_result">
      </section>
      <section class="center_parent">
        <button id="save_btn" disabled="true" class="pan_font">Speichern</button>
        <a href="#conjugated_list" id="bounce_btn">0</a>
      </section>
    </div>

    <div id="conjugated_list">
      <h1 class="title">Konjugierte Verben</h1>
      <section id="download_actions">
        <button id="pdf_btn" class="download_btn" disabled>
          <span class="material-symbols-outlined">picture_as_pdf</span>
          PDF herunterladen
        </button>
        <button id="wallpaper_btn" class="download_btn" disabled>
          <span class="material-symbols-outlined">wallpaper</span>
          Als Wallpaper
        </button>
      </section>
      <section id="conjugated_table"></section>
    </div>
    <footer id="made_by">Made by <a href="https://davidmendoza.ch" target="_blank">David Mendoza</a></footer>
  </div>
`;

// Elements
const verbInput = document.querySelector("#verb_input");
const searchBtn = document.querySelector("#search_btn");
const saveBtn = document.querySelector("#save_btn");
const bouncyBtn = document.getElementById("bounce_btn");
const pdfBtn = document.getElementById("pdf_btn");
const wallpaperBtn = document.getElementById("wallpaper_btn");
const autocompleteList = document.getElementById("autocomplete_list");

// Preload verb list for autocomplete
let verbList = [];
fetchVerbList().then((list) => {
  verbList = list;
});

// Autocomplete
let acSelected = -1;

function showAutocomplete(value) {
  autocompleteList.innerHTML = "";
  acSelected = -1;
  if (!value || value.length < 2) {
    autocompleteList.classList.remove("visible");
    return;
  }
  const lower = value.toLowerCase();
  const matches = verbList
    .filter((v) => v.startsWith(lower))
    .slice(0, 8);
  if (matches.length === 0) {
    autocompleteList.classList.remove("visible");
    return;
  }
  for (const match of matches) {
    const li = document.createElement("li");
    li.textContent = match;
    li.addEventListener("mousedown", (e) => {
      e.preventDefault();
      verbInput.value = match;
      autocompleteList.classList.remove("visible");
      doSearch();
    });
    autocompleteList.appendChild(li);
  }
  autocompleteList.classList.add("visible");
}

verbInput.addEventListener("input", () => {
  showAutocomplete(verbInput.value);
});

verbInput.addEventListener("blur", () => {
  setTimeout(() => autocompleteList.classList.remove("visible"), 150);
});

verbInput.addEventListener("keydown", (e) => {
  const items = autocompleteList.querySelectorAll("li");
  if (!items.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    acSelected = Math.min(acSelected + 1, items.length - 1);
    items.forEach((li, i) => li.classList.toggle("selected", i === acSelected));
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    acSelected = Math.max(acSelected - 1, 0);
    items.forEach((li, i) => li.classList.toggle("selected", i === acSelected));
  } else if (e.key === "Enter" && acSelected >= 0) {
    e.preventDefault();
    verbInput.value = items[acSelected].textContent;
    autocompleteList.classList.remove("visible");
    doSearch();
  }
});

// Search
async function doSearch() {
  const input = verbInput.value.toLowerCase().trim();
  if (!input) return;
  autocompleteList.classList.remove("visible");
  saveBtn.disabled = true;
  const found = await conjugator(input);
  if (found) saveBtn.disabled = false;
}

searchBtn.addEventListener("click", doSearch);

verbInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter" && acSelected < 0) doSearch();
});

// Save all tenses at once
saveBtn.addEventListener("click", () => {
  const { currentVerb, currentData } = getState();
  if (!currentVerb || !currentData) return;

  const indicative = getIndicativeTenses(currentData);
  let anyAdded = false;
  let anyDuplicate = false;

  for (const tense of INDICATIVE_TENSES) {
    if (!indicative[tense]) continue;
    const added = addSavedVerb(currentVerb, tense, indicative[tense]);
    if (added) {
      saveVerb(currentVerb, tense, indicative[tense]);
      anyAdded = true;
    } else {
      anyDuplicate = true;
    }
  }

  if (anyAdded) {
    counter(bouncyBtn);
    saveBtn.style.backgroundColor = "var(--green)";
    setTimeout(() => {
      saveBtn.style.backgroundColor = "white";
    }, 1000);
  }

  if (!anyAdded && anyDuplicate) {
    saveBtn.style.backgroundColor = "var(--red)";
    saveBtn.innerHTML = "Schon gespeichert";
    bouncyBtn.style.backgroundColor = "var(--red)";
    setTimeout(() => {
      saveBtn.innerHTML = "Speichern";
      saveBtn.style.backgroundColor = "white";
      bouncyBtn.style.backgroundColor = "transparent";
    }, 1200);
  }
});

// PDF download
pdfBtn.addEventListener("click", async () => {
  const { generatePDF } = await import("/script/pdf.js");
  generatePDF();
});

// Wallpaper download
wallpaperBtn.addEventListener("click", async () => {
  const { generateWallpaper } = await import("/script/wallpaper.js");
  generateWallpaper();
});
