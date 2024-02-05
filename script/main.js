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
      <section id="conjugated_table"></section>
    </div>
    <footer id="made_by">Made by <a href="https://davidmendoza.ch" target="_blank">David Mendoza</a></footer>
  </div>
`;

// Variables
let verb = document.querySelector("#verb_input");
const searchBtn = document.querySelector("#search_btn");
const saveBtn = document.querySelector("#save_btn");
const bouncyBtn = document.getElementById("bounce_btn");

// Look for a verb when clicking the search button
searchBtn.addEventListener("click", () => {
  conjugator(verb.value.toLowerCase());
  saveBtn.disabled = false;
});

// Look for a verb when pressing enter
verb.addEventListener("keyup", function (e) {
  if (e.keyCode === 13) {
    conjugator(verb.value.toLowerCase());
    saveBtn.disabled = false;
  }
});

// Save a verb when clicking the save button
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
