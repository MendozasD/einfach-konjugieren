import data from "/data/verbs_database.json";

export function conjugator(inputVerb) {
  const foundVerb = data.verbs.find((verb) => verb.infinitive === inputVerb);

  // Check if particletxt is defined
  let particletxt = "";

  if (foundVerb) {
    // Check if particletxt is defined to print it
    foundVerb.conjugations.particletxt == ""
      ? ""
      : (particletxt = foundVerb.conjugations.particletxt);

    let conjugatedBox = `<div id="conjugated_box" class="animate__animated animate__fadeInUp">
      <div id="infinitive"><h1>${foundVerb.infinitive}</h1></div>

      <div class="conjugated_row">
        <p class="pronoun_column">ich</p>
        <p class="conjugated_column">${foundVerb.conjugations.ich} <span class="particletxt_class">${particletxt}</span></p>
      </div>

      <div class="conjugated_row">
        <p class="pronoun_column">du</p>
        <p class="conjugated_column">${foundVerb.conjugations.du} <span class="particletxt_class">${particletxt}</span></p>
      </div>

      <div class="conjugated_row">
        <p class="pronoun_column">er/sie/es</p>
        <p class="conjugated_column">${foundVerb.conjugations.er} <span class="particletxt_class">${particletxt}</span></p>
      </div>

      <div class="conjugated_row">
        <p class="pronoun_column">wir</p>
        <p class="conjugated_column">${foundVerb.conjugations.wir} <span class="particletxt_class">${particletxt}</span></p>
      </div>

      <div class="conjugated_row">
        <p class="pronoun_column">ihr</p>
        <p class="conjugated_column">${foundVerb.conjugations.ihr} <span class="particletxt_class">${particletxt}</span></p>
      </div>

      <div class="conjugated_row">
        <p class="pronoun_column">Sie</p>
        <p class="conjugated_column">${foundVerb.conjugations.Sie} <span class="particletxt_class">${particletxt}</span></p>
      </div>

    </div>`;
    document.querySelector("#conjugator_result").innerHTML = conjugatedBox;
  } else {
    document.querySelector(
      "#conjugator_result"
    ).innerHTML = `<div id="conjugator_error" class="animate__animated animate__fadeInUp">Verb „${inputVerb}“ nicht gefunden.</div>`;
  }
}
