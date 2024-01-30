import Reverso from "reverso-api";
import fs from "fs";
const reverso = new Reverso();

export function getContext(verb) {
  reverso.getContext(verb, "german", "english").then((response) => {
    const data = {
      examples: response.examples.slice(0, 10).map((example) => example.source),
    };

    // Write data to JSON file
    fs.readFile("./data/examples.json", "utf8", (err, jsonString) => {
      if (err) {
        console.error(err);
        return;
      }

      const jsonData = JSON.parse(jsonString);
      jsonData.germanVerbs.infinitive = verb;
      jsonData.germanVerbs.examples = data.examples.map((example) =>
        example.toString()
      );

      fs.writeFile("./data/examples.json", JSON.stringify(jsonData), (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log("Data added to JSON file successfully!");
      });
    });
  });
}
