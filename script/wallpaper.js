import { getSavedVerbs } from "./state.js";
import { TENSE_LABELS, PERSON_ORDER, PERSON_LABELS } from "./api.js";

const WIDTH = 1080;
const HEIGHT = 1920;
const BG = "#0a0a0a";
const TEXT_COLOR = "#e8e8e8";
const SUBTLE_COLOR = "#888888";
const ORANGE = "#ff5c36";
const MAX_VERBS_PER_PAGE = 5;

function drawWallpaper(canvas, verbs, pageNum, totalPages) {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Title
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = "bold 52px Satoshi, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Meine Konjugationen", WIDTH / 2, 120);

  // Date
  ctx.fillStyle = SUBTLE_COLOR;
  ctx.font = "28px Satoshi, sans-serif";
  const today = new Date().toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  ctx.fillText(today, WIDTH / 2, 165);

  if (totalPages > 1) {
    ctx.fillText(`${pageNum} / ${totalPages}`, WIDTH / 2, 200);
  }

  let y = totalPages > 1 ? 260 : 230;
  ctx.textAlign = "left";

  for (const verb of verbs) {
    // Verb name
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = "bold 40px Satoshi, sans-serif";
    ctx.fillText(verb.infinitive, 80, y);

    // Tense badge
    const verbWidth = ctx.measureText(verb.infinitive).width;
    ctx.fillStyle = ORANGE;
    ctx.font = "24px Satoshi, sans-serif";
    ctx.fillText(TENSE_LABELS[verb.tense], 80 + verbWidth + 16, y);

    y += 20;

    // Conjugation rows
    ctx.font = "32px Satoshi, sans-serif";
    for (const p of PERSON_ORDER) {
      y += 44;
      ctx.fillStyle = SUBTLE_COLOR;
      ctx.textAlign = "right";
      ctx.fillText(PERSON_LABELS[p], WIDTH / 2 - 30, y);

      ctx.fillStyle = TEXT_COLOR;
      ctx.textAlign = "left";
      ctx.font = "bold 32px Satoshi, sans-serif";
      ctx.fillText(verb.conjugations[p], WIDTH / 2 + 30, y);
      ctx.font = "32px Satoshi, sans-serif";
    }

    y += 60;
  }

  // Footer
  ctx.fillStyle = SUBTLE_COLOR;
  ctx.font = "22px Satoshi, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("konjugieren.aydavid.uk", WIDTH / 2, HEIGHT - 60);
}

export async function generateWallpaper() {
  const saved = getSavedVerbs();
  if (saved.length === 0) return;

  // Wait for fonts
  await document.fonts.ready;

  const totalPages = Math.ceil(saved.length / MAX_VERBS_PER_PAGE);

  for (let page = 0; page < totalPages; page++) {
    const start = page * MAX_VERBS_PER_PAGE;
    const slice = saved.slice(start, start + MAX_VERBS_PER_PAGE);

    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    drawWallpaper(canvas, slice, page + 1, totalPages);

    const link = document.createElement("a");
    link.download =
      totalPages > 1
        ? `konjugationen-wallpaper-${page + 1}.png`
        : "konjugationen-wallpaper.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }
}
