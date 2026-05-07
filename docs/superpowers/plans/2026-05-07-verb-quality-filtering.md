# Verb Quality Filtering + Random Pool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 7 confirmed bugs (2 pre-existing, 5 in the proposed design) and build a frequency-filtered random verb pool so the random picker shows only ~2000 learner-appropriate verbs instead of all 9846 including archaic variants and hyper-rare vocabulary.

**Architecture:** Three-layer fix: (1) `build_verb_db.py` corrections produce cleaner `verbs.json` with `variant_only` flags on 819 archaic spelling entries; (2) new `build_common_verbs.py` generates `common_verbs.json` by intersecting `verbsDB` with a German word frequency corpus (top ~2000 matches); (3) new `/random-pool` API endpoint returns only common verbs — random picker draws from this separate SPA cache, leaving the full verb list for autocomplete untouched.

**Tech Stack:** Python 3 (build scripts on Condor), Node.js/Express (german-verbs-api), Vite/vanilla JS (einfach-konjugieren SPA), Docker Compose (Condor deployment)

**Key paths:**
- Build script: `condor:/home/cuervo/projects/einfach-konjugieren/data/build_verb_db.py`
- kaikki JSONL: `condor:/home/cuervo/projects/einfach-konjugieren/data/kaikki-german.jsonl` (938 MB)
- verbs.json: `condor:/home/cuervo/projects/german-verbs-api/data/verbs.json`
- API verbFinder: `condor:/home/cuervo/projects/german-verbs-api/verbFinding/verbFinder.js`
- API controller: `condor:/home/cuervo/projects/german-verbs-api/controllers/verbs.js`
- API routes: `condor:/home/cuervo/projects/german-verbs-api/routes/verbs.js`
- SPA api.js: `condor:/home/cuervo/projects/einfach-konjugieren/script/api.js`
- SPA conjugator: `condor:/home/cuervo/projects/einfach-konjugieren/script/conjugator.js`
- SPA main.js: `condor:/home/cuervo/projects/einfach-konjugieren/script/main.js`

---

## Task 1: Fix `build_verb_db.py` — translation filter bugs (Bugs 1 + 2)

**Files:**
- Modify: `condor:/home/cuervo/projects/einfach-konjugieren/data/build_verb_db.py`

- [ ] **Step 1: Replace `extract_translations()` with corrected version**

Use Python's `open(f,'r+')` pattern (never `sed -i` on Condor — breaks Docker bind mounts with new inode).

```bash
ssh condor "python3 << 'EOF'
import re

path = '/home/cuervo/projects/einfach-konjugieren/data/build_verb_db.py'
with open(path, 'r') as f:
    src = f.read()

old = '''def extract_translations(entry, max_glosses=3):
    """Extract up to max_glosses English glosses, skipping inflections and auxiliary senses."""
    results = []
    for sense in entry.get(\"senses\", []):
        tags = set(sense.get(\"tags\", []))
        if \"auxiliary\" in tags:
            continue
        if \"form-of\" in tags:
            continue
        glosses = sense.get(\"glosses\", [])
        if not glosses:
            continue
        g = glosses[0].strip()
        if not g:
            continue
        if g.startswith((\"inflection of\", \"Alternative\", \"Obsolete\", \"misspelling\")):
            continue
        results.append(g)
        if len(results) >= max_glosses:
            break
    return results'''

new = '''def extract_translations(entry, max_glosses=3):
    \"\"\"Extract up to max_glosses English glosses, skipping inflections and auxiliary senses.\"\"\"
    results = []
    for sense in entry.get(\"senses\", []):
        tags = set(sense.get(\"tags\", []))
        if tags & {\"auxiliary\", \"form-of\", \"alt-of\", \"obsolete\", \"archaic\"}:
            continue
        glosses = sense.get(\"glosses\", [])
        if not glosses:
            continue
        g = glosses[0].strip()
        if not g:
            continue
        if g.lower().startswith((\"inflection of\", \"alternative\", \"obsolete\", \"misspelling\", \"archaic\")):
            continue
        results.append(g)
        if len(results) >= max_glosses:
            break
    return results'''

assert old in src, 'extract_translations block not found — check for whitespace changes'
src = src.replace(old, new)
with open(path, 'r+') as f:
    f.seek(0)
    f.write(src)
    f.truncate()
print('extract_translations patched OK')
EOF
"
```

- [ ] **Step 2: Replace `extract_best_gloss()` with corrected version**

