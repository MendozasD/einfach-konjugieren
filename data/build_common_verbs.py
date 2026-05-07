#!/usr/bin/env python3
"""
Generate common_verbs.json: top ~2000 German verb infinitives for the random picker.
Intersects verbs.json with a word frequency list, skipping variant_only entries.
Logs verbs absent from the frequency list to <output>_dropped.txt for manual review.

Usage: python3 build_common_verbs.py <verbs.json> <frequency_file> [output.json] [max_verbs]
"""
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

    # Build common list in frequency order
    common = []
    seen   = set()
    for word in freq_ordered:
        if word in valid_verbs and word not in seen:
            common.append(word)
            seen.add(word)
        if len(common) >= max_verbs:
            break

    print(f'Common verbs selected: {len(common)}')

    # Log verbs not found in frequency top-50K
    dropped = sorted(v for v in valid_verbs if v not in freq_top50k)
    dropped_file = output_file.replace('.json', '_dropped.txt')
    with open(dropped_file, 'w', encoding='utf-8') as f:
        f.write('# Verbs in verbsDB not found in frequency top-50K\n')
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
