# Database Migration Strategy for Einfach Konjugieren

## Current State
- **Storage**: JSON files (`data/verbs_database.json`, `data/examples.json`)
- **Size**: ~778KB of verb conjugation data (~35K lines)
- **Access Pattern**: Read-heavy, static data that rarely changes

## Recommended Migration Path

### Phase 1: SQLite (Lightweight & Portable)
**Best for**: Single-instance, read-heavy workloads, simple deployment

**Schema Design:**
```sql
CREATE TABLE verbs (
    id INTEGER PRIMARY KEY,
    infinitive TEXT NOT NULL UNIQUE,
    ich TEXT,
    du TEXT,
    er TEXT,
    wir TEXT,
    ihr TEXT,
    sie TEXT,
    particletxt TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE examples (
    id INTEGER PRIMARY KEY,
    verb_infinitive TEXT NOT NULL,
    sentence TEXT NOT NULL,
    FOREIGN KEY (verb_infinitive) REFERENCES verbs(infinitive)
);

CREATE INDEX idx_verbs_infinitive ON verbs(infinitive);
CREATE INDEX idx_examples_verb ON examples(verb_infinitive);
```

**Advantages:**
- Zero configuration
- File-based (easy backup)
- Fast reads (perfect for dictionary lookup)
- Works in Docker containers
- No separate database server needed

---

### Phase 2: PostgreSQL (When Scaling)
**Migrate when you need:**
- Multiple concurrent writers
- Full-text search with ranking
- User-generated content (saved conjugations, custom word lists)
- API backend shared across services

Already available on contabo at `postgres:5432`

---

## Quick Migration Script

```javascript
// scripts/migrate-to-sqlite.js
import Database from better-sqlite3;
import { readFileSync } from fs;

const db = new Database(data/verbs.db);

db.exec(`
  CREATE TABLE IF NOT EXISTS verbs (
    id INTEGER PRIMARY KEY,
    infinitive TEXT NOT NULL UNIQUE,
    ich TEXT, du TEXT, er TEXT, wir TEXT, ihr TEXT, sie TEXT,
    particletxt TEXT
  );
`);

const verbsData = JSON.parse(readFileSync(data/verbs_database.json));
const insert = db.prepare(`
  INSERT OR REPLACE INTO verbs (infinitive, ich, du, er, wir, ihr, sie, particletxt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((verbs) => {
  for (const v of verbs) {
    insert.run(v.infinitive, v.conjugations.ich, v.conjugations.du, 
      v.conjugations.er, v.conjugations.wir, v.conjugations.ihr, 
      v.conjugations.Sie, v.conjugations.particletxt);
  }
});

insertMany(verbsData.verbs);
console.log(`Migrated ${verbsData.verbs.length} verbs`);
```

---

## Recommendation

**Start with SQLite:**
1. Current data is small (~35K records)
2. Read-heavy workload
3. No multi-user writes needed
4. PostgreSQL available on contabo if scaling needed later

## Files to Update
- `package.json` - Add `better-sqlite3`
- `script/conjugator.js` - Query SQLite instead of JSON
- `Dockerfile` - Include SQLite runtime
