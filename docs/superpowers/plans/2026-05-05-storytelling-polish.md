# Einfach Konjugieren — Storytelling Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the UX storytelling of Einfach Konjugieren across six targeted changes — removing visual noise, closing the save loop, improving the saved card craft, and fixing dead CSS.

**Architecture:** Vanilla JS + Vite + SCSS, deployed as a Docker container on Condor at `/home/cuervo/projects/einfach-konjugieren/`. All changes are to source files on Condor; each task ends with a Docker rebuild and Playwright smoke test via `https://konjugieren.davidmendoza.ch`. No test framework exists — verification is browser-based.

**Tech Stack:** Vanilla JS (ES modules), SCSS (compiled by Vite), Material Symbols, Panchang + Satoshi fonts, Docker + Caddy.

**Adversarial verdicts baked in:**
- Floating Redewendungen button → **remove entirely** (don't delay, don't keep)
- Neues Verb button → **remove**; verb pill becomes clickable (cursor + active state required per synthesis condition)
- Saved cards → **keep distinct, fix craft** (delete button, spacing, borders)

---

## Files Modified

| File | Tasks |
|------|-------|
| `script/main.js` | 1, 5, 6 — remove floating btn HTML, add save_toast element, update toggle copy |
| `script/conjugator.js` | 3, 5 — remove new_search_btn, make h1 clickable, add save toast trigger |
| `script/save_verb.js` | 4 — improve delete button markup |
| `style/style.scss` | 1, 2, 3, 4, 5, 6 — CSS for all changes |

---

## Task 1: Remove Floating Redewendungen Button

The floating `#floating_idioms_btn` is always visible from page load, adding noise before the user has context. Adversarial verdict: remove entirely. The section is reachable by scroll and the collapsed toggle is clearly labelled.

**Files:**
- Modify: `script/main.js` (remove HTML lines 47–51)
- Modify: `style/style.scss` (remove `#floating_idioms_btn` block)

- [ ] **Step 1: Remove the HTML element from main.js**

SSH to Condor and run:
```bash
ssh condor python3 << 'PYEOF'
with open('/home/cuervo/projects/einfach-konjugieren/script/main.js', 'r') as f:
    content = f.read()

old = '''    <a href="#idioms_section" id="floating_idioms_btn">
      <span class="material-symbols-outlined">auto_stories</span>
      <span class="floating_idioms_label">Redewendungen</span>
    </a>
'''
new = ''

if old in content:
    content = content.replace(old, new)
    with open('/home/cuervo/projects/einfach-konjugieren/script/main.js', 'w') as f:
        f.write(content)
    print('removed')
else:
    print('ERROR: pattern not found')
PYEOF
```

Expected: `removed`

- [ ] **Step 2: Remove the SCSS block**

The `#floating_idioms_btn` block in `style.scss` spans from `#floating_idioms_btn {` through its closing `}`. Remove the entire block including the comment above it:

```bash
ssh condor python3 << 'PYEOF'
with open('/home/cuervo/projects/einfach-konjugieren/style/style.scss', 'r') as f:
    content = f.read()

# Remove comment + full block
old = '''// ======================================================
// ================= FLOATING IDIOMS BUTTON =============
// ======================================================

#floating_idioms_btn {
  position: fixed;
  bottom: 24px;
  right: 80px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 25px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: #242424;
  color: white;
  font-family: var(--panchang);
  font-size: 0.65rem;
  text-decoration: none;
  transition: all 300ms ease;

  &:visited {
    color: white;
  }

  .material-symbols-outlined {
    font-size: 1.1rem;
  }

  &:hover {
    border-color: var(--orange);
    box-shadow: 0 0 15px rgba(255, 92, 54, 0.3);
  }

  @media (max-width: 480px) {
    right: 72px;
    padding: 10px 12px;
    border-radius: 50%;

    .floating_idioms_label {
      display: none;
    }
  }
}'''
new = ''

if old in content:
    content = content.replace(old, new)
    with open('/home/cuervo/projects/einfach-konjugieren/style/style.scss', 'w') as f:
        f.write(content)
    print('removed')
else:
    print('ERROR: pattern not found')
PYEOF
```

Expected: `removed`

- [ ] **Step 3: Rebuild and smoke test**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && docker compose build --no-cache 2>&1 | tail -3 && docker compose up -d"
```

Then navigate Playwright to `https://konjugieren.davidmendoza.ch` and take a snapshot. Verify: no floating Redewendungen button visible. The floating verb counter (bottom-right) should be the only fixed element.