```bash
ssh condor "python3 << 'EOF'
path = '/home/cuervo/projects/einfach-konjugieren/data/build_verb_db.py'
with open(path, 'r') as f:
    src = f.read()

old = '''def extract_best_gloss(entry):
    \"\"\"Extract the first useful English gloss from a kaikki entry.\"\"\"
    for sense in entry.get(\"senses\", []):
        glosses = sense.get(\"glosses\", [])
        for g in glosses:
            if g and not g.startswith(\"Alternative\") and not g.startswith(\"Obsolete\"):
                return g
    return None'''

new = '''def extract_best_gloss(entry):
    \"\"\"Extract the first useful English gloss from a kaikki entry.\"\"\"
    for sense in entry.get(\"senses\", []):
        tags = set(sense.get(\"tags\", []))
        if tags & {\"alt-of\", \"obsolete\", \"archaic\"}:
            continue
        glosses = sense.get(\"glosses\", [])
        for g in glosses:
            if g and not g.lower().startswith((\"alternative\", \"obsolete\", \"archaic\", \"inflection of\", \"misspelling\")):
                return g
    return None'''

assert old in src, 'extract_best_gloss block not found'
src = src.replace(old, new)
with open(path, 'r+') as f:
    f.seek(0)
    f.write(src)
    f.truncate()
print('extract_best_gloss patched OK')
EOF
"
```

- [ ] **Step 3: Verify both functions exist in the patched file**

```bash
ssh condor "grep -n 'g.lower().startswith' /home/cuervo/projects/einfach-konjugieren/data/build_verb_db.py"
```
Expected: 2 matches (one in each function).

---

## Task 2: Fix `build_verb_db.py` — `variant_only` detection and merge logic (Bugs 5 + 6)

**Files:**
- Modify: `condor:/home/cuervo/projects/einfach-konjugieren/data/build_verb_db.py`

- [ ] **Step 1: Add `variant_only` flag to `process_verb()` return value**

Insert after the line `result = {"auxiliary": auxiliary, "tenses": tenses}` and before `if " " not in word:`.

```bash
ssh condor "python3 << 'EOF'
path = '/home/cuervo/projects/einfach-konjugieren/data/build_verb_db.py'
with open(path, 'r') as f:
    src = f.read()

old = '    result = {\"auxiliary\": auxiliary, \"tenses\": tenses}\n    # Only include verbs that have at least Präsens\n'

# Try alternate ordering (result is set after the Präsens check in process_verb)
# Find the actual location
old = '    result = {\"auxiliary\": auxiliary, \"tenses\": tenses}\n    # Only extract translations for single-word verbs'

new = '''    result = {\"auxiliary\": auxiliary, \"tenses\": tenses}
    # Flag archaic spelling variants (all senses are alt-of entries, not real verbs)
    # Use alt-of tag only — not archaic, which would incorrectly flag real verbs like klimmen
    usable_senses = [s for s in entry.get(\"senses\", []) if s.get(\"glosses\")]
    if usable_senses and all(\"alt-of\" in set(s.get(\"tags\", [])) for s in usable_senses):
        result[\"variant_only\"] = True
    # Only extract translations for single-word verbs'''

assert old in src, 'result assignment anchor not found — check surrounding context'
src = src.replace(old, new)
with open(path, 'r+') as f:
    f.seek(0)
    f.write(src)
    f.truncate()
print('variant_only flag added OK')
EOF
"
```

- [ ] **Step 2: Fix merge logic in `main()` to prefer non-variant over variant**

Replace the existing merge block:

```bash
ssh condor "python3 << 'EOF'
path = '/home/cuervo/projects/einfach-konjugieren/data/build_verb_db.py'
with open(path, 'r') as f:
    src = f.read()

old = '''            # If verb already exists (multiple senses), merge/keep the one with more tenses
            if word in verbs:
                existing_tense_count = sum(len(v) for v in verbs[word][\"tenses\"].values())
                new_tense_count = sum(len(v) for v in result[\"tenses\"].values())
                if new_tense_count <= existing_tense_count:
                    continue'''

new = '''            # If verb already exists (multiple senses), merge/keep the best entry.
            # Non-variant always displaces variant regardless of tense count (Bug 5 fix).
            if word in verbs:
                existing = verbs[word]
                if existing.get(\"variant_only\") and not result.get(\"variant_only\"):
                    pass  # new non-variant entry wins unconditionally
                elif result.get(\"variant_only\") and not existing.get(\"variant_only\"):
                    continue  # keep existing non-variant
                else:
                    existing_tense_count = sum(len(v) for v in existing[\"tenses\"].values())
                    new_tense_count = sum(len(v) for v in result[\"tenses\"].values())
                    if new_tense_count <= existing_tense_count:
                        continue'''

assert old in src, 'merge block not found'
src = src.replace(old, new)
with open(path, 'r+') as f:
    f.seek(0)
    f.write(src)
    f.truncate()
print('merge logic patched OK')
EOF
"
```

