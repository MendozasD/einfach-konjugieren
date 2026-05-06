# CSS Variable Refactor + Light Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor all hardcoded color values in style.scss to CSS variables, apply 6 polish fixes from the Alex Marin design review, then add a persisted light/dark mode toggle.

**Architecture:** CSS variables on `:root` (dark, default) with a `[data-theme="light"]` override block. An anti-flash script in `<head>` reads localStorage before first paint. A `script/theme.js` module handles the toggle button and persistence. No external dependencies.

**Tech Stack:** SCSS (compiled by Vite), vanilla JS ES modules, Docker (Caddy alpine serving built dist/), deploy via `docker compose build --no-cache && docker compose up -d` on Condor.

**Design authority:** Alex Marin creative review 2026-05-06. Palette values are his.

**Deploy command (run after each task that ships code):**
```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && docker compose build --no-cache && docker compose up -d"
```
**Verify command:**
```bash
curl -sI https://konjugieren.davidmendoza.ch | head -2
# Expected: HTTP/2 200
```

---

## File Map

| File | Change |
|------|--------|
| `style/style.scss` | Tasks 1–4: replace hardcoded values with vars; add `[data-theme="light"]` block; polish fixes |
| `index.html` | Task 5: add anti-flash `<script>` in `<head>` before any CSS |
| `script/main.js` | Task 5: add `#theme_toggle` button to HTML template; import `theme.js` |
| `script/theme.js` | Task 5: create — toggle logic, localStorage persistence |

No API changes. No new dependencies.

---

## Task 1: CSS Variable Definitions + Background/Surface Refactor

**Files:**
- Modify: `style/style.scss`

The `:root` block currently has 3 CSS variables (`--panchang`, `--orange`, `--red`, `--green`) and hardcoded `background-color: #242424` and `color: rgba(255,255,255,0.87)`. This task defines the full variable set and replaces the 6 background/surface values.

- [ ] **Step 1: Replace the entire `:root` block**

Find the existing `:root { ... }` block (lines 1–15) and replace it entirely with:

```scss
:root {
  /* Brand */
  --panchang: "Panchang", sans-serif;
  --orange: #ff5c36;
  --red: #ff2c55;
  --green: #89fc00;

  /* Surfaces */
  --bg-primary: #242424;
  --bg-surface: #333333;
  --bg-card-muted: rgba(255, 255, 255, 0.03);

  /* Text */
  --text-primary: rgba(255, 255, 255, 0.87);
  --text-strong: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.55);
  --text-muted: rgba(255, 255, 255, 0.45);
  --text-faint: rgba(255, 255, 255, 0.35);
  --text-placeholder: rgba(255, 255, 255, 0.30);

  /* Borders */
  --border-strong: #ffffff;
  --border-subtle: rgba(255, 255, 255, 0.30);
  --border-faint: rgba(255, 255, 255, 0.12);
  --border-input: rgba(255, 255, 255, 0.12);
  --border-loading: rgba(255, 255, 255, 0.15);
  --divider-color: rgba(255, 255, 255, 0.20);

  /* Glows */
  --glow-subtle: rgba(255, 255, 255, 0.15);

  font-family: "Satoshi", sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: var(--text-primary);
  background-color: var(--bg-primary);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 2: Replace 4 hardcoded background values**

Make these exact find-and-replace operations in `style/style.scss`:

| Find | Replace with |
|------|-------------|
| `background: #242424;` (in `#bounce_btn`) | `background: var(--bg-primary);` |
| `background: #242424;` (in `#floating_counter`) | `background: var(--bg-primary);` |
| `background: #333;` (in `#autocomplete_list`) | `background: var(--bg-surface);` |
| `background: #333;` (in `#idioms_search_wrap`) | `background: var(--bg-surface);` |

Verify there are no remaining hardcoded `#242424` or `#333` values:
```bash
grep -n '#242424\|#333[^3]' style/style.scss
# Expected: no output
```