---

## Task 2: Fix Saved List min-height

`#conjugated_list` has `min-height: 100vh`, creating a vast dark void when only one verb is saved. Replace with content-driven padding.

**Files:**
- Modify: `style/style.scss`

- [ ] **Step 1: Replace min-height in SCSS**

```bash
ssh condor python3 << 'PYEOF'
with open('/home/cuervo/projects/einfach-konjugieren/style/style.scss', 'r') as f:
    content = f.read()

old = '''#conjugated_list {
  min-height: 100vh;
  padding-top: 2rem;
}'''
new = '''#conjugated_list {
  padding: 2rem 0 4rem;
}'''

if old in content:
    content = content.replace(old, new)
    with open('/home/cuervo/projects/einfach-konjugieren/style/style.scss', 'w') as f:
        f.write(content)
    print('updated')
else:
    print('ERROR: pattern not found')
PYEOF
```

Expected: `updated`

- [ ] **Step 2: Rebuild and smoke test**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && docker compose build --no-cache 2>&1 | tail -3 && docker compose up -d"
```

Navigate to site, conjugate "lernen", save the Präsens card, scroll down. Verify: the saved verbs section and the Redewendungen section appear close together — no 100vh empty gap between them.

---

## Task 3: Make Verb Pill Clickable, Remove Neues Verb Button

Adversarial verdict: the verb pill already has a hover affordance (underline → orange) but does nothing — fix the broken promise by making it call `showInput()`. Remove the now-redundant "Neues Verb" button. Per synthesis condition: pill must have `cursor: pointer` + a visible `active` state, not just hover underline.

**Files:**
- Modify: `script/conjugator.js`
- Modify: `style/style.scss`

- [ ] **Step 1: Update renderAllTenses() — remove new_search_btn, add h1 click**

```bash
ssh condor python3 << 'PYEOF'
with open('/home/cuervo/projects/einfach-konjugieren/script/conjugator.js', 'r') as f:
    content = f.read()

old = '''  const actions = document.createElement("div");
  actions.id = "verb_actions";
  actions.innerHTML = `
    <button id="new_search_btn" class="pan_font">
      <span class="material-symbols-outlined">search</span>
      Neues Verb
    </button>
    <button id="share_btn" class="pan_font">
      <span class="material-symbols-outlined">share</span>
      Teilen
    </button>`;
  verbHeader.appendChild(actions);
  fragment.appendChild(verbHeader);'''

new = '''  h1.classList.add("verb_pill_clickable");
  h1.title = "Neue Suche";
  h1.addEventListener("click", showInput);

  const actions = document.createElement("div");
  actions.id = "verb_actions";
  actions.innerHTML = `
    <button id="share_btn" class="pan_font">
      <span class="material-symbols-outlined">share</span>
      Teilen
    </button>`;
  verbHeader.appendChild(actions);
  fragment.appendChild(verbHeader);'''

if old in content:
    content = content.replace(old, new)
    with open('/home/cuervo/projects/einfach-konjugieren/script/conjugator.js', 'w') as f:
        f.write(content)
    print('renderAllTenses updated')
else:
    print('ERROR: pattern not found in renderAllTenses')
PYEOF
```

Expected: `renderAllTenses updated`

- [ ] **Step 2: Remove new_search_btn event listener from conjugator()**

```bash
ssh condor python3 << 'PYEOF'
with open('/home/cuervo/projects/einfach-konjugieren/script/conjugator.js', 'r') as f:
    content = f.read()

old = '    document.getElementById("new_search_btn").addEventListener("click", showInput);\n\n'
new = ''

if old in content:
    content = content.replace(old, new)
    with open('/home/cuervo/projects/einfach-konjugieren/script/conjugator.js', 'w') as f:
        f.write(content)
    print('listener removed')
else:
    print('ERROR: pattern not found')
PYEOF
```

Expected: `listener removed`

- [ ] **Step 3: Add pill interactive styles to SCSS**

```bash
ssh condor python3 << 'PYEOF'
with open('/home/cuervo/projects/einfach-konjugieren/style/style.scss', 'r') as f:
    content = f.read()

old = '''#verb_header {
  text-align: center;
  margin: 2rem 0 1.5rem;

  h1 {
    display: inline-block;
    padding: 8px 28px;
    border: solid 1px white;
    border-radius: 50px;
    text-decoration: underline solid gray 4px;
    transition: ease 200ms all;
    font-size: clamp(1.5rem, 5vw, 2.5rem);
    &:hover {
      text-decoration-color: var(--orange);
    }
  }
}'''

