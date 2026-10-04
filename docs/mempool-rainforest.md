# Issue #140: Mempool rainforest, working notes and handoff

**Status: feature-complete draft on branch `mempool-rainforest`, not yet play-tested by a person.** The build is clean, the unit tier passes (124/124) and the `hub` scene passes all but one session, which is a timeout and not an assertion (see Verification). Nothing here has been looked at on screen: the first job of whoever continues is to play it and tune it. Trim this file to a short design and verification note before the PR.

Issue: https://github.com/OogaBoogaX/oogaboogaland/issues/140 (read it in full; it is the spec). Its five images are a world screenshot, two dimensioned plans (the plans govern layout) and two approximate concepts.

## Rules for whoever continues

- Read `AGENTS.md` first and follow it. Vanilla JS, classic IIFEs on `window.BL`, no dependencies, allocation-free frame loop, pooled and capped effects.
- Verification the maintainer (Harry) approved for this task: Node probes of the pure modules and `npm run test:unit` as you go, then `npm test -- hub` at the end. No per-edit browser runs. Never weaken a check. On a busy machine run it as `LANES=3 npm test -- hub`.
- Every change ends with `npm run build` and `node --check` on each touched file.
- Git: push only to the maintainer's fork (`origin` = `hotpixelgroup/oogaboogaland`), branch `mempool-rainforest`. Commits are authored as the maintainer with **no AI attribution anywhere**: no `Co-Authored-By` trailer, no "generated with" line, in commits, PRs, issues or comments. Never commit `oogaboogaland.html` or `src/js/characters.gen.js` (build output). The PR goes to `OogaBoogaX/oogaboogaland` `rock` only when he asks.
- Do not name branches with `codex/`.

## What is built