- [ ] **Step 3: Build and verify dark mode is visually unchanged**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && docker compose build --no-cache && docker compose up -d"
curl -sI https://konjugieren.davidmendoza.ch | head -2
```
Expected: `HTTP/2 200`. Visually check the site — dark background, orange accents, cream tense cards must look identical to before.

- [ ] **Step 4: Commit**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && git add style/style.scss && git commit -m 'refactor: define CSS variable set, replace bg/surface hardcodes'"
```

---

## Task 2: Text + Border Variable Refactor

**Files:**
- Modify: `style/style.scss`

Replace every hardcoded `rgba(255,255,255,x)` text, border, and glow value with the semantic variables defined in Task 1. Each `rgba(255,255,255,x)` has a specific variable based on opacity — do not round or approximate.

- [ ] **Step 1: Replace text color values**

Make these find-and-replace operations (each string is unique — replace ALL occurrences):

| Find (exact) | Replace with |
|------|-------------|
| `color: rgba(255, 255, 255, 0.87);` | `color: var(--text-primary);` |
| `color: rgba(255, 255, 255, 0.55);` | `color: var(--text-secondary);` |
| `color: rgba(255, 255, 255, 0.45);` | `color: var(--text-muted);` |
| `color: rgba(255, 255, 255, 0.35);` (3 occurrences in `#made_by`) | `color: var(--text-faint);` |
| `color: rgba(255, 255, 255, 0.6);` (in `.delete_btn`) | `color: var(--text-secondary);` |
| `color: rgba(255, 255, 255, 0.5);` (in `.idioms_count_badge`) | `color: var(--text-muted);` |
| `color: white;` (5 occurrences: `#random_verb_btn`, `#verb_actions button`, `#bounce_btn`, `#bounce_btn:visited`, `#idioms_toggle`) | `color: var(--text-strong);` |
| `color: white` (in `#idioms_search`) | `color: var(--text-strong)` |

**Important:** Do NOT replace `color: white` inside `.card_save_btn:hover`, `.card_save_btn.saved`, `.card_save_btn.duplicate`, `#search_btn`, or `.tense_card_header h2` — those are intentional on colored backgrounds.

- [ ] **Step 2: Replace border values**

| Find (exact) | Replace with |
|------|-------------|
| `border: solid 1px white;` (in `#verb_header h1`) | `border: solid 1px var(--border-strong);` |
| `border: 1px solid rgba(255, 255, 255, 0.3);` (5 occurrences) | `border: 1px solid var(--border-subtle);` |
| `border: 1px solid rgba(255, 255, 255, 0.2);` (in `.delete_btn`) | `border: 1px solid var(--border-subtle);` |
| `border: 1px solid rgba(255, 255, 255, 0.12);` (in `.idiom_card`) | `border: 1px solid var(--border-faint);` |
| `border: 1px solid rgba(255, 255, 255, 0.1);` (in `#idioms_search_wrap`) | `border: 1px solid var(--border-faint);` |
| `border: 1px solid white;` (in `#floating_counter`) | `border: 1px solid var(--border-strong);` |
| `border: 4px solid rgba(255, 255, 255, 0.15);` (in `.loading_spinner`) | `border: 4px solid var(--border-loading);` |

- [ ] **Step 3: Replace background card values and glows**

| Find (exact) | Replace with |
|------|-------------|
| `background: rgba(255, 255, 255, 0.03);` (3 occurrences: `.enlisted_verb`, `.idiom_card`, `#intro_box`) | `background: var(--bg-card-muted);` |
| `background: rgba(255, 255, 255, 0.12);` (in `.idioms_count_badge`) | `background: var(--bg-card-muted);` |
| `box-shadow: 0 0 20px rgba(255, 255, 255, 0.15);` (in `.enlisted_verb:hover`) | `box-shadow: 0 0 20px var(--glow-subtle);` |

- [ ] **Step 4: Replace divider and placeholder**