new = '''#verb_header {
  text-align: center;
  margin: 2rem 0 1.5rem;

  h1 {
    display: inline-block;
    padding: 8px 28px;
    border: solid 1px white;
    border-radius: 50px;
    text-decoration: underline solid gray 4px;
    transition: ease 200ms all;
    font-size: clamp(1.5rem, 5vw, 2.5rem);
    &:hover {
      text-decoration-color: var(--orange);
    }
    &.verb_pill_clickable {
      cursor: pointer;
      &:active {
        transform: scale(0.96);
        border-color: var(--orange);
      }
    }
  }
}'''

if old in content:
    content = content.replace(old, new)
    with open('/home/cuervo/projects/einfach-konjugieren/style/style.scss', 'w') as f:
        f.write(content)
    print('updated')
else:
    print('ERROR: pattern not found')
PYEOF
```

Expected: `updated`

- [ ] **Step 4: Rebuild and smoke test**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && docker compose build --no-cache 2>&1 | tail -3 && docker compose up -d"
```

Navigate to site, conjugate a verb. Verify:
- "Neues Verb" button is gone — only "Teilen" remains below the verb name
- Hovering the verb pill shows orange underline + pointer cursor
- Clicking the verb pill returns to the search input (input visible, result cleared)
- Clicking the verb pill on mobile (tap) triggers new search correctly

---

## Task 4: Saved Card Craft Improvements

Adversarial verdict: keep saved cards visually distinct from result cards, but fix the craft. Current problems: delete button is a tiny icon (hard to find), no label, positioned bottom-left. Fix: full pill button with label, centered, red on hover — matching the button grammar of the rest of the app.

**Files:**
- Modify: `script/save_verb.js`
- Modify: `style/style.scss`

- [ ] **Step 1: Change delete button from span to labeled button in save_verb.js**

```bash
ssh condor python3 << 'PYEOF'
with open('/home/cuervo/projects/einfach-konjugieren/script/save_verb.js', 'r') as f:
    content = f.read()

old = '''  // Delete button
  const deleteBtn = document.createElement("span");
  deleteBtn.className = "material-symbols-outlined delete_btn";
  deleteBtn.textContent = "delete";'''

new = '''  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete_btn pan_font";
  deleteBtn.innerHTML = \'<span class="material-symbols-outlined">delete</span> Entfernen\';'''

if old in content:
    content = content.replace(old, new)
    with open('/home/cuervo/projects/einfach-konjugieren/script/save_verb.js', 'w') as f:
        f.write(content)
    print('updated')
else:
    print('ERROR: pattern not found')
PYEOF
```

Expected: `updated`

- [ ] **Step 2: Replace delete_btn SCSS**

```bash
ssh condor python3 << 'PYEOF'
with open('/home/cuervo/projects/einfach-konjugieren/style/style.scss', 'r') as f:
    content = f.read()

old = '''    .delete_btn {
      cursor: pointer;
      position: absolute;
      border: solid 1px rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      padding: 5px;
      bottom: 10px;
      left: 10px;
      transition: ease 400ms all;
      &:hover {
        background-color: white;
        color: black;
      }
    }'''

new = '''    .delete_btn {
      cursor: pointer;
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      padding: 5px 16px;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: transparent;
      color: rgba(255, 255, 255, 0.6);
      white-space: nowrap;
      transition: all 200ms ease;

      .material-symbols-outlined {
        font-size: 1rem;
      }

      &:hover {
        border-color: var(--red);
        color: white;
        background: var(--red);
      }
    }'''

if old in content:
    content = content.replace(old, new)
    with open('/home/cuervo/projects/einfach-konjugieren/style/style.scss', 'w') as f:
        f.write(content)
    print('updated')
else:
    print('ERROR: pattern not found')
PYEOF
```

Expected: `updated`

- [ ] **Step 3: Rebuild and smoke test**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && docker compose build --no-cache 2>&1 | tail -3 && docker compose up -d"
```

Conjugate a verb, save a tense, scroll to the saved list. Verify:
- Delete button shows "🗑 Entfernen" text label, centered at card bottom
- Hovering turns it red with red border
- Clicking removes the card with fadeOutDown animation

---

## Task 5: Post-Save Micro-Feedback Toast

After saving a tense, the UI flips the button to "Gespeichert" but doesn't close the loop — the user has no clear signal to check their collection. Add a toast that briefly appears: "Gespeichert — N Karte(n) in deiner Liste".

**Files:**
- Modify: `script/main.js` (add toast element to HTML template)
- Modify: `script/conjugator.js` (import getSavedCount, add showSaveToast, call after save)
- Modify: `style/style.scss` (add #save_toast styles)

- [ ] **Step 1: Add #save_toast element to main.js template**

```bash
ssh condor python3 << 'PYEOF'
with open('/home/cuervo/projects/einfach-konjugieren/script/main.js', 'r') as f:
    content = f.read()

