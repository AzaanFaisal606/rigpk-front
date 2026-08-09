import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { searchTokens, MAX_SEARCH_TOKENS } from "@/lib/search-tokenize";

// The fixture lives in the BACKEND repo. Both tokenizers are asserted against
// the same file, so a divergence fails CI on one side or the other.
const FIXTURE = path.resolve(__dirname, "../../../tests/fixtures/tokenizer_cases.json");
const cases: { input: string; expected: string[] }[] =
  JSON.parse(readFileSync(FIXTURE, "utf-8"));

describe("searchTokens", () => {
  it("has fixture cases to assert", () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  for (const c of cases) {
    it(`tokenizes ${JSON.stringify(c.input)}`, () => {
      expect(searchTokens(c.input)).toEqual(c.expected);
    });
  }

  it("caps at MAX_SEARCH_TOKENS", () => {
    const many = Array.from({ length: 50 }, (_, i) => String(i)).join(" ");
    expect(searchTokens(many)).toHaveLength(MAX_SEARCH_TOKENS);
  });
});
