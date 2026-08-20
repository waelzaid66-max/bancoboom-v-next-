import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const search = read("app/(tabs)/search.tsx");
const discover = read("components/SearchDiscover.tsx");
const component = read("components/search/RecentSearchChips.tsx");
const policy = read("lib/recentSearchPolicy.ts");
const pkg = JSON.parse(read("package.json"));

test("recent-search data remains owned by SessionContext and SearchScreen", () => {
  assert.match(search, /\brecentQueries\b/);
  assert.match(search, /\brecordQuery\b/);
  assert.match(search, /const commitQueryNow = useCallback/);
  assert.match(search, /recordQuery\(q\)/);
});

test("visibility policy is bounded to explicit default-search engagement", () => {
  assert.match(policy, /viewState === "discover"/);
  assert.match(policy, /searchEngaged/);
  assert.match(policy, /recentQueries\.length > 0/);
  assert.match(policy, /draftQuery\.trim\(\)\.length === 0/);
  assert.match(policy, /!showSuggestions/);
});

test("recent-search chrome is presentation-only and capped", () => {
  assert.match(component, /MAX_VISIBLE_RECENTS = 5/);
  assert.match(component, /t\("search\.recent"\)/);
  assert.match(component, /onSelect\(query\)/);
  assert.doesNotMatch(component, /useSession/);
  assert.doesNotMatch(component, /router\.|useRouter|useLocalSearchParams/);
  assert.doesNotMatch(component, /saveSearch|applySaved|recordQuery/);
});

test("SearchScreen replays recents through the existing commitQueryNow authority", () => {
  assert.match(search, /from "@\/components\/search\/RecentSearchChips"/);
  assert.match(search, /from "@\/lib\/recentSearchPolicy"/);
  assert.match(search, /const \[searchEngaged, setSearchEngaged\] = useState\(false\)/);
  assert.match(search, /shouldShowRecentSearches\(\{[\s\S]*viewState,/);
  assert.match(search, /setDraftQuery\(query\)/);
  assert.match(search, /commitQueryNow\(query\)/);
  assert.match(search, /<RecentSearchChips[\s\S]*queries=\{recentQueries\}[\s\S]*onSelect=\{handleRecentSearchTap\}/);
});

test("Discover and Saved Search authorities remain untouched", () => {
  assert.match(search, /<SearchDiscover onExploreMap=\{exploreOnMap\} \/>/);
  assert.doesNotMatch(discover, /RecentSearchChips|recentSearchPolicy/);
  assert.doesNotMatch(search, /const applySaved\s*=/);
  assert.match(search, /parseMobileSearchNavParams/);
  assert.match(search, /hasIncomingSearchNavParams/);
});

test("guard is wired into the aggregate mobile test chain", () => {
  assert.equal(
    pkg.scripts["test:recent-search-chrome"],
    "node --test tests/recent-search-chrome-guard.test.mjs",
  );
  assert.match(pkg.scripts.test, /pnpm run test:recent-search-chrome/);
});
