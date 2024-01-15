import data from "/data/verbs_database.json";

export function conjugator(inputVerb) {
  const foundVerb = data.verbs.find((verb) => verb.infinitive === inputVerb);
  if (foundVerb) {
    let conjugatedBox = `<div id="conjugated_box" class="animate__animated animate__fadeInUp">
      <div id="infinitive"><h1>${foundVerb.infinitive}</h1></div>

      <div class="conjugated_row">
        <p class="pronoun_column">ich</p>
        <p class="conjugated_column">${foundVerb.conjugations.ich}</p>
      </div>

      <div class="conjugated_row">
        <p class="pronoun_column">du</p>
        <p class="conjugated_column">${foundVerb.conjugations.du}</p>
      </div>

      <div class="conjugated_row">
        <p class="pronoun_column">er/sie/es</p>
        <p class="conjugated_column">${foundVerb.conjugations.er}</p>
      </div>

      <div class="conjugated_row">
        <p class="pronoun_column">wir</p>
        <p class="conjugated_column">${foundVerb.conjugations.wir}</p>
      </div>

      <div class="conjugated_row">
        <p class="pronoun_column">ihr</p>
        <p class="conjugated_column">${foundVerb.conjugations.ihr}</p>
      </div>

      <div class="conjugated_row">
        <p class="pronoun_column">Sie</p>
        <p class="conjugated_column">${foundVerb.conjugations.Sie}</p>
      </div>

      <p id="particletxt">${foundVerb.conjugations.particletxt}</p>
    </div>`;
    document.querySelector("#conjugator_result").innerHTML = conjugatedBox;
  } else {
    document.querySelector(
      "#conjugator_result"
    ).innerHTML = `<div id="conjugator_error">Verb „${inputVerb}“ nicht gefunden.</div>`;
  }
}
