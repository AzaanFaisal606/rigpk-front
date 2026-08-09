/**
 * TypeScript twin of `db/tokenize.py` in the backend repo.
 *
 * Both are asserted against `tests/fixtures/tokenizer_cases.json`, so the
 * client index and the server's `name_norm` column always agree on what a
 * query means. Change one, change both, or a test fails.
 */

/** Cap on tokens per query — mirrors MAX_SEARCH_TOKENS in db/tokenize.py. */
export const MAX_SEARCH_TOKENS = 8;

// Split on runs of non-alphanumerics, and at letter<->digit boundaries where
// the alphabetic side is two or more letters. Mirrors _SPLIT_RE in
// db/tokenize.py exactly — see that file for why the two-letter minimum is
// load-bearing ("i5" must not become ["i", "5"]).
const SPLIT_RE = /[^0-9a-z]+|(?<=[0-9])(?=[a-z]{2})|(?<=[a-z]{2})(?=[0-9])/g;

function split(text: string): string[] {
  return text.toLowerCase().split(SPLIT_RE).filter(Boolean);
}

/** Split a user query into deduplicated, order-preserving, capped tokens. */
export function searchTokens(q: string): string[] {
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const raw of split(q)) {
    if (seen.has(raw)) continue;
    seen.add(raw);
    tokens.push(raw);
    if (tokens.length >= MAX_SEARCH_TOKENS) break;
  }
  return tokens;
}

/** Tokenizer hook for MiniSearch — it wants every token, uncapped and undeduped. */
export function indexTokens(text: string): string[] {
  return split(text);
}
