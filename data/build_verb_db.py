#!/usr/bin/env python3
"""
Build a compact German verb conjugation database from Wiktionary (kaikki.org) data.

Input:  kaikki.org-dictionary-German.jsonl (from English Wiktionary)
Output: verbs.json — { infinitive: { auxiliary, tenses: { TENSE: { PERSON: "form" } } } }

Only extracts the 6 indicative tenses (main clause forms, not subordinate clause).
For verbs with both haben/sein, stores both but marks the primary one.
"""

import json
import sys
from collections import defaultdict

TENSE_MAP = {
    "present": "PRASENS",
    "preterite": "PRATERITUM",
    "perfect": "PERFEKT",
    "pluperfect": "PLUSQUAMPERFEKT",
    "future-i": "FUTUR1",
    "future-ii": "FUTUR2",
}

PERSON_MAP = {
    ("first-person", "singular"): "S1",
    ("second-person", "singular"): "S2",
    ("third-person", "singular"): "S3",
    ("first-person", "plural"): "P1",
    ("second-person", "plural"): "P2",
    ("third-person", "plural"): "P3",
}


def extract_auxiliary(forms):
    """Extract the auxiliary verb (haben/sein) from the forms list."""
    aux_haben = False
    aux_sein = False

    for f in forms:
        tags = set(f.get("tags", []))
        if "auxiliary" not in tags:
            continue
        form_val = f.get("form", "").lower()
        # Skip regional/colloquial-only auxiliary markers
        if tags & {"colloquial", "Northwest-German", "regional"}:
            # Still note it exists, but don't prefer it
            if "sein" in form_val:
                aux_sein = True
            continue
        if "haben" in form_val:
            aux_haben = True
        if "sein" in form_val:
            aux_sein = True

    if aux_haben and aux_sein:
        return "haben/sein"
    elif aux_sein:
        return "sein"
    elif aux_haben:
        return "haben"
    return "haben"  # default fallback


def extract_tenses(forms):
    """Extract the 6 indicative tenses from forms."""
    tenses = defaultdict(dict)

    for f in forms:
        tags = set(f.get("tags", []))
        form_val = f.get("form", "")

        # Must be indicative
        if "indicative" not in tags:
            continue
        # Skip subordinate-clause forms (those keep the prefix attached)
        if "subordinate-clause" in tags:
            continue

        # Determine tense
        tense_key = None
        for wiktag, our_tense in TENSE_MAP.items():
            if wiktag in tags:
                tense_key = our_tense
                break
        if not tense_key:
            continue

        # Determine person+number
        person = None
        number = None
        for t in tags:
            if t == "first-person":
                person = "first-person"
            elif t == "second-person":
                person = "second-person"
            elif t == "third-person":
                person = "third-person"
            elif t == "singular":
                number = "singular"
            elif t == "plural":
                number = "plural"

        if not person or not number:
            continue

        person_key = PERSON_MAP.get((person, number))
        if not person_key:
            continue

        # For compound tenses (Perfekt, Plusquamperfekt, Futur II) that have
        # both haben and sein variants, prefer haben unless verb is sein-only
        if person_key in tenses[tense_key]:
            existing = tenses[tense_key][person_key]
            # Keep the haben variant if we already have one
            if "habe" in existing or "hat" in existing or "hatte" in existing or "werden" in existing:
                continue
        tenses[tense_key][person_key] = form_val

    return dict(tenses)


def pick_primary_aux_forms(tenses, auxiliary):
    """For compound tenses, pick the correct auxiliary forms.

    When a verb uses haben, pick haben-based forms.
    When a verb uses sein, pick sein-based forms.
    When both, pick haben as primary.
    """
    if auxiliary == "sein":
        preferred_aux = "sein"
    else:
        preferred_aux = "haben"

    # Mapping of auxiliary indicators for each compound tense
    haben_markers = {
        "PERFEKT": {"habe", "hast", "hat", "haben", "habt"},
        "PLUSQUAMPERFEKT": {"hatte", "hattest", "hatten", "hattet"},
        "FUTUR2": {"haben"},  # "werde ... haben"
    }
    sein_markers = {
        "PERFEKT": {"bin", "bist", "ist", "sind", "seid"},
        "PLUSQUAMPERFEKT": {"war", "warst", "waren", "wart"},
        "FUTUR2": {"sein"},  # "werde ... sein"
    }

    return tenses  # We'll handle this during extraction by order preference