# Insert save_toast div before the closing </div> of #container
old = '''    <footer id="made_by">'''
new = '''    <div id="save_toast"></div>
    <footer id="made_by">'''

if old in content:
    content = content.replace(old, new, 1)
    with open('/home/cuervo/projects/einfach-konjugieren/script/main.js', 'w') as f:
        f.write(content)
    print('save_toast added')
else:
    print('ERROR: pattern not found')
PYEOF
```

Expected: `save_toast added`

- [ ] **Step 2: Add getSavedCount import to conjugator.js**

```bash
ssh condor python3 << 'PYEOF'
with open('/home/cuervo/projects/einfach-konjugieren/script/conjugator.js', 'r') as f:
    content = f.read()

old = '''import {
  setCurrentVerb,
  setCurrentTense,
  setCurrentData,
  addSavedVerb,
  isSaved,
} from "/script/state.js";'''

new = '''import {
  setCurrentVerb,
  setCurrentTense,
  setCurrentData,
  addSavedVerb,
  isSaved,
  getSavedCount,
} from "/script/state.js";'''

if old in content:
    content = content.replace(old, new)
    with open('/home/cuervo/projects/einfach-konjugieren/script/conjugator.js', 'w') as f:
        f.write(content)
    print('import updated')
else:
    print('ERROR: pattern not found')
PYEOF
```

Expected: `import updated`

- [ ] **Step 3: Add showSaveToast helper and call it on save in conjugator.js**

```bash
ssh condor python3 << 'PYEOF'
with open('/home/cuervo/projects/einfach-konjugieren/script/conjugator.js', 'r') as f:
    content = f.read()

# Add helper function before attachSaveHandlers
old = 'function attachSaveHandlers(verb, indicative) {'
new = '''function showSaveToast() {
  const count = getSavedCount();
  const toast = document.getElementById("save_toast");
  if (!toast) return;
  const label = count === 1 ? "Karte" : "Karten";
  toast.textContent = `Gespeichert — ${count} ${label} in deiner Liste`;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 2500);
}

function attachSaveHandlers(verb, indicative) {'''

if old in content:
    content = content.replace(old, new, 1)
    with open('/home/cuervo/projects/einfach-konjugieren/script/conjugator.js', 'w') as f:
        f.write(content)
    print('showSaveToast added')
else:
    print('ERROR: pattern not found')
PYEOF
```

Expected: `showSaveToast added`

- [ ] **Step 4: Call showSaveToast after a successful save**

```bash
ssh condor python3 << 'PYEOF'
with open('/home/cuervo/projects/einfach-konjugieren/script/conjugator.js', 'r') as f:
    content = f.read()

old = '''      if (added) {
        saveVerb(verb, tense, conjugations);
        counter();
        btn.classList.add("saved");
        btn.innerHTML = \'<span class="material-symbols-outlined">check</span> Gespeichert\';'''

new = '''      if (added) {
        saveVerb(verb, tense, conjugations);
        counter();
        showSaveToast();
        btn.classList.add("saved");
        btn.innerHTML = \'<span class="material-symbols-outlined">check</span> Gespeichert\';'''

if old in content:
    content = content.replace(old, new)
    with open('/home/cuervo/projects/einfach-konjugieren/script/conjugator.js', 'w') as f:
        f.write(content)
    print('showSaveToast call added')
else:
    print('ERROR: pattern not found')
PYEOF
```

Expected: `showSaveToast call added`

- [ ] **Step 5: Add #save_toast styles to SCSS**

```bash
ssh condor python3 << 'PYEOF'
with open('/home/cuervo/projects/einfach-konjugieren/style/style.scss', 'r') as f:
    content = f.read()

