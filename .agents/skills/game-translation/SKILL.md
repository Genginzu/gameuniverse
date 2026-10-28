---
name: game-translation
description:
  Translate games directly in the Supabase database — insert French rows into
  `game_translations` via the PostgREST API. Activate when the user asks to
  translate games, add `fr` translations, fill missing translations, or any
  request touching `game_translations` / bulk game localization.
---

# Skill: Game Translation — GameUniverse

Adds French translations to `public.game_translations` (`title`, `description`,
`language_code='fr'`) for games that have an English row but no French one.

## Schema

```
game_translations (
  id UUID PK,
  game_id UUID REFERENCES games(id),
  language_code VARCHAR(2) REFERENCES languages(code),  -- 'fr' exists
  title VARCHAR(255) NOT NULL,
  description TEXT,
  UNIQUE(game_id, language_code)
)
```

Games table has no title/description columns — all text lives in
`game_translations`. Base is ~100% English (`en`); `fr` rows are rare.

## Workflow

1. **Load credentials** from `.env` (never hardcode):

   ```bash
   URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env | cut -d= -f2)
   KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env | cut -d= -f2)
   ```

   The service-role key bypasses RLS; use it only for this admin batch work.

2. **Pick games to translate.** Fetch candidates with an `en` translation and
   no `fr` row, then filter client-side:

   ```bash
   curl -s "$URL/rest/v1/games?select=id,slug,game_translations(language_code,title,description)&order=popularity_score.desc&limit=40" \
     -H "apikey: $KEY" -H "Authorization: Bearer $KEY" > games_tmp.json
   ```

   Parse with Python: keep games where an `en` translation exists with a
   non-empty `description` and no `fr` translation. Or target known slugs:
   `slug=in.(slug-one,slug-two)`.

3. **Translate.** Translate `description` into French. Keep `title` unchanged —
   game titles are official names, identical in French. Natural, idiomatic
   French; keep IGDB terms (Nether, l'End, redstone) as in the community
   French localization.

4. **Write the payload file** with Python, UTF-8 (Windows console is cp1252):

   ```python
   import json
   rows = [{"game_id": "...", "language_code": "fr",
            "title": "...", "description": "..."}]
   with open("fr_translations.json", "w", encoding="utf-8") as f:
       json.dump(rows, f, ensure_ascii=False)
   ```

5. **Upsert** (idempotent on the `UNIQUE(game_id, language_code)` constraint):

   ```bash
   curl -s -X POST "$URL/rest/v1/game_translations" \
     -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
     -H "Content-Type: application/json" \
     -H "Prefer: resolution=merge-duplicates,return=representation" \
     --data-binary @fr_translations.json
   ```

6. **Verify then clean up.** Count `fr` rows before and after:

   ```bash
   curl -s -I "$URL/rest/v1/game_translations?language_code=eq.fr&select=id" \
     -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
     -H "Prefer: count=exact" | grep -i content-range
   ```

   Expected: count grows by the number of translated games. Then remove the
   temp files (`games_tmp.json`, `fr_translations.json`) from the repo root.

## Windows gotchas

- Use `python`, not `python3` (alias not installed).
- Always `open(path, encoding='utf-8')` — default cp1252 decoding crashes on
  accented text.
- Git Bash `/tmp` is not visible to Windows Python: write temp files in the
  repo root, delete them after.
- `�` seen when printing descriptions is a console-encoding artifact; the
  database text is intact.
- Print summaries via Python, not `cat`/`echo` on UTF-8 JSON files.
