import { counter } from "./counter.js";

export function saveVerb() {
  const bouncyBtn = document.getElementById("bounce_btn");
  const enlistedVerbSection = document.getElementById("conjugated_table");
  const verbo = document.querySelector("#conjugated_box");

  // Getting verb's infinitve
  const currentVerb = verbo.children[0].children[0].innerHTML;

  let conjugatedElement = `<section id="${currentVerb}" class="enlisted_verb">
    <h1 class="enlisted_head">${currentVerb}</h1>
    <div class="enlisted_row"><p>ich</p><p>${verbo.children[1].children[1].innerHTML}</p></div>
    <div class="enlisted_row"><p>du</p><p>${verbo.children[2].children[1].innerHTML}</p></div>
    <div class="enlisted_row"><p>er/sie/es</p><p>${verbo.children[3].children[1].innerHTML}</p></div>
    <div class="enlisted_row"><p>wir</p><p>${verbo.children[4].children[1].innerHTML}</p></div>
    <div class="enlisted_row"><p>ihr</p><p>${verbo.children[5].children[1].innerHTML}</p></div>
    <div class="enlisted_row"><p>sie/Sie</p><p>${verbo.children[6].children[1].innerHTML}</p></div>
    <span class="material-symbols-outlined delete_btn">delete</span>
  </section>`;
  enlistedVerbSection.innerHTML += conjugatedElement;

  // Delete button
  const deleteBtn = document.querySelectorAll(".delete_btn");
  deleteBtn.forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.parentElement.remove();
      counter(bouncyBtn);
    });
  });
}
