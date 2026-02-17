import { getSavedCount } from "./state.js";

export function counter() {
  const count = getSavedCount();
  const floatingCounter = document.getElementById("floating_counter");
  if (floatingCounter) {
    floatingCounter.textContent = count;
    floatingCounter.classList.toggle("has_items", count > 0);
  }

  const pdfBtn = document.getElementById("pdf_btn");
  const wallpaperBtn = document.getElementById("wallpaper_btn");
  const clearBtn = document.getElementById("clear_btn");
  if (pdfBtn) pdfBtn.disabled = count === 0;
  if (wallpaperBtn) wallpaperBtn.disabled = count === 0;
  if (clearBtn) clearBtn.disabled = count === 0;
}
