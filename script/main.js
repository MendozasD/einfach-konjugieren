import "animate.css";
import "/style/style.scss";
import { conjugator } from "/script/conjugator.js";
import { saveVerb } from "/script/save_verb.js";
import { counter } from "/script/counter.js";
import { getState, addSavedVerb, getSavedCount } from "/script/state.js";
import { TENSE_LABELS, PERSON_ORDER, PERSON_LABELS, getIndicativeTenses } from "/script/api.js";

document.querySelector("#app").innerHTML = `
  <div id="container">
    <div id="conjugator">
      <h1 class="title">Einfach Konjugieren</h1>
      <section id="input_field">
        <input type="text" id="verb_input" placeholder="Wort eingeben" />
        <span id="search_btn" class="material-symbols-outlined">
          arrow_circle_right
        </span>
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

// Variables
const verb = document.querySelector("#verb_input");
const searchBtn = document.querySelector("#search_btn");
const saveBtn = document.querySelector("#save_btn");
const bouncyBtn = document.getElementById("bounce_btn");
const pdfBtn = document.getElementById("pdf_btn");
const wallpaperBtn = document.getElementById("wallpaper_btn");

async function doSearch() {
  const input = verb.value.toLowerCase().trim();
  if (!input) return;
  saveBtn.disabled = true;
  const found = await conjugator(input);
  if (found) saveBtn.disabled = false;
}

// Look for a verb when clicking the search button
searchBtn.addEventListener("click", doSearch);

// Look for a verb when pressing enter
verb.addEventListener("keyup", (e) => {
  if (e.key === "Enter") doSearch();
});

// Save a verb when clicking the save button
saveBtn.addEventListener("click", () => {
  const { currentVerb, currentTense, currentData } = getState();
  if (!currentVerb || !currentData) return;

  const indicative = getIndicativeTenses(currentData);
  const conjugations = indicative[currentTense];
  if (!conjugations) return;

  const added = addSavedVerb(currentVerb, currentTense, conjugations);

  if (!added) {
    // Already saved — flash red
    saveBtn.style.backgroundColor = "var(--red)";
    saveBtn.innerHTML = "Schon gespeichert";
    bouncyBtn.style.backgroundColor = "var(--red)";
    setTimeout(() => {
      saveBtn.innerHTML = "Speichern";
      saveBtn.style.backgroundColor = "white";
      bouncyBtn.style.backgroundColor = "transparent";
    }, 1200);
  } else {
    saveVerb(currentVerb, currentTense, conjugations);
    counter(bouncyBtn);

    saveBtn.style.backgroundColor = "var(--green)";
    setTimeout(() => {
      saveBtn.style.backgroundColor = "white";
    }, 1000);
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
