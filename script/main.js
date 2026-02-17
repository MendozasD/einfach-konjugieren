import "animate.css";
import "/style/style.scss";
import { conjugator } from "/script/conjugator.js";
import { fetchVerbList, getRandomVerb } from "/script/api.js";
import { getSavedVerbs, clearAllSavedVerbs } from "/script/state.js";
import { restoreSavedVerbs, renderEmptyState } from "/script/save_verb.js";
import { counter } from "/script/counter.js";
import { initIdioms } from "/script/idioms.js";

document.querySelector("#app").innerHTML = `
  <div id="container">
    <div id="conjugator">
      <h1 class="title">Einfach Konjugieren</h1>
      <section id="input_field">
        <input type="text" id="verb_input" placeholder="Wort eingeben" autocomplete="off" />
        <span id="kbd_hint">Enter \u21b5</span>
        <span id="search_btn" class="material-symbols-outlined">
          arrow_circle_right
        </span>
        <ul id="autocomplete_list"></ul>
      </section>
      <div id="random_verb_wrap">
        <button id="random_verb_btn">
          <span class="material-symbols-outlined">casino</span>
          Zuf\u00e4lliges Verb
        </button>
      </div>
      <section id="conjugator_result">
      </section>
    </div>

    <a href="#conjugated_list" id="floating_counter">0</a>

    <div id="section_divider">
      <a href="#idioms_section" id="bounce_btn">
        <span class="material-symbols-outlined">expand_more</span>
      </a>
    </div>

    <div id="idioms_section">
      <h1 class="title">Redewendungen <span id="idioms_count" class="idioms_count_badge">0</span></h1>
      <div id="idioms_search_wrap">
        <span class="material-symbols-outlined">search</span>
        <input type="text" id="idioms_search" placeholder="Redewendung oder Bedeutung suchen\u2026" autocomplete="off" />
      </div>
      <div id="idioms_grid"></div>
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
        <button id="clear_btn" class="download_btn clear_btn" disabled>
          <span class="material-symbols-outlined">delete_sweep</span>
          Alle entfernen
        </button>
      </section>
      <section id="conjugated_table"></section>
    </div>
    <footer id="made_by">
      <span>Made by <a href="https://davidmendoza.ch" target="_blank">David Mendoza</a></span>
      <span class="footer_links"><a href="/impressum.html">Impressum</a> \u00b7 <a href="/datenschutz.html">Datenschutz</a></span>
    </footer>
  </div>
`;

// Debounce utility
let debounceTimer;
function debounce(fn, delay) {
  return (...args) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fn(...args), delay);
  };
}

// Elements
const verbInput = document.querySelector("#verb_input");
const searchBtn = document.querySelector("#search_btn");
const pdfBtn = document.getElementById("pdf_btn");
const wallpaperBtn = document.getElementById("wallpaper_btn");
const autocompleteList = document.getElementById("autocomplete_list");
const floatingCounter = document.getElementById("floating_counter");
const conjugatedList = document.getElementById("conjugated_list");
const randomVerbBtn = document.getElementById("random_verb_btn");
const kbdHint = document.getElementById("kbd_hint");

// Preload verb list for autocomplete
let verbList = [];
fetchVerbList().then((list) => {
  verbList = list;
});

// Initialize idioms section
initIdioms();

// Restore saved verbs from localStorage
const saved = getSavedVerbs();
if (saved.length > 0) {
  restoreSavedVerbs(saved);
}
counter();

// Check URL for ?verb= parameter
const urlVerb = new URLSearchParams(window.location.search).get("verb");
if (urlVerb) {
  verbInput.value = urlVerb;
  conjugator(urlVerb.toLowerCase().trim());
}

// Floating counter: flip direction based on scroll position
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        floatingCounter.href = "#conjugator";
        floatingCounter.classList.add("upward");
      } else {
        floatingCounter.href = "#conjugated_list";
        floatingCounter.classList.remove("upward");
      }
    });
  },
  { threshold: 0.1 }
);
observer.observe(conjugatedList);

// Keyboard hint: show on focus, hide on blur or typing
verbInput.addEventListener("focus", () => {
  if (!verbInput.value) kbdHint.classList.add("visible");
});
verbInput.addEventListener("blur", () => {
  kbdHint.classList.remove("visible");
});
verbInput.addEventListener("input", () => {
  kbdHint.classList.remove("visible");
});

// Autocomplete
let acSelected = -1;

// Anglify: convert German special chars for matching
function anglify(s) {
  return s.replace(/\u00f6/g, "oe").replace(/\u00fc/g, "ue").replace(/\u00e4/g, "ae").replace(/\u00df/g, "ss");
}

function showAutocomplete(value) {
  autocompleteList.innerHTML = "";
  acSelected = -1;
  if (!value || value.length < 2) {
    autocompleteList.classList.remove("visible");
    return;
  }
  const lower = value.toLowerCase();
  const matches = verbList
    .filter((v) => v.startsWith(lower) || anglify(v).startsWith(lower))
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

verbInput.addEventListener("input", debounce(() => {
  showAutocomplete(verbInput.value);
}, 150));

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
  kbdHint.classList.remove("visible");
  await conjugator(input);
}

searchBtn.addEventListener("click", doSearch);

verbInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter" && acSelected < 0) doSearch();
});

// Random verb
randomVerbBtn.addEventListener("click", async () => {
  const verb = getRandomVerb();
  if (!verb) return;
  verbInput.value = verb;
  await doSearch();
});

// Clear all saved verbs
const clearBtn = document.getElementById("clear_btn");
clearBtn.addEventListener("click", () => {
  if (!confirm("Alle gespeicherten Verben entfernen?")) return;
  clearAllSavedVerbs();
  const table = document.getElementById("conjugated_table");
  table.querySelectorAll(".enlisted_verb").forEach((card) => {
    card.classList.add("animate__fadeOutDown");
    card.addEventListener("animationend", () => card.remove());
  });
  setTimeout(() => {
    renderEmptyState();
    counter();
  }, 400);
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