# Insert before the REDEWENDUNGEN section comment
old = '// ======================================================\n// ================= REDEWENDUNGEN SECTION =============='
new = '''// ======================================================
// ================= SAVE TOAST =========================
// ======================================================

#save_toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: var(--green);
  color: black;
  font-family: var(--panchang);
  font-size: 0.75rem;
  padding: 6px 20px;
  border-radius: 20px;
  opacity: 0;
  pointer-events: none;
  transition: all 300ms ease;
  z-index: 200;
  white-space: nowrap;

  &.visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

// ======================================================
// ================= REDEWENDUNGEN SECTION =============='''

if old in content:
    content = content.replace(old, new, 1)
    with open('/home/cuervo/projects/einfach-konjugieren/style/style.scss', 'w') as f:
        f.write(content)
    print('save_toast styles added')
else:
    print('ERROR: pattern not found')
PYEOF
```

Expected: `save_toast styles added`

- [ ] **Step 6: Rebuild and smoke test**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && docker compose build --no-cache 2>&1 | tail -3 && docker compose up -d"
```

Conjugate a verb, click "Speichern" on a tense card. Verify: green toast appears at bottom center reading "Gespeichert — 1 Karte in deiner Liste", disappears after ~2.5 seconds. Save a second card: toast reads "Gespeichert — 2 Karten in deiner Liste".

---

## Task 6: Copy Update + Dead CSS Fix

Two housekeeping changes: (1) update the Redewendungen toggle button copy to have more momentum, (2) fix a dead SCSS selector in `#idioms_section` found during code review.

**Files:**
- Modify: `script/main.js`
- Modify: `style/style.scss`

- [ ] **Step 1: Update toggle button copy in main.js**

```bash
ssh condor python3 << 'PYEOF'
with open('/home/cuervo/projects/einfach-konjugieren/script/main.js', 'r') as f:
    content = f.read()

old = '        <span>Alle Redewendungen durchstöbern</span>'
new = '        <span>Redewendungen entdecken</span>'

if old in content:
    content = content.replace(old, new)
    with open('/home/cuervo/projects/einfach-konjugieren/script/main.js', 'w') as f:
        f.write(content)
    print('copy updated')
else:
    print('ERROR: pattern not found')
PYEOF
```

Expected: `copy updated`

- [ ] **Step 2: Fix dead CSS selector in #idioms_section**

The current rule `.title { @media { h1 { font-size } } }` never fires because `.title` IS the `h1`, not a parent of one.

```bash
ssh condor python3 << 'PYEOF'
with open('/home/cuervo/projects/einfach-konjugieren/style/style.scss', 'r') as f:
    content = f.read()

old = '''#idioms_section {
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
      h1 { font-size: 1.4rem; }
    }
  }
}'''

new = '''#idioms_section {
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
}'''

if old in content:
    content = content.replace(old, new)
    with open('/home/cuervo/projects/einfach-konjugieren/style/style.scss', 'w') as f:
        f.write(content)
    print('dead CSS fixed')
else:
    print('ERROR: pattern not found')
PYEOF
```

Expected: `dead CSS fixed`

- [ ] **Step 3: Final rebuild and full smoke test**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && docker compose build --no-cache 2>&1 | tail -3 && docker compose up -d"
```

Full golden path test:
1. Navigate to `https://konjugieren.davidmendoza.ch` — no floating Redewendungen button visible
2. Conjugate "lernen" — verb pill shows, only "Teilen" button below it
3. Hover verb pill — orange underline + pointer cursor; click it — returns to search
4. Conjugate again, save Präsens — green "Gespeichert — 1 Karte" toast appears
5. Scroll down — saved verbs section appears without excessive whitespace
6. Saved card shows "Entfernen" button centered at bottom; hover turns red
7. Click delete — card removes with animation
8. Continue scrolling — Redewendungen section shows "Redewendungen entdecken" toggle
9. Click toggle — grid expands, search appears
10. On mobile viewport (480px): idioms section title resizes correctly

---

## Self-Review

**Spec coverage:**
- ✅ Remove floating Redewendungen button — Task 1
- ✅ Fix saved list min-height — Task 2
- ✅ Make verb pill clickable, remove Neues Verb — Task 3
- ✅ Saved card craft improvements (delete btn, spacing) — Task 4
- ✅ Post-save micro-feedback toast — Task 5
- ✅ Toggle copy update + dead CSS fix — Task 6
- ✅ Adversarial synthesis conditions met: pill has cursor+active state (Task 3), saved card kept distinct (Task 4)

**Placeholder scan:** No TBD, TODO, or vague steps. All code blocks are complete and exact.

**Type consistency:** No shared types across tasks. All DOM element IDs referenced match template in main.js. `getSavedCount` imported from state.js (confirmed exported at line 68).
