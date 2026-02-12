import { getSavedCount } from "./state.js";

export function counter(bouncyCounter) {
  const count = getSavedCount();
  const countEl = document.getElementById("bounce_count");
  if (countEl) countEl.textContent = count;

  // Enable/disable download buttons
  const pdfBtn = document.getElementById("pdf_btn");
  const wallpaperBtn = document.getElementById("wallpaper_btn");
  if (pdfBtn) pdfBtn.disabled = count === 0;
  if (wallpaperBtn) wallpaperBtn.disabled = count === 0;
}
