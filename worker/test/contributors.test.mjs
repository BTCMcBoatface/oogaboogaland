// Eligibility and identity reconciliation are authorization boundaries. No live network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { contributorRows, createContributorLookup } from "../src/contributor-policy.js";
import { missingCharacters, characterSource } from "../../scripts/sync-characters.mjs";
import { identityAdvice } from "../../scripts/contributor-pr.mjs";
import { declaredIdentity, mayAuthorIdentity } from "../../scripts/character-identity.mjs";

const NOW = Date.parse("2026-10-04T12:00:00Z");
const person = (login, extra = {}) => ({ login, counts: { commits: 1 }, first_seen_at: "2026-09-01T00:00:00Z", last_seen_at: "2026-10-04T11:00:00Z", ...extra });
const snapshot = (...rows) => ({ meta: { org: "OogaBoogaX", schema_version: 3, generated_at: new Date(NOW).toISOString() }, contributors: rows });

test("confirmed aliases roll up across stats without increasing event totals or granting the alias an identity", () => {
  const normalize = globalThis.BL.contributorIdentities.normalizeStats;
  const a = "email:bdb4923572c8ac13", b = "email:56537ddd43347582";
  const raw = snapshot(person("MrHodlX", { counts: { commits: 302 }, weekly: [{ week: "2026-W35", commits: 10 }] }),
    person(a, { counts: { commits: 4 }, weekly: [{ week: "2026-W35", commits: 4 }], type: "Bot" }),
    person(b, { counts: { commits: 1 }, weekly: [{ week: "2026-W34", commits: 1 }], first_seen_at: "2026-08-25T00:00:00Z", last_seen_at: "2026-10-04T11:30:00Z" }),
    person("claude", { counts: { commits: 14 } }));
  raw.totals = { contributors: 4, commits: 321 };
  raw.leaderboards = { commits: raw.contributors.map((row) => ({ login: row.login, count: row.counts.commits })) };
  raw.repos = [{ name: "entropylab", totals: { contributors: 2, commits: 10 },
    contributors: [{ login: "MrHodlX", last_seen_at: "2026-10-04T10:00:00Z" }, { login: a, last_seen_at: "2026-10-04T11:00:00Z" }],
    leaderboards: { commits: [{ login: "MrHodlX", count: 6 }, { login: a, count: 4 }] }, weekly: [{ week: "2026-W35", commits: 10 }] }];
  raw.recent = [{ login: a, repo: "entropylab", type: "commit", occurred_at: "2026-10-04T11:00:00Z" },
    { login: a, repo: "entropylab", type: "commit", occurred_at: "2026-10-04T11:00:00Z" }];
  const before = JSON.stringify(raw), result = normalize(raw, NOW);
  const owner = result.contributors.find((row) => row.login === "MrHodlX");
  assert.equal(owner.counts.commits, 307);
  assert.deepEqual(owner.attributed_logins, [b, a].sort());
  assert.equal(owner.first_seen_at, "2026-08-25T00:00:00.000Z");
  assert.equal(owner.last_seen_at, "2026-10-04T11:30:00.000Z");
  assert.deepEqual(owner.weekly.map((row) => row.commits), [1, 14]);
  assert.equal(owner.type, undefined);
  assert.equal(result.totals.commits, 321);
  assert.equal(result.totals.contributors, 2);
  assert.equal(result.leaderboards.commits[0].count, 307);
  assert.equal(result.repos[0].leaderboards.commits[0].count, 10);
  assert.equal(result.repos[0].contributors.length, 1);
  assert.equal(result.repos[0].contributors[0].last_seen_at, "2026-10-04T11:00:00.000Z");
  assert.deepEqual(result.repos[0].weekly, raw.repos[0].weekly);
  assert.equal(result.recent.length, 2);
  assert.ok(result.recent.every((row) => row.login === "MrHodlX"));
  assert.equal(result.contributors.find((row) => row.login === "claude").counts.commits, 14);
  assert.equal(normalize(result, NOW), result);
  assert.equal(JSON.stringify(raw), before);
  assert.deepEqual(contributorRows(raw, NOW).map((row) => row.handle), ["mrhodlx"]);
  const alone = normalize(snapshot(person(a)), NOW);
  assert.equal(alone.contributors[0].login, "MrHodlX");
});

