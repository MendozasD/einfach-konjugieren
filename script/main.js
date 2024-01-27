import "animate.css";
import "/style/style.scss";
import { conjugator } from "/script/conjugator.js";
import { saveVerb } from "/script/save_verb.js";
import { counter } from "/script/counter.js";

document.querySelector("#app").innerHTML = `
  <div id="container">
    <div id="conjugator">
      <h1 class="title">Einfach Konjugieren</h1>
      <section id="input_field">
        <input type="text" id="verb_input" placeholder="Wort eingeben" />
      <button id="search_btn">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </button>
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
      <section id="conjugated_table"></section>
    </div>
  </div>
`;

let verb = document.querySelector("#verb_input");
const searchBtn = document.querySelector("#search_btn");
const saveBtn = document.querySelector("#save_btn");
const bouncyBtn = document.getElementById("bounce_btn");

searchBtn.addEventListener("click", () => {
  conjugator(verb.value.toLowerCase());
  saveBtn.disabled = false;
});

saveBtn.addEventListener("click", () => {
  const currentVerb = document.querySelector("#" + verb.value.toLowerCase());
  if (currentVerb) {
    saveBtn.style.backgroundColor = "var(--red)";
    saveBtn.innerHTML = "Schon gespeichern";
    bouncyBtn.style.backgroundColor = "var(--red)";
    setTimeout(function () {
      saveBtn.innerHTML = "Speichern";
      saveBtn.style.backgroundColor = "white";
      bouncyBtn.style.backgroundColor = "transparent";
    }, 1200);
  } else {
    saveVerb();
    counter(bouncyBtn);

    // Styling changes
    saveBtn.style.backgroundColor = "var(--green)";
    setTimeout(function () {
      saveBtn.style.backgroundColor = "white";
    }, 1000);
  }
});
