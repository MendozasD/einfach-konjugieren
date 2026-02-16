import { counter } from "./counter.js";
import { removeSavedVerb } from "./state.js";
import { TENSE_LABELS, PERSON_ORDER, PERSON_LABELS } from "./api.js";

export function saveVerb(infinitive, tense, conjugations) {
  const table = document.getElementById("conjugated_table");

  // Remove empty state if present
  const emptyState = table.querySelector(".empty_state");
  if (emptyState) emptyState.remove();

  const card = document.createElement("section");
  card.className = "enlisted_verb animate__animated animate__fadeInUp";
  card.dataset.infinitive = infinitive;
  card.dataset.tense = tense;

  // Build card header safely with textContent
  const head = document.createElement("h1");
  head.className = "enlisted_head";
  head.textContent = infinitive;
  card.appendChild(head);

  const tenseBadge = document.createElement("span");
  tenseBadge.className = "enlisted_tense";
  tenseBadge.textContent = TENSE_LABELS[tense];
  card.appendChild(tenseBadge);

  // Build conjugation rows safely
  for (const p of PERSON_ORDER) {
    const row = document.createElement("div");
    row.className = "enlisted_row";

    const pronoun = document.createElement("p");
    pronoun.textContent = PERSON_LABELS[p];
    row.appendChild(pronoun);

    const conj = document.createElement("p");
    conj.textContent = conjugations[p];
    row.appendChild(conj);

    card.appendChild(row);
  }

  // Delete button
  const deleteBtn = document.createElement("span");
  deleteBtn.className = "material-symbols-outlined delete_btn";
  deleteBtn.textContent = "delete";
  deleteBtn.addEventListener("click", () => {
    removeSavedVerb(infinitive, tense);
    card.classList.add("animate__fadeOutDown");
    card.addEventListener("animationend", () => {
      card.remove();
      counter();
      renderEmptyState();
    });
  });
  card.appendChild(deleteBtn);

  table.appendChild(card);
}

export function renderEmptyState() {
  const table = document.getElementById("conjugated_table");
  if (!table) return;
  if (table.querySelectorAll(".enlisted_verb").length === 0) {
    table.innerHTML = `
      <div class="empty_state">
        <span class="material-symbols-outlined">bookmark_border</span>
        <p>Noch keine Verben gespeichert</p>
      </div>`;
  }
}

export function restoreSavedVerbs(savedVerbs) {
  const table = document.getElementById("conjugated_table");
  if (!table) return;
  if (savedVerbs.length === 0) {
    renderEmptyState();
    return;
  }
  for (const v of savedVerbs) {
    saveVerb(v.infinitive, v.tense, v.conjugations);
  }
}