def process_verb(entry):
    """Process a single verb entry from the JSONL."""
    word = entry.get("word", "")
    forms = entry.get("forms", [])

    if not forms:
        return None

    # Get conjugation forms (prefer source=conjugation, fall back to all)
    conj_forms = [f for f in forms if f.get("source") == "conjugation"]
    if not conj_forms:
        conj_forms = forms

    auxiliary = extract_auxiliary(forms)  # Check all forms for aux
    tenses = extract_tenses(conj_forms)

    if not tenses:
        return None

    # For compound tenses with both haben/sein forms, pick the right one
    if auxiliary in ("haben", "haben/sein"):
        preferred_starts = {
            "PERFEKT": ("habe ", "hast ", "hat ", "haben ", "habt "),
            "PLUSQUAMPERFEKT": ("hatte ", "hattest ", "hatten ", "hattet "),
            "FUTUR2": None,  # ends with "haben"
        }
    else:  # sein
        preferred_starts = {
            "PERFEKT": ("bin ", "bist ", "ist ", "sind ", "seid "),
            "PLUSQUAMPERFEKT": ("war ", "warst ", "waren ", "wart "),
            "FUTUR2": None,  # ends with "sein"
        }

    # Re-extract compound tenses with auxiliary preference
    for tense_key in ("PERFEKT", "PLUSQUAMPERFEKT", "FUTUR2"):
        tense_forms = {}
        for f in conj_forms:
            tags = set(f.get("tags", []))
            if "indicative" not in tags or "subordinate-clause" in tags:
                continue

            wiktag = {"PERFEKT": "perfect", "PLUSQUAMPERFEKT": "pluperfect", "FUTUR2": "future-ii"}[tense_key]
            if wiktag not in tags:
                continue

            person = number = None
            for t in tags:
                if t == "first-person": person = "first-person"
                elif t == "second-person": person = "second-person"
                elif t == "third-person": person = "third-person"
                elif t == "singular": number = "singular"
                elif t == "plural": number = "plural"
            if not person or not number:
                continue

            pk = PERSON_MAP.get((person, number))
            if not pk:
                continue

            form_val = f.get("form", "")

            # Check if this form matches our preferred auxiliary
            prefixes = preferred_starts.get(tense_key)
            if prefixes:
                is_preferred = any(form_val.startswith(p) for p in prefixes)
            else:
                # For Futur II, check ending
                if auxiliary in ("haben", "haben/sein"):
                    is_preferred = form_val.endswith(" haben")
                else:
                    is_preferred = form_val.endswith(" sein")

            if pk not in tense_forms or is_preferred:
                tense_forms[pk] = form_val

        if tense_forms:
            tenses[tense_key] = tense_forms

    # Only include verbs that have at least Präsens
    if "PRASENS" not in tenses:
        return None

    return {
        "auxiliary": auxiliary,
        "tenses": tenses,
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 build_verb_db.py <kaikki-german.jsonl> [output.json]")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "verbs.json"

    verbs = {}
    total_lines = 0
    verb_entries = 0
    skipped = 0

    print(f"Processing {input_file}...")

    with open(input_file, "r", encoding="utf-8") as fh:
        for line in fh:
            total_lines += 1
            if total_lines % 50000 == 0:
                print(f"  Processed {total_lines} lines, found {len(verbs)} verbs...", file=sys.stderr)

            line = line.strip()
            if not line:
                continue

            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue

            if entry.get("pos") != "verb":
                continue

            verb_entries += 1
            word = entry.get("word", "").strip()
            if not word:
                continue

            result = process_verb(entry)
            if result is None:
                skipped += 1
                continue

            # If verb already exists (multiple senses), merge/keep the one with more tenses
            if word in verbs:
                existing_tense_count = sum(len(v) for v in verbs[word]["tenses"].values())
                new_tense_count = sum(len(v) for v in result["tenses"].values())
                if new_tense_count <= existing_tense_count:
                    continue

            verbs[word] = result

    print(f"\nDone!")
    print(f"  Total lines: {total_lines}")
    print(f"  Verb entries: {verb_entries}")
    print(f"  Skipped (no conjugation data): {skipped}")
    print(f"  Unique verbs extracted: {len(verbs)}")

    # Sort by infinitive for consistent output
    sorted_verbs = dict(sorted(verbs.items()))

    with open(output_file, "w", encoding="utf-8") as fh:
        json.dump(sorted_verbs, fh, ensure_ascii=False, indent=None, separators=(",", ":"))

    import os
    size_mb = os.path.getsize(output_file) / (1024 * 1024)
    print(f"  Output: {output_file} ({size_mb:.1f} MB)")

    # Build idioms.json (multi-word verbs with English glosses)
    idioms_file = os.path.join(os.path.dirname(output_file), "idioms.json")
    build_idioms(input_file, verbs, idioms_file)



def extract_best_gloss(entry):
    """Extract the first useful English gloss from a kaikki entry."""
    for sense in entry.get("senses", []):
        glosses = sense.get("glosses", [])
        for g in glosses:
            if g and not g.startswith("Alternative") and not g.startswith("Obsolete"):
                return g
    return None


def build_idioms(input_file, verbs_db, output_file="idioms.json"):
    """Second pass: extract phrase + gloss for every multi-word verb in verbs_db."""
    multi_word_keys = {k for k in verbs_db if " " in k}
    if not multi_word_keys:
        print("No multi-word verbs found, skipping idioms.")
        return

    print(f"\nBuilding idioms.json for {len(multi_word_keys)} multi-word verbs...")

    glosses = {}
    with open(input_file, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            if entry.get("pos") != "verb":
                continue
            word = entry.get("word", "").strip()
            if word not in multi_word_keys:
                continue
            if word in glosses:
                continue
            gloss = extract_best_gloss(entry)
            if gloss:
                glosses[word] = gloss

    idioms = sorted(
        [{"phrase": phrase, "gloss": gloss} for phrase, gloss in glosses.items()],
        key=lambda x: x["phrase"].lower(),
    )

    with open(output_file, "w", encoding="utf-8") as fh:
        json.dump(idioms, fh, ensure_ascii=False, indent=None, separators=(",", ":"))

    import os
    size_kb = os.path.getsize(output_file) / 1024
    print(f"  Idioms: {len(idioms)} entries, {size_kb:.1f} KB -> {output_file}")
    return idioms


if __name__ == "__main__":
    main()