- [ ] **Step 3: Verify patches**

```bash
ssh condor "grep -n 'variant_only' /home/cuervo/projects/einfach-konjugieren/data/build_verb_db.py"
```
Expected: 4–5 matches (flag set in process_verb, checked in merge block, two branches in merge logic).

- [ ] **Step 4: Commit Task 1 + 2 changes to Gitea**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && git add data/build_verb_db.py && git commit -m 'fix: case-insensitive translation filter, variant_only flag, merge logic'"
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && git push gitea main"
```

---

## Task 3: Download German word frequency list

**Files:**
- Create: `condor:/home/cuervo/projects/einfach-konjugieren/data/de_frequency.txt`

- [ ] **Step 1: Download the frequency list**

The hermitdave/FrequencyWords repo on GitHub provides an OpenSubtitles-derived German frequency list. Download the raw file:

```bash
ssh condor "wget -O /home/cuervo/projects/einfach-konjugieren/data/de_frequency.txt 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2016/de/de_50k.txt'"
```

If that URL is unreachable, alternative: download from Leipzig Corpora (https://wortschatz.uni-leipzig.de/en/download/German) — get the 10K or 100K word list, extract the words file, save to the same path. Any format with `word frequency` (space-separated) per line works.

- [ ] **Step 2: Verify the file**

```bash
ssh condor "wc -l /home/cuervo/projects/einfach-konjugieren/data/de_frequency.txt && head -10 /home/cuervo/projects/einfach-konjugieren/data/de_frequency.txt"
```

Expected: ≥10,000 lines. Format should be `word frequency` (e.g., `sein 1234567`). Common verbs like `sein`, `haben`, `gehen`, `machen` should appear in the first 200 lines.

---

## Task 4: Create `build_common_verbs.py`

**Files:**
- Create: `condor:/home/cuervo/projects/einfach-konjugieren/data/build_common_verbs.py`

- [ ] **Step 1: Write the script**

```bash
ssh condor "cat > /home/cuervo/projects/einfach-konjugieren/data/build_common_verbs.py << 'PYEOF'
#!/usr/bin/env python3
\"\"\"
Generate common_verbs.json: top ~2000 German verb infinitives for the random picker.
Intersects verbs.json with a word frequency list, skipping variant_only entries.
Logs verbs absent from the frequency list to <output>_dropped.txt for manual review.

Usage: python3 build_common_verbs.py <verbs.json> <frequency_file> [output.json] [max_verbs]
\"\"\"
import json, sys, os