| Find (exact) | Replace with |
|------|-------------|
| `rgba(255, 255, 255, 0.2) 20%,` (in `#section_divider::before` gradient) | `var(--divider-color) 20%,` |
| `rgba(255, 255, 255, 0.2) 80%,` (in `#section_divider::before` gradient) | `var(--divider-color) 80%,` |
| `color: rgba(255, 255, 255, 0.3);` (in `#idioms_search::placeholder`) | `color: var(--text-placeholder);` |

- [ ] **Step 5: Verify no orphaned hardcodes remain**

```bash
# Run on Condor — should return no rgba(255,255,255,...) except inside .tense_card (intentional black text)
ssh condor "grep -n 'rgba(255, 255, 255' /home/cuervo/projects/einfach-konjugieren/style/style.scss"
```
The only remaining `rgba(255,255,255,...)` should be inside `.card_save_btn` (white bg on cream card — intentional) and the `box-shadow` on `.tense_card:hover` which uses `rgba(187,187,209,0.1)` (that's a purple-toned white on cream — leave it).

- [ ] **Step 6: Build and verify**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && docker compose build --no-cache && docker compose up -d"
curl -sI https://konjugieren.davidmendoza.ch | head -2
```
Expected: `HTTP/2 200`. Visually: dark mode must look identical to before.

- [ ] **Step 7: Commit**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && git add style/style.scss && git commit -m 'refactor: replace all text/border/glow hardcodes with CSS variables'"
```

---

## Task 3: Polish Fixes (6 items from Alex Marin review)

**Files:**
- Modify: `style/style.scss`

These are targeted, independent fixes. Each one is a localized change.

- [ ] **Fix 1: Add visible border to `#verb_input`**

The current rule is `border: none;`. This is invisible in dark mode on some displays and will break completely in light mode.

Find in `style/style.scss`:
```scss
  #verb_input {
    border: none;
    height: 3rem;
    padding: 0 48px 0 14px;
    font-family: var(--panchang);
  }
```

Replace with:
```scss
  #verb_input {
    border: 1px solid var(--border-input);
    height: 3rem;
    padding: 0 48px 0 14px;
    font-family: var(--panchang);
    color: var(--text-strong);
    background: var(--bg-surface);
  }
```

- [ ] **Fix 2: Section divider visibility**

The gradient is now using `var(--divider-color)` from Task 2, but we also need to ensure the `#section_divider::before` rule is complete. Verify it reads:

```scss
  &::before {
    content: "";
    position: absolute;
    left: 10%;
    right: 10%;
    top: 50%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--divider-color) 20%,
      var(--divider-color) 80%,
      transparent
    );
  }
```

This was already done in Task 2 Step 4. Just verify `--divider-color` is in the gradient.

- [ ] **Fix 3: Footer — switch from Panchang to Satoshi, increase size**

Find:
```scss
  #made_by {
    position: fixed;
    bottom: 6px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 0.55rem;
    font-family: var(--panchang);
    color: var(--text-faint);
```

Replace `font-size: 0.55rem;` and `font-family: var(--panchang);` with:
```scss
    font-size: 0.7rem;
    font-family: "Satoshi", sans-serif;
```

- [ ] **Fix 4: Title header — add weight to "Einfach Konjugieren" h1**

Find the `#conjugator` section. After the existing `#input_field` block, locate where `.title` is handled (it's currently only in the global `*` selector as `text-align: center`). Add a scoped override inside `#conjugator`:

Find this comment block:
```scss
// ======================================================
// ================= CONJUGATOR SECTION =================
// ======================================================

#conjugator {
  min-height: 100vh;
  position: relative;
  padding-bottom: 2rem;
```

Add the following inside `#conjugator {` after `padding-bottom: 2rem;`:

```scss
  > .title {
    font-size: clamp(2.2rem, 7vw, 3.8rem);
    letter-spacing: -0.02em;
    margin-bottom: 1.5rem;
    text-decoration: underline;
    text-decoration-color: var(--orange);
    text-decoration-thickness: 3px;
    text-underline-offset: 8px;
  }
```

- [ ] **Fix 5: "Konjugierte Verben" + "Redewendungen" — reduce section heading scale**

These sections share the same `.title` class as the main h1 but should read as secondary. Add inside `#conjugated_list` and `#idioms_section`:

Find:
```scss
#conjugated_list {
  padding: 2rem 0 4rem;
}
```

Replace with:
```scss
#conjugated_list {
  padding: 2rem 0 4rem;

  .title {
    font-size: 1.3rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }
}
```

Find:
```scss
#idioms_section {
  padding: 2rem 0 4rem;
  max-width: 1200px;
  margin: 0 auto;

  .title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;

    @media (max-width: 480px) {
      font-size: 1.4rem;
    }
  }
}
```

Replace with:
```scss
#idioms_section {
  padding: 2rem 0 4rem;
  max-width: 1200px;
  margin: 0 auto;

  .title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
    font-size: 1.3rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-secondary);

    @media (max-width: 480px) {
      font-size: 1.1rem;
    }
  }
}
```

- [ ] **Fix 6: Intro box — increase icon presence**

Find:
```scss
  .intro_item {
    display: flex;
    align-items: center;
    gap: 12px;
    color: rgba(255, 255, 255, 0.55);
    font-size: 0.85rem;

    .material-symbols-outlined {
      font-size: 1.3rem;
      color: var(--orange);
      flex-shrink: 0;
    }
  }
```

Note: `rgba(255,255,255,0.55)` was replaced with `var(--text-secondary)` in Task 2. The actual find will be:
```scss
  .intro_item {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text-secondary);
    font-size: 0.85rem;

    .material-symbols-outlined {
      font-size: 1.3rem;
      color: var(--orange);
      flex-shrink: 0;
    }
  }
```

Replace `.material-symbols-outlined { font-size: 1.3rem; ...}` with:
```scss
    .material-symbols-outlined {
      font-size: 1.6rem;
      color: var(--orange);
      flex-shrink: 0;
      opacity: 0.9;
    }
```

And change the intro box border/background to be slightly more present:
Find:
```scss
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
```
These were replaced in Task 2 with vars. Verify they now read:
```scss
  border: 1px solid var(--border-faint);
  border-radius: 16px;
  background: var(--bg-card-muted);
```

- [ ] **Step 7: Build, deploy, and visual check**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && docker compose build --no-cache && docker compose up -d"
curl -sI https://konjugieren.davidmendoza.ch | head -2
```

Verify visually:
- Main title "Einfach Konjugieren" has orange underline decoration and is larger
- "Konjugierte Verben" and "Redewendungen" headings are smaller/uppercase/muted
- Footer is slightly larger and in Satoshi (not compressed Panchang)
- Verb input has a subtle border ring
- Input field background matches the autocomplete dropdown

- [ ] **Step 8: Commit**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && git add style/style.scss && git commit -m 'fix: 6 polish fixes per design review — border, section headings, footer, title'"
```

---

## Task 4: Light Mode CSS Override Block

**Files:**
- Modify: `style/style.scss`

Add the `[data-theme="light"]` block that overrides all color variables. The tense cards (`#c2c1bd` cream, `color: black`) stay identical — they already work on both backgrounds.

- [ ] **Step 1: Add light mode override block at the bottom of style.scss**

Append after the last rule in `style/style.scss`:

```scss
// ======================================================
// ================= LIGHT MODE OVERRIDES ===============
// ======================================================

[data-theme="light"] {
  --bg-primary: #f5f3ef;
  --bg-surface: #edeae4;
  --bg-card-muted: rgba(0, 0, 0, 0.04);
  --text-primary: rgba(0, 0, 0, 0.87);
  --text-strong: #111111;
  --text-secondary: rgba(0, 0, 0, 0.55);
  --text-muted: rgba(0, 0, 0, 0.45);
  --text-faint: rgba(0, 0, 0, 0.35);
  --text-placeholder: rgba(0, 0, 0, 0.30);
  --border-strong: rgba(0, 0, 0, 0.50);
  --border-subtle: rgba(0, 0, 0, 0.15);
  --border-faint: rgba(0, 0, 0, 0.10);
  --border-input: rgba(0, 0, 0, 0.15);
  --border-loading: rgba(0, 0, 0, 0.15);
  --divider-color: rgba(0, 0, 0, 0.12);
  --glow-subtle: rgba(0, 0, 0, 0.08);

  /* Autocomplete box shadow needs a light-mode version */
  #autocomplete_list {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  /* Saved verb cards: rgba(0,0,0,0.04) on #f5f3ef is too faint — use surface */
  .enlisted_verb {
    background: var(--bg-surface);
  }

  /* Idiom cards same */
  .idiom_card {
    background: var(--bg-surface);
  }
}
```

- [ ] **Step 2: Smoke-test light mode in browser**

Temporarily test by running this in the browser console at `https://konjugieren.davidmendoza.ch`:
```javascript
document.documentElement.setAttribute('data-theme', 'light')
```
Expected: page flips to warm off-white background. Check:
- Tense cards (cream) still look elevated and distinct ✓
- Text is readable (dark on light) ✓
- Orange accents still visible ✓
- Input field border visible ✓
- Autocomplete dropdown readable ✓

To reset: `document.documentElement.setAttribute('data-theme', 'dark')`

- [ ] **Step 3: Build, deploy, verify HTTP 200**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && docker compose build --no-cache && docker compose up -d"
curl -sI https://konjugieren.davidmendoza.ch | head -2
```

- [ ] **Step 4: Commit**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && git add style/style.scss && git commit -m 'feat: add light mode CSS override block [data-theme=light]'"
```

---

## Task 5: Theme Toggle Button, JS Logic, and Anti-Flash Script

**Files:**
- Create: `script/theme.js`
- Modify: `script/main.js` (add button to HTML template + import)
- Modify: `index.html` (add anti-flash script in `<head>`)
- Modify: `style/style.scss` (add `#theme_toggle` styles)

- [ ] **Step 1: Create `script/theme.js`**

Create `/home/cuervo/projects/einfach-konjugieren/script/theme.js` with this content:

```javascript
const STORAGE_KEY = "ek_theme";
const DEFAULT = "dark";

export function getStoredTheme() {
  try { return localStorage.getItem(STORAGE_KEY) || DEFAULT; } catch { return DEFAULT; }
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("theme_toggle");
  if (!btn) return;
  const icon = btn.querySelector(".material-symbols-outlined");
  if (icon) icon.textContent = theme === "light" ? "dark_mode" : "light_mode";
  btn.setAttribute("aria-label", theme === "light" ? "Dunkelmodus" : "Hellmodus");
}

export function initThemeToggle() {
  applyTheme(getStoredTheme());

  const btn = document.getElementById("theme_toggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || DEFAULT;
    const next = current === "light" ? "dark" : "light";
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
    applyTheme(next);
  });
}
```

- [ ] **Step 2: Add anti-flash script to `index.html`**

The current `index.html` `<head>` ends with `<title>Einfach Konjugieren!</title>`. Add the anti-flash script immediately after that tag, before `</head>`:

Find in `index.html`:
```html
    <title>Einfach Konjugieren!</title>
  </head>
```

Replace with:
```html
    <title>Einfach Konjugieren!</title>
    <script>
      (function(){try{var t=localStorage.getItem('ek_theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})();
    </script>
  </head>
```

This runs synchronously before the browser paints, preventing flash of wrong theme.

- [ ] **Step 3: Add toggle button to HTML template in `script/main.js`**

Find in `script/main.js` the `<footer id="made_by">` element in the HTML template string and add the toggle button just before it:

Find:
```javascript
    <footer id="made_by">
```

Replace with:
```javascript
    <button id="theme_toggle" aria-label="Hellmodus">
      <span class="material-symbols-outlined">light_mode</span>
    </button>

    <footer id="made_by">
```

- [ ] **Step 4: Import and init `theme.js` in `script/main.js`**

Find the existing import block at the top of `script/main.js` (lines 1–8). Add the import:

Find:
```javascript
import "animate.css";
import "/style/style.scss";
```

Replace with:
```javascript
import "animate.css";
import "/style/style.scss";
import { initThemeToggle } from "/script/theme.js";
```

Then find where `counter()` is called near the bottom of the initialization block:
```javascript
counter();
```

Add `initThemeToggle()` directly after it:
```javascript
counter();
initThemeToggle();
```

- [ ] **Step 5: Add `#theme_toggle` styles to `style/style.scss`**

Append inside the `// LIGHT MODE OVERRIDES` section (before the closing `}` of that section), and add the standalone rule for the button before that section:

Add before `// ======================================================\n// ================= LIGHT MODE OVERRIDES`:

```scss
// ======================================================
// ================= THEME TOGGLE =======================
// ======================================================

#theme_toggle {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  border: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--text-strong);
  cursor: pointer;
  transition: all 200ms ease;

  .material-symbols-outlined {
    font-size: 1.2rem;
  }

  &:hover {
    border-color: var(--orange);
    color: var(--orange);
    box-shadow: 0 0 12px rgba(255, 92, 54, 0.3);
  }

  &:active {
    transform: scale(0.9);
  }
}
```

- [ ] **Step 6: Build, deploy, and test toggle**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && docker compose build --no-cache && docker compose up -d"
curl -sI https://konjugieren.davidmendoza.ch | head -2
```

Test checklist in browser at `https://konjugieren.davidmendoza.ch`:
1. Toggle button visible top-right (sun icon in dark mode)
2. Click → page flips to light mode, icon changes to moon
3. Refresh page → stays in light mode (persistence working)
4. Click again → flips back to dark mode
5. Refresh → stays in dark mode
6. Open DevTools → check `document.documentElement` has `data-theme` attribute set correctly
7. No flash of wrong theme on page load in either mode

- [ ] **Step 7: Commit**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && git add script/theme.js script/main.js index.html style/style.scss && git commit -m 'feat: light/dark mode toggle with localStorage persistence and anti-flash'"
```

---

## Self-Review

**Spec coverage check:**
- ✅ CSS variable refactor — full extraction in Tasks 1+2
- ✅ No orphaned hardcodes (Task 2 Step 5 verifies this)
- ✅ Input visible border — Task 3 Fix 1
- ✅ Section divider — Task 2 + Task 3 Fix 2 verification
- ✅ Footer font — Task 3 Fix 3
- ✅ Title visual weight — Task 3 Fix 4
- ✅ Section heading scale — Task 3 Fix 5
- ✅ Intro box icon presence — Task 3 Fix 6
- ✅ Light mode palette (Alex's values) — Task 4
- ✅ Saved card bg fix in light mode — Task 4 Step 1
- ✅ Anti-flash script in `<head>` — Task 5 Step 2
- ✅ Toggle button fixed position top-right, icon-only — Task 5 Steps 3+5
- ✅ localStorage persistence, default dark — Task 5 Step 1
- ✅ Tense cards (cream) unchanged in both modes — preserved, no overrides

**Placeholder scan:** No TBDs, no "add appropriate" language, no missing code blocks.

**Type consistency:** `initThemeToggle`, `applyTheme`, `getStoredTheme`, `STORAGE_KEY` — all defined in `theme.js` and referenced consistently in `main.js`.

**Known skip (intentional):** `wallpaper.js` and `pdf.js` use hardcoded hex colors for Canvas/PDF rendering (not DOM styles) — these are correct and should NOT be variabilized.
