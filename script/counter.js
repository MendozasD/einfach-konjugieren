import { getSavedCount } from "./state.js";

export function counter() {
  const count = getSavedCount();
  const floatingCounter = document.getElementById("floating_counter");
  if (floatingCounter) floatingCounter.textContent = count;

  // Enable/disable download buttons
  const pdfBtn = document.getElementById("pdf_btn");
  const wallpaperBtn = document.getElementById("wallpaper_btn");
  if (pdfBtn) pdfBtn.disabled = count === 0;
  if (wallpaperBtn) wallpaperBtn.disabled = count === 0;
}