- **`src/js/pool-layout.js`** (new, pure, loads in Node): the one layout. Local frame: origin at the island centre, y = 0 at the bridge's top datum (world y about 6.27), +z toward the home island, a bearing from +z toward +x. `SITE.isletR = 22` puts the centre 67.5 m out through the unchanged `spot()`. Terraces half a metre apart: court and shore 0, lowland ring 0.5, forest floor and ring path 1.0, nests 1.5, ridge to 4.5, channel beds -0.5. Lake hole r < 8 over a cosine membrane (0 at the rim, -4 at the centre), chamber r < 12 at floor -10 with four flat reading stops, shaft r < 4 through the underside, descent at r = 16 (5 m wide, 6 m in three bays, 3.5 m headroom, 100 m, 10%) from bearing 22 degrees under a ridge, an outside ledge to doors at -3 and -5, a window over the chamber at 75%. `body()` fills a 108 x 68 x 108 grid of 0.5 m cells once a page.
- **`src/js/pool-models.js`**: `islet` (the grid through the home island's `terrain.gridGeometry` and `compactVertices`; the grid is also its `cutawaySource`; about 9.8k quads), `rampFloor` (smooth floors, `supportOnly` faces), `membrane` (glass; collides as a thin closed shell), `crossing`, `NEST_BEDS`, `wallTorch`, `VEINS`, `roots`, new `build`. Old cave pieces removed.
- **`src/js/pool-water.js`** (new): level from `snapshot.vsize` through `HYDRO.POINTS`; bounded easing; three stages with hysteresis; lake disc, flood sheet, falls, veins, block cube (two pooled sequences, queue of three).
- **`src/js/pool-paintings.js`** (new): four wall paintings with per-category freshness and a dialog board each.
- **`src/js/weather.js`**: rain, cloud and sky follow arriving volume; smoothing, expiry by socket age, a footprint for the larger island, shelter under its ground.
- **`src/js/clankers.js`**: the sleep lifecycle (`updateSleep`, `updateWake`, `reserveBed`): a gorilla whose Ooga sleeps reserves a bed, walks hub -> approach stair -> bridge -> court -> ring path -> nest, lies down, breathes and marks sleep, and walks home when its Ooga wakes. Sleepers found asleep at page entry are placed in bed. Possession wakes it; release while its Ooga sleeps walks it back.
- **`src/js/scene-hub.js`**: new `buildMempoolIsland` and its handle (`groundAt`, `overAt`, `coveredAt`, `floatAt`, `water`, `paintings`, `layout`, `preview`); floating support for Oogas and gorillas; `navigate("mempool")`; pool-aware camera (`belowHome`), cutaway and voice zone (`cave-mempool`); daylight dimmed and weather sheltered underground; the weather key board rewritten with a lake page; `clankerBeds()` (beds and paths).
- **`src/js/crew.js`**: the HQ exit route on release starts only over the home island (`ctx.underHome`).
- **Retired:** `scene-pool.js`; `/mempool` is now `scene: "hub", place: "mempool"`. `index.html`, `routes.js`, `scripts/cards.mjs`, `AGENTS.md`, `README.md`, `chain.js` comments and the director's feed panel updated to match.
- **Tests (`test/run.mjs`):** pool scene registrations removed; `hubRoutes` now walks an Ooga down the whole descent into the chamber; a Node rule check `pool layout`; `weather steps` reworded.

## Tuning constants chosen

| Constant | Value | Where |
|---|---|---|
| Lake level points | 0 vB -> -3 m, 20 MvB -> -1 m, 60 MvB -> 0 m (spill crest), 200 MvB -> +0.6 m | `poolWater.HYDRO.POINTS` |
| Level easing | 5 s time constant, at most 0.16 m/s | `HYDRO.EASE`, `HYDRO.RATE` |
| Flood stage hysteresis | shore on at +0.04, off at -0.04; lowland on at +0.54, off at +0.46 | `HYDRO.STAGE` |
| Backlog reading counts as live for | 120 s | `HYDRO.FRESH_MS` |
| Storm average, arrivals expiry | 30 s, 90 s | `weather.STORM_TAU`, `ARRIVALS_FRESH_MS` |
| Rain field, cloud deck, strike range | 25 m, 34 m, 21 m | `weather.js` |
| Cube sequence | gather 1.6 s, bulge 1.7 s, hang 1.5 s, slow fall 3.2 s, then to the sea | `poolWater.CUBE` |
| Float draught | Ooga 0.55 x body height, gorilla 0.9 m | `scene-hub.js` |
| Beds | 20 (4 on each of 5 nests) for a roster of 16 | `poolLayout.SLOTS` |
| Sleep trip stall fallback | 25 s | `clankers.js` `SLEEP_STALL` |

## Verification actually performed

- `npm run build` clean; `node --check` on every touched file.
- `npm run test:unit`: 124/124.
- Node probes with the real collision code (`solid-props.js`): bridge -> court -> mouth -> 100 m descent -> chamber and back, ledge -> both doors -> descent, the full ring path for an Ooga and a gorilla-sized body, every nest, the chamber ring and the ridge top all walk; the membrane holds; water levels, flood stages, falls and the cube sequence behave.
- Headless Chrome probes: the hub boots with no console errors; boot is about 350 ms slower than `rock` on an M1 Pro (5.5 s against 5.15 s to ready; `rock` already starts at medium quality on that machine); frame cost with a driven Ooga matches `rock`. Nine sleepers are placed in beds at entry; a working clanker put to sleep leaves its cave and reaches its bed in 42 s with no stall; a sleeper woken walks home in 20 s.
- `LANES=3 npm test -- hub`: 266/267. The one failure is the `birds-eye lower floors` session: "Runtime.evaluate got no reply in 90 s". On unchanged `rock` on the same machine that session passes but takes 88 s against the 90 s limit, so the extra nodes tip it over. It failed two runs in a row, so the runner says STOP: it is handed to the maintainer, not retried. No assertion failed.
- Not done: any look at the screen, the perf lane, Canvas 2D beyond the `hub canvas2d` session, a phone, multiplayer with two pages.

## Known limits and things to play-test

1. **Never seen on screen.** Colours, forest density, torch light, the glass alphas (membrane 0.3, water 0.5), painting size and glow, and the cube's look are all first guesses.
2. A gorilla that starts its sleep trip **on a roof** does not climb down for it: after the 25 s stall it is placed in its bed. From the ground or a cave the trip is walked.
3. **Beds are chosen per page**, not replicated: a seeded choice among free beds in the least full nests. Two signed-in pages can show the same gorilla in different beds. `npc-sync.js` record offsets 101-111 are free for a bed index (bump `FORMAT`) if that matters.
4. Tunnel **walls are voxel**, like the rest of the island; only the floors are smooth.
5. The tunnel network is the descent, the ledge and its two doors, and the window. The plan's A/B links are not built.
6. At low water the membrane's rim is a **transparent bank** that walkers stand on.
7. Rain lands on the ground and the water, not on tree crowns.
8. There is **no swim pose**: a floating body keeps its walking pose. `mempoolIsland.afloat(...)` exists for one.
9. Outlines and the rock cover cap (`rock-guides`, `camera-cover`) still know only the home island. Underground on this island the close camera collides with the rock and birds-eye and orbit views cut the roof away; there is no x-ray outline.
10. The epoch painting says its age is unknown, because the snapshot has no stamp for it.
11. The `mempool` preview card (`npm run cards`) has not been retaken.

## Previews (under `?debug=1`)

```js
__ooga.poolIsland.preview.lake(130)   // stand the lake at 130 MvB (floods); lake(null) hands it back to the feed
__ooga.poolIsland.preview.block()     // a block: the bolt and the cube
__ooga.poolIsland.preview.sleep("portlandhodl", true)   // put an Ooga to sleep: its gorilla walks to bed; false wakes it
```

`?debug=1&view=mempool` arrives in the chamber.

## Probe loader

Probes live in the ignored `untracked/issue-140/` on the original machine. To recreate one, run the classic scripts in a `vm` context with a `window` stub, in `index.html` order:

```js
import { readFileSync } from "node:fs";
import { runInContext, createContext } from "node:vm";
export const load = (files) => {
  const window = { BL: {}, matchMedia: () => ({ matches: false }), addEventListener() {} };
  window.window = window;
  const ctx = createContext({ window, console, performance, Math, Float32Array, Float64Array, Uint8Array, Uint32Array, Int16Array, Int32Array, Uint16Array, Map, Set, WeakMap, Object, Array, Number, String, JSON, Date, Infinity, NaN, isFinite, parseInt, parseFloat, crypto: globalThis.crypto, document: { createElement: () => ({ getContext: () => null }) }, navigator: {}, localStorage: { getItem: () => null, setItem() {} }, setTimeout, clearTimeout });
  for (const f of files) runInContext(readFileSync(`src/js/${f}.js`, "utf8"), ctx, { filename: f + ".js" });
  return window.BL;
};
// e.g. load(["math", "scene", "models", "convex", "terrain", "hub-models", "pool-layout", "pool-models", "pool-water", "solid-props"])
```