def main():
    if len(sys.argv) < 3:
        print('Usage: python3 build_common_verbs.py <verbs.json> <frequency_file> [output.json] [max_verbs]')
        sys.exit(1)

    verbs_file  = sys.argv[1]
    freq_file   = sys.argv[2]
    output_file = sys.argv[3] if len(sys.argv) > 3 else 'common_verbs.json'
    max_verbs   = int(sys.argv[4]) if len(sys.argv) > 4 else 2000

    print(f'Loading {verbs_file}...')
    with open(verbs_file, encoding='utf-8') as f:
        verbs_db = json.load(f)

    valid_verbs = {k for k, v in verbs_db.items() if not v.get('variant_only') and ' ' not in k}
    print(f'Valid single-word verbs (non-variant): {len(valid_verbs)}')

    print(f'Loading {freq_file}...')
    freq_ordered = []
    freq_top50k  = set()
    with open(freq_file, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = line.split()
            if len(parts) < 2:
                continue
            # Support both 'word freq' and 'rank word freq' (Leipzig) formats
            word = parts[1].lower() if parts[0].isdigit() else parts[0].lower()
            freq_ordered.append(word)
    freq_top50k = set(freq_ordered[:50000])
    print(f'Frequency list entries: {len(freq_ordered)}')

    # Build common list: iterate frequency order, take first max_verbs in valid_verbs
    common = []
    seen   = set()
    for word in freq_ordered:
        if word in valid_verbs and word not in seen:
            common.append(word)
            seen.add(word)
        if len(common) >= max_verbs:
            break

    print(f'Common verbs selected: {len(common)}')

    # Log dropped verbs (valid but absent from frequency top-50K)
    dropped = sorted(v for v in valid_verbs if v not in freq_top50k)
    dropped_file = output_file.replace('.json', '_dropped.txt')
    with open(dropped_file, 'w', encoding='utf-8') as f:
        f.write(f'# Verbs in verbsDB not found in frequency top-50K\n')
        f.write(f'# Review and manually add to {output_file} if needed\n')
        f.write(f'# Total: {len(dropped)}\n\n')
        for v in dropped:
            f.write(v + '\n')
    print(f'Dropped verbs logged: {dropped_file} ({len(dropped)} entries)')

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(common, f, ensure_ascii=False, separators=(',', ':'))
    size_kb = os.path.getsize(output_file) / 1024
    print(f'Output: {output_file} ({size_kb:.1f} KB, {len(common)} verbs)')

if __name__ == '__main__':
    main()
PYEOF
"
```

- [ ] **Step 2: Verify the file was created**

```bash
ssh condor "python3 /home/cuervo/projects/einfach-konjugieren/data/build_common_verbs.py --help 2>&1 || python3 /home/cuervo/projects/einfach-konjugieren/data/build_common_verbs.py 2>&1"
```

Expected output includes the Usage line.

---

## Task 5: Rebuild `verbs.json` on Condor

This rebuild takes 10–15 minutes. Run in the background.

- [ ] **Step 1: Start the rebuild**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && nohup python3 data/build_verb_db.py data/kaikki-german.jsonl /home/cuervo/projects/german-verbs-api/data/verbs.json > /tmp/build_verb_db.log 2>&1 &"
ssh condor "echo Build started, PID: && cat /proc/\$(pgrep -f build_verb_db.py)/status 2>/dev/null | grep Pid || echo 'check /tmp/build_verb_db.log'"
```

- [ ] **Step 2: Tail the log until completion**

```bash
ssh condor "tail -f /tmp/build_verb_db.log"
```

Press Ctrl+C when you see `Output: ... MB`. Expected final lines:
```
Done!
  Total lines: ~850000
  Verb entries: 86720
  Skipped (no conjugation data): ...
  Unique verbs extracted: ~9846
  Output: /home/cuervo/projects/german-verbs-api/data/verbs.json (X.X MB)
  Idioms: 763 entries, ...
```

- [ ] **Step 3: Verify the rebuilt verbs.json**

```bash
ssh condor "python3 -c \"
import json
v = json.load(open('/home/cuervo/projects/german-verbs-api/data/verbs.json'))

# beystehen must be variant_only, no translations
b = v.get('beystehen', {})
print('beystehen variant_only:', b.get('variant_only'))
print('beystehen translations:', b.get('translations', 'NONE'))

# gehen must have translations (real verb, not filtered)
g = v.get('gehen', {})
print('gehen translations:', g.get('translations', {}).get('en', [])[:2])

# klimmen must NOT be variant_only (it is archaic but a real verb)
k = v.get('klimmen', {})
print('klimmen variant_only:', k.get('variant_only', False))

# Count variant_only entries
vcount = sum(1 for x in v.values() if x.get('variant_only'))
print('Total variant_only:', vcount, '(expected ~819)')
print('Total verbs:', len(v))
\""
```

Expected:
- `beystehen variant_only: True`
- `beystehen translations: NONE`
- `gehen translations:` shows 2 English glosses
- `klimmen variant_only: False`
- `Total variant_only:` 700–900

---

## Task 6: Generate `common_verbs.json`

- [ ] **Step 1: Run build_common_verbs.py**

```bash
ssh condor "python3 /home/cuervo/projects/einfach-konjugieren/data/build_common_verbs.py /home/cuervo/projects/german-verbs-api/data/verbs.json /home/cuervo/projects/einfach-konjugieren/data/de_frequency.txt /home/cuervo/projects/german-verbs-api/data/common_verbs.json 2000"
```

Expected:
```
Valid single-word verbs (non-variant): ~9000
Frequency list entries: ~50000
Common verbs selected: 2000
Dropped verbs logged: common_verbs_dropped.txt
Output: common_verbs.json (~25 KB, 2000 verbs)
```

- [ ] **Step 2: Review dropped verbs for false exclusions**

```bash
ssh condor "head -30 /home/cuervo/projects/german-verbs-api/data/common_verbs_dropped.txt"
```

Scan for obviously common verbs that should be in the pool. If any appear (e.g. `kochen`, `schreiben`), manually add them to `common_verbs.json`:

```bash
# Only run if needed — add up to 10 manually:
ssh condor "python3 -c \"
import json
path = '/home/cuervo/projects/german-verbs-api/data/common_verbs.json'
pool = json.load(open(path))
# Add any missing common verbs found in dropped list:
missing = []  # e.g. ['kochen', 'schreiben'] if they appear wrongly in dropped
for v in missing:
    if v not in pool:
        pool.append(v)
with open(path, 'r+') as f:
    f.seek(0)
    f.write(json.dumps(pool, ensure_ascii=False, separators=(',', ':')))
    f.truncate()
print('Pool size after additions:', len(pool))
\""
```

- [ ] **Step 3: Verify key verbs**

```bash
ssh condor "python3 -c \"
import json
pool = json.load(open('/home/cuervo/projects/german-verbs-api/data/common_verbs.json'))
print('Pool size:', len(pool))
for v in ['gehen', 'machen', 'sein', 'haben', 'kommen', 'sehen']:
    print(f'{v} in pool: {v in pool}')
print('verelffachen in pool:', 'verelffachen' in pool)
print('beystehen in pool:', 'beystehen' in pool)
\""
```

Expected: `gehen`–`sehen` all True, `verelffachen` False, `beystehen` False.

- [ ] **Step 4: Commit new build script and data files**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && git add data/build_common_verbs.py && git commit -m 'feat: add build_common_verbs.py for frequency-filtered random pool'"
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && git push gitea main"
ssh condor "cd /home/cuervo/projects/german-verbs-api && git add data/verbs.json data/common_verbs.json data/common_verbs_dropped.txt && git commit -m 'data: rebuild verbs.json (bug fixes), add common_verbs.json (2000 verb random pool)'"
ssh condor "cd /home/cuervo/projects/german-verbs-api && git push gitea main"
```

---

## Task 7: Add `getRandomPool()` to `verbFinder.js`

**Files:**
- Modify: `condor:/home/cuervo/projects/german-verbs-api/verbFinding/verbFinder.js`

- [ ] **Step 1: Add require and cache for common_verbs.json**

Insert after the `let cachedVerbList = null` line:

```bash
ssh condor "python3 << 'EOF'
path = '/home/cuervo/projects/german-verbs-api/verbFinding/verbFinder.js'
with open(path, 'r') as f:
    src = f.read()

old = '// Idiom list (multi-word verbs with English glosses)'

new = '''// Common verbs for random picker (frequency-filtered, ~2000 verbs)
const commonVerbsList = require('../data/common_verbs.json')
let cachedRandomPool = null
const getRandomPool = () => {
    if (!cachedRandomPool) {
        cachedRandomPool = commonVerbsList
    }
    return cachedRandomPool
}

// Idiom list (multi-word verbs with English glosses)'''

assert old in src, 'anchor not found'
src = src.replace(old, new)
with open(path, 'r+') as f:
    f.seek(0)
    f.write(src)
    f.truncate()
print('getRandomPool added OK')
EOF
"
```

- [ ] **Step 2: Export `getRandomPool`**

```bash
ssh condor "python3 << 'EOF'
path = '/home/cuervo/projects/german-verbs-api/verbFinding/verbFinder.js'
with open(path, 'r') as f:
    src = f.read()

old = '    getVerbList,\n    getIdiomList\n}'

new = '    getVerbList,\n    getIdiomList,\n    getRandomPool\n}'

assert old in src, 'exports block not found'
src = src.replace(old, new)
with open(path, 'r+') as f:
    f.seek(0)
    f.write(src)
    f.truncate()
print('export patched OK')
EOF
"
```

- [ ] **Step 3: Verify**

```bash
ssh condor "grep -n 'getRandomPool\|commonVerbsList' /home/cuervo/projects/german-verbs-api/verbFinding/verbFinder.js"
```

Expected: 4 matches (require, cachedRandomPool init, function body, export).

---

## Task 8: Add `/random-pool` API endpoint

**Files:**
- Modify: `condor:/home/cuervo/projects/german-verbs-api/controllers/verbs.js`
- Modify: `condor:/home/cuervo/projects/german-verbs-api/routes/verbs.js`

- [ ] **Step 1: Add `listRandomPool` handler to the controller**

```bash
ssh condor "python3 << 'EOF'
path = '/home/cuervo/projects/german-verbs-api/controllers/verbs.js'
with open(path, 'r') as f:
    src = f.read()

old = '''const {
    tenseExists,
    getAllTenses,
    getTense,
    getPerson,
    getArrayTenses,
    getVerbList,
    getIdiomList
} = require('../verbFinding/verbFinder')'''

new = '''const {
    tenseExists,
    getAllTenses,
    getTense,
    getPerson,
    getArrayTenses,
    getVerbList,
    getIdiomList,
    getRandomPool
} = require('../verbFinding/verbFinder')'''

assert old in src, 'require block not found'
src = src.replace(old, new)

# Add the handler before module.exports
old = 'module.exports = {'

new = '''// GET /random-pool — list common verbs for random picker
const listRandomPool = (req, res) => {
    return res.status(200).json({ success: true, data: getRandomPool() })
}

module.exports = {'''

assert old in src, 'module.exports not found'
src = src.replace(old, new, 1)  # replace only first occurrence

with open(path, 'r+') as f:
    f.seek(0)
    f.write(src)
    f.truncate()
print('listRandomPool added OK')
EOF
"
```

- [ ] **Step 2: Export `listRandomPool` from the controller**

```bash
ssh condor "python3 << 'EOF'
path = '/home/cuervo/projects/german-verbs-api/controllers/verbs.js'
with open(path, 'r') as f:
    src = f.read()

old = '    conjugateFull,\n    conjugatePerson,\n    conjugateArray,\n    listVerbs,\n    listIdioms\n}'

new = '    conjugateFull,\n    conjugatePerson,\n    conjugateArray,\n    listVerbs,\n    listIdioms,\n    listRandomPool\n}'

assert old in src, 'exports block not found'
src = src.replace(old, new)
with open(path, 'r+') as f:
    f.seek(0)
    f.write(src)
    f.truncate()
print('export patched OK')
EOF
"
```

- [ ] **Step 3: Add route in `routes/verbs.js`**

The new route MUST be inserted before `router.all("*", ...)`.

```bash
ssh condor "python3 << 'EOF'
path = '/home/cuervo/projects/german-verbs-api/routes/verbs.js'
with open(path, 'r') as f:
    src = f.read()

old = '''const {
    conjugateFull,
    conjugatePerson,
    conjugateArray,
    listVerbs,
    listIdioms
} = require('../controllers/verbs')'''

new = '''const {
    conjugateFull,
    conjugatePerson,
    conjugateArray,
    listVerbs,
    listIdioms,
    listRandomPool
} = require('../controllers/verbs')'''

assert old in src, 'require block not found'
src = src.replace(old, new)

old = \"router.all('*'\"
new = \"router.get('/random-pool', listRandomPool)\\n\\nrouter.all('*'\"
assert old in src, 'catch-all route not found'
src = src.replace(old, new, 1)

with open(path, 'r+') as f:
    f.seek(0)
    f.write(src)
    f.truncate()
print('route added OK')
EOF
"
```

- [ ] **Step 4: Commit API changes**

```bash
ssh condor "cd /home/cuervo/projects/german-verbs-api && git add verbFinding/verbFinder.js controllers/verbs.js routes/verbs.js && git commit -m 'feat: add /random-pool endpoint returning frequency-filtered verb list'"
ssh condor "cd /home/cuervo/projects/german-verbs-api && git push gitea main"
```

---

## Task 9: Fix impersonal verb crash in SPA (Bug 9)

**Files:**
- Modify: `condor:/home/cuervo/projects/einfach-konjugieren/script/api.js`
- Modify: `condor:/home/cuervo/projects/einfach-konjugieren/script/conjugator.js`

Context: 30 verbs (nieseln, bevorstehen, etc.) have incomplete person sets — only S3 exists. The current `formatConjugation(undefined)` throws `TypeError: undefined.join is not a function`, which the catch block in `conjugator()` converts to "Verb nicht gefunden" — the verb is in the DB but appears broken.

- [ ] **Step 1: Fix `getIndicativeTenses()` in `api.js`**

```bash
ssh condor "python3 << 'EOF'
path = '/home/cuervo/projects/einfach-konjugieren/script/api.js'
with open(path, 'r') as f:
    src = f.read()

old = '''export function getIndicativeTenses(data) {
  const result = {};
  for (const tense of INDICATIVE_TENSES) {
    if (data[tense]) {
      result[tense] = {};
      for (const person of PERSON_ORDER) {
        result[tense][person] = formatConjugation(data[tense][person]);
      }
    }
  }
  return result;
}'''

new = '''export function getIndicativeTenses(data) {
  const result = {};
  for (const tense of INDICATIVE_TENSES) {
    if (data[tense]) {
      result[tense] = {};
      for (const person of PERSON_ORDER) {
        const val = data[tense][person];
        result[tense][person] = val != null ? formatConjugation(val) : null;
      }
    }
  }
  return result;
}'''

assert old in src, 'getIndicativeTenses not found'
src = src.replace(old, new)
with open(path, 'r+') as f:
    f.seek(0)
    f.write(src)
    f.truncate()
print('getIndicativeTenses patched OK')
EOF
"
```

- [ ] **Step 2: Fix `buildTenseCard()` in `conjugator.js` to render null as a dash**

The crash line is `conj.textContent = indicative[tense][p]` — when the value is `null`, the pronoun row still renders but the conjugation cell is empty. Use a dash to signal the form doesn't exist.

```bash
ssh condor "python3 << 'EOF'
path = '/home/cuervo/projects/einfach-konjugieren/script/conjugator.js'
with open(path, 'r') as f:
    src = f.read()

old = '    conj.textContent = indicative[tense][p];'
new = '    conj.textContent = indicative[tense][p] ?? \"—\";'

assert old in src, 'conj.textContent line not found'
src = src.replace(old, new)
with open(path, 'r+') as f:
    f.seek(0)
    f.write(src)
    f.truncate()
print('buildTenseCard patched OK')
EOF
"
```

- [ ] **Step 3: Verify both patches**

```bash
ssh condor "grep -n 'val != null\|?? ' /home/cuervo/projects/einfach-konjugieren/script/api.js /home/cuervo/projects/einfach-konjugieren/script/conjugator.js"
```

Expected: one match in api.js (`val != null`), one in conjugator.js (`?? "—"`).

---

## Task 10: Add `fetchRandomPool()` and update `getRandomVerb()` in `api.js` (Bug 11)

**Files:**
- Modify: `condor:/home/cuervo/projects/einfach-konjugieren/script/api.js`

Context: The current `getRandomVerb()` draws from `verbListCache` (all 9846 verbs). After this task it draws from `randomPoolCache` (the ~2000 common verbs). If the pool hasn't loaded yet, it falls back to `verbListCache` so the button never silently fails.

Do NOT change `VERB_LIST_KEY` — the `/verbs` endpoint content is unchanged, bumping the key forces all users to re-download for no reason.

- [ ] **Step 1: Replace `getRandomVerb()` and add `fetchRandomPool()`**

```bash
ssh condor "python3 << 'EOF'
path = '/home/cuervo/projects/einfach-konjugieren/script/api.js'
with open(path, 'r') as f:
    src = f.read()

old = '''export function getRandomVerb() {
  if (!verbListCache || verbListCache.length === 0) return null;
  return verbListCache[Math.floor(Math.random() * verbListCache.length)];
}'''

new = '''export function getRandomVerb() {
  const pool = (randomPoolCache && randomPoolCache.length > 0)
    ? randomPoolCache
    : verbListCache;
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

const RANDOM_POOL_KEY = \"einfach_random_pool_v1\";
const RANDOM_POOL_TTL = 7 * 24 * 60 * 60 * 1000;
let randomPoolCache = null;

export async function fetchRandomPool() {
  if (randomPoolCache) return randomPoolCache;

  try {
    const stored = localStorage.getItem(RANDOM_POOL_KEY);
    if (stored) {
      const { data, ts } = JSON.parse(stored);
      if (Date.now() - ts < RANDOM_POOL_TTL) {
        randomPoolCache = data;
        return randomPoolCache;
      }
    }
  } catch { /* ignore */ }

  try {
    const res = await fetch(\"/api/german-verbs-api/random-pool\");
    if (!res.ok) return [];
    const json = await res.json();
    randomPoolCache = json.data || [];
    localStorage.setItem(
      RANDOM_POOL_KEY,
      JSON.stringify({ data: randomPoolCache, ts: Date.now() })
    );
    return randomPoolCache;
  } catch {
    return [];
  }
}'''

assert old in src, 'getRandomVerb not found'
src = src.replace(old, new)
with open(path, 'r+') as f:
    f.seek(0)
    f.write(src)
    f.truncate()
print('fetchRandomPool added OK')
EOF
"
```

- [ ] **Step 2: Verify**

```bash
ssh condor "grep -n 'randomPoolCache\|fetchRandomPool\|RANDOM_POOL' /home/cuervo/projects/einfach-konjugieren/script/api.js"
```

Expected: 8–10 matches across the new function.

---

## Task 11: Call `fetchRandomPool()` in `main.js` at startup

**Files:**
- Modify: `condor:/home/cuervo/projects/einfach-konjugieren/script/main.js`

- [ ] **Step 1: Add `fetchRandomPool` to the import**

```bash
ssh condor "python3 << 'EOF'
path = '/home/cuervo/projects/einfach-konjugieren/script/main.js'
with open(path, 'r') as f:
    src = f.read()

old = 'import { fetchVerbList, getRandomVerb } from \"/script/api.js\";'
new = 'import { fetchVerbList, getRandomVerb, fetchRandomPool } from \"/script/api.js\";'

assert old in src, 'api.js import line not found'
src = src.replace(old, new)
with open(path, 'r+') as f:
    f.seek(0)
    f.write(src)
    f.truncate()
print('import patched OK')
EOF
"
```

- [ ] **Step 2: Call `fetchRandomPool()` alongside `fetchVerbList()`**

```bash
ssh condor "python3 << 'EOF'
path = '/home/cuervo/projects/einfach-konjugieren/script/main.js'
with open(path, 'r') as f:
    src = f.read()

old = '''// Preload verb list for autocomplete
let verbList = [];
fetchVerbList().then((list) => {
  verbList = list;
});'''

new = '''// Preload verb list for autocomplete and random pool
let verbList = [];
fetchVerbList().then((list) => {
  verbList = list;
});
fetchRandomPool();'''

assert old in src, 'fetchVerbList block not found'
src = src.replace(old, new)
with open(path, 'r+') as f:
    f.seek(0)
    f.write(src)
    f.truncate()
print('fetchRandomPool call added OK')
EOF
"
```

- [ ] **Step 3: Commit SPA changes**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && git add script/api.js script/conjugator.js script/main.js && git commit -m 'fix: impersonal verb crash, random pool from common_verbs, init fetchRandomPool'"
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && git push gitea main"
```

---

## Task 12: Rebuild and deploy API container

- [ ] **Step 1: Build and restart**

```bash
ssh condor "cd /home/cuervo/projects/german-verbs-api && docker compose build --no-cache && docker compose up -d"
```

Expected: Build completes, container restarts, `docker compose ps` shows `german_verbs_api` healthy.

- [ ] **Step 2: Verify `/random-pool` endpoint is live**

```bash
ssh condor "curl -s 'https://konjugieren.davidmendoza.ch/api/german-verbs-api/random-pool' | python3 -c \"import json,sys; d=json.load(sys.stdin); print(len(d['data']), 'verbs in pool'); print('verelffachen absent:', 'verelffachen' not in d['data'])\""
```

Expected: ~2000 verbs in pool, `verelffachen absent: True`.

- [ ] **Step 3: Verify `/verbs` endpoint still works (autocomplete unchanged)**

```bash
ssh condor "curl -s 'https://konjugieren.davidmendoza.ch/api/german-verbs-api/verbs' | python3 -c \"import json,sys; d=json.load(sys.stdin); print(len(d['data']), 'verbs total'); print('verelffachen in full list:', 'verelffachen' in d['data'])\""
```

Expected: ~9846 verbs total, `verelffachen` present in full list (autocomplete still finds it).

---

## Task 13: Rebuild and deploy SPA container

- [ ] **Step 1: Build and restart**

```bash
ssh condor "cd /home/cuervo/projects/einfach-konjugieren && docker compose build --no-cache && docker compose up -d"
```

Expected: Build compiles cleanly (no JS/SCSS errors), container restarts.

---

## Task 14: Smoke test

- [ ] **Test 1: Random verb button — quality check**

Open https://konjugieren.davidmendoza.ch and click "Zufälliges Verb" 15 times. All verbs should be recognizable common German verbs. None should be archaic spelling variants or hyper-specialized vocabulary.

- [ ] **Test 2: Impersonal verb — nieseln**

Type `nieseln` in the search box and submit. Expected: conjugation cards render. Only `er/sie/es` row should show a real conjugation form; other rows show `—`. No "nicht gefunden" error.

- [ ] **Test 3: Archaic variant — beystehen**

Type `beystehen` and submit. Expected: conjugation cards render (the verb is still in the DB and searchable), but the random button will never surface it.

- [ ] **Test 4: Translation filter fix**

Type a verb that previously showed junk translations. Check that translations displayed under the verb pill are clean English glosses, not "obsolete spelling of X" or "alternative form of X".

- [ ] **Test 5: Autocomplete still shows all verbs**

Type `vere` in the search box. `verelffachen` should appear in the autocomplete dropdown (it's in the full verb list). It should just never appear via the random button.

- [ ] **Step 6: Send NTFY notification**

```bash
curl -H "Authorization: Bearer tk_c977ne6zjlxdinsk80sw56rm1tnwt" \
  -d "Einfach Konjugieren: verb quality filtering deployed. Random pool: ~2000 common verbs. Impersonal verb crash fixed. Translation filter fixed." \
  https://ntfy.tamarindo.uk/cuervo-infra
```

- [ ] **Step 7: Update ops STATE.md**

```bash
ssh condor "cat >> /home/cuervo/operations/projects/einfach-konjugieren/STATE.md << 'EOF'

## Update 2026-05-07 (quality filtering)
- Translation filter: case-insensitive startswith + tag filter for alt-of/obsolete/archaic. Both extract_translations() and extract_best_gloss() fixed.
- variant_only flag: 819 archaic spelling variants marked, excluded from random pool.
- Merge logic fixed: non-variant entry always displaces variant regardless of tense count.
- common_verbs.json: ~2000 frequency-filtered verbs for random picker (hermitdave/OpenSubtitles corpus).
- /random-pool endpoint: new API route returns common verbs list.
- Impersonal verb crash fixed: getIndicativeTenses() null-guards, buildTenseCard() shows — for missing forms.
- fetchRandomPool() added to SPA, called at init alongside fetchVerbList().
EOF
"
```

