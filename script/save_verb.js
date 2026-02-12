import { counter } from "./counter.js";
import { removeSavedVerb } from "./state.js";
import { TENSE_LABELS, PERSON_ORDER, PERSON_LABELS } from "./api.js";

export function saveVerb(infinitive, tense, conjugations) {
  const bouncyBtn = document.getElementById("bounce_btn");
  const table = document.getElementById("conjugated_table");

  const rows = PERSON_ORDER.map(
    (p) => `
    <div class="enlisted_row">
      <p>${PERSON_LABELS[p]}</p>
      <p>${conjugations[p]}</p>
    </div>`
  ).join("");

  const card = document.createElement("section");
  card.className = "enlisted_verb";
  card.dataset.infinitive = infinitive;
  card.dataset.tense = tense;
  card.innerHTML = `
    <h1 class="enlisted_head">${infinitive}</h1>
    <span class="enlisted_tense">${TENSE_LABELS[tense]}</span>
    ${rows}
    <span class="material-symbols-outlined delete_btn">delete</span>
  `;

  card.querySelector(".delete_btn").addEventListener("click", () => {
    removeSavedVerb(infinitive, tense);
    card.remove();
    counter(bouncyBtn);
  });

  table.appendChild(card);
}