test("onboarding rejects bot aliases, unresolved identities, malformed dates and stale snapshots", () => {
  const rows = contributorRows(snapshot(person("New-Ooga"), person("NEW-OOGA"), person("robotics-human"),
    person("claude"), person("CODEX"), person("dependabot[bot]"), person("email:123"), person("../x"),
    person("machine", { type: "Bot" }), person("automation", { is_bot: true }), person("bad--login"),
    person("comments-only", { counts: { commits: 0, comments: 50, prs: 3, reviews: 2 } }),
    person("unknown-count", { counts: null }), person("string-count", { counts: { commits: "1" } }),
    person("future", { last_seen_at: "2027-01-01T00:00:00Z" }), person("no-date", { first_seen_at: null })), NOW);
  assert.deepEqual(rows.map((row) => row.handle), ["new-ooga", "robotics-human"]);
  assert.equal(rows[0].joined, Date.parse("2026-09-01T00:00:00Z") / 1000);
  assert.throws(() => contributorRows(snapshot(person("new-ooga")), NOW + 86400001));
  assert.throws(() => contributorRows({ ...snapshot(), meta: { org: "elsewhere", schema_version: 3 } }, NOW));
});

test("a just-merged custom character and its GitHub alias prevent duplicate defaults", () => {
  const existing = [{ handle: "cave-name", github: "GitHub-Owner", look: { bald: true } }, { handle: "Another" }];
  const rows = contributorRows(snapshot(person("github-owner"), person("CAVE-NAME"), person("another"), person("new-ooga")), NOW);
  const missing = missingCharacters(rows, existing);
  assert.deepEqual(missing.map((row) => row.handle), ["new-ooga"]);
  assert.equal(missingCharacters(rows, [...existing, ...missing]).length, 0);
  const collected = [];
  runInNewContext(characterSource(missing[0]), { window: { BL: { characters: { add: (row) => collected.push(row) } } } });
  assert.equal(collected[0].handle, "new-ooga");
  assert.equal(collected[0].joined, missing[0].joined);
  assert.equal(declaredIdentity(characterSource(missing[0])).handle, "new-ooga");
  assert.deepEqual(existing[0].look, { bald: true });
});

test("a single aliased profile gains github; explicit mappings and ambiguous batches are preserved", () => {
  const row = (file, handle, github) => ({ file, character: { handle, ...(github ? { github } : {}) } });
  assert.equal(identityAdvice([row("cave-name.js", "cave-name")], ["src/characters/cave-name.js"], "real-owner")[0].github, "real-owner");
  assert.equal(identityAdvice([row("Real-Owner.js", "Real-Owner")], ["src/characters/Real-Owner.js"], "real-owner")[0].mismatch, false);
  const explicit = identityAdvice([row("cave-name.js", "cave-name", "real-owner")], ["src/characters/cave-name.js"], "maintainer")[0];
  assert.equal(explicit.github, null);
  assert.equal(explicit.login, "real-owner");
  const batch = [row("one.js", "one"), row("two.js", "two")];
  assert.ok(identityAdvice(batch, batch.map((r) => `src/characters/${r.file}`), "maintainer").every((r) => r.missing));
  const occupied = [row("alias.js", "alias"), row("owner.js", "owner", "real-owner")];
  assert.equal(identityAdvice(occupied, ["src/characters/alias.js"], "real-owner")[0].missing, true);
  const maintained = identityAdvice([row("new-owner.js", "new-owner")], ["src/characters/new-owner.js"], "maintainer", true)[0];
  assert.equal(maintained.login, "new-owner");
  assert.equal(maintained.github, null);
  assert.equal(maintained.missing, false);
});

