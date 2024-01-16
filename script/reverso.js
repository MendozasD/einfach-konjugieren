import Reverso from "reverso-api";
const reverso = new Reverso();

export function getContext(verb) {
  reverso.getContext(verb, "german", "english").then((response) => {
    console.log(response);
  });
}
