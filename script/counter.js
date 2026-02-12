import { getSavedCount } from "./state.js";

export function counter(bouncyCounter) {
  const count = getSavedCount();
  bouncyCounter.innerHTML = count;
  bouncyCounter.style.backgroundColor = "white";
  bouncyCounter.style.color = "black";

  // Enable/disable download buttons
  const pdfBtn = document.getElementById("pdf_btn");
  const wallpaperBtn = document.getElementById("wallpaper_btn");
  if (pdfBtn) pdfBtn.disabled = count === 0;
  if (wallpaperBtn) wallpaperBtn.disabled = count === 0;

  setTimeout(() => {
    bouncyCounter.style.backgroundColor = "transparent";
    bouncyCounter.style.color = "white";
  }, 1000);
}