test("identity declarations are read without executing PR code and owners cannot impersonate or transfer profiles", () => {
  const source = 'throw new Error("Never execute me"); BL.characters.add({ handle: "alias", github: "owner", dress: { eyes(k, v) { return { a: 1 }; } } });';
  const identity = declaredIdentity(source);
  assert.deepEqual(identity, { handle: "alias", github: "owner" });
  assert.equal(mayAuthorIdentity("owner", identity, null, false), true);
  assert.equal(mayAuthorIdentity("attacker", identity, null, false), false);
  assert.equal(mayAuthorIdentity("maintainer", identity, null, true), true);
  assert.equal(mayAuthorIdentity("attacker", { handle: "alias", github: "attacker" }, identity, false), false);
  assert.equal(mayAuthorIdentity("owner", { handle: "new-alias", github: "owner" }, identity, false), true);
  for (const body of ['handle: "one", github: "two", github: "one"', 'handle: login', 'handle: "one", ...other', 'handle: "one", [key]: "two"', 'get handle() { return "one"; }']) {
    assert.throws(() => declaredIdentity(`BL.characters.add({ ${body} });`));
  }
  // The established custom profiles remain legal under the declarative reader.
  for (const name of readdirSync(new URL("../../src/characters/", import.meta.url)).filter((name) => name.endsWith(".js"))) {
    assert.ok(declaredIdentity(readFileSync(new URL(`../../src/characters/${name}`, import.meta.url), "utf8")).handle);
  }
});

test("signed-in lookups coalesce requests, expire without timers and fail closed on outages", async () => {
  let now = NOW, calls = 0, fail = false;
  const lookup = createContributorLookup(async () => {
    calls++;
    if (fail) throw new Error("offline");
    return new Response(JSON.stringify(snapshot(person("new-ooga"))));
  }, () => now);
  const results = await Promise.all([lookup("new-ooga"), lookup("NEW-OOGA"), lookup("visitor")]);
  assert.equal(calls, 1);
  assert.equal(results[0].handle, "new-ooga");
  assert.equal(results[1].handle, "new-ooga");
  assert.equal(results[2], null);
  now += 60001; fail = true;
  assert.equal(await lookup("new-ooga"), null);
  assert.equal(await lookup("new-ooga"), null);
  assert.equal(calls, 2);
  now += 15001; fail = false;
  assert.equal((await lookup("new-ooga")).handle, "new-ooga");
});

test("the browser accepts one matching temporary identity without reordering the bundled crew", () => {
  const context = { window: {}, URLSearchParams, location: { search: "" } };
  for (const name of ["math", "characters", "contributor-identities", "activity-repos"]) runInNewContext(readFileSync(new URL(`../../src/js/${name}.js`, import.meta.url), "utf8"), context);
  const BL = context.window.BL;
  BL.characters.add({ handle: "alias", github: "owner", joined: 1, lastCommit: 2 });
  runInNewContext(readFileSync(new URL("../../src/js/contributors.js", import.meta.url), "utf8"), context);
  const c = BL.contributors, row = { handle: "new-ooga", joined: 1, lastCommit: 2 };
  assert.equal(c.addTemporary(row, "somebody-else"), false);
  assert.equal(c.addTemporary({ ...row, handle: "owner" }, "owner"), false);
  assert.equal(c.addTemporary(row, "NEW-OOGA"), true);
  assert.equal(c.addTemporary({ ...row, handle: "second" }, "second"), false);
  assert.equal(c.roster[0].name, "alias");
  assert.equal(c.roster.length, 2);
  assert.equal(c.activeRoster[1].temporary, true);
  assert.equal(BL.characters.get("new-ooga").temporary, true);
});
