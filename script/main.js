import "/style/style.scss";
import { conjugator } from "/script/conjugator.js";
import { saveVerb } from "/script/save_verb.js";

document.querySelector("#app").innerHTML = `
  <div id="container">
    <div id="conjugator">
      <h1 class="title">Einfach Konjugieren</h1>
      <section id="input_field">
        <input type="text" id="verb_input" placeholder="Wort eingeben" />
        <button id="search_btn">los</button>
        </section>
      <section id="conjugator_result">
      </section>
      <section class="center_parent">
        <button id="save_btn" disabled="true" class="pan_font">Speichern</button>
      </section>
    </div>

    <div id="conjugated_list">
      <h1 class="title">Konjugierte Verben</h1>
    </div>
  </div>
`;

let verb = document.querySelector("#verb_input");
const searchBtn = document.querySelector("#search_btn");
const saveBtn = document.querySelector("#save_btn");

searchBtn.addEventListener("click", () => {
  conjugator(verb.value);
  document.querySelector("#save_btn").disabled = false;
});

saveBtn.addEventListener("click", () => {
  const currentVerb = document.querySelector("#" + verb.value);
  if (currentVerb) {
    saveBtn.style.backgroundColor = "red";
    saveBtn.innerHTML = "Schon gespeichern";
    setTimeout(function () {
      saveBtn.innerHTML = "Speichern";
      saveBtn.style.backgroundColor = "gray";
    }, 1000);
  } else {
    saveVerb();
  }
});
