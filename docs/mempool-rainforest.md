# Issue #140: Mempool rainforest, working notes and handoff

**Status: feature-complete draft on branch `mempool-rainforest`.** The build is clean, the unit tier passes (125/125) and the `hub` scene's last full run passed 266 of 268 checks: one is a time limit and one passed when its session was run again, both described under Verification. It has been looked at in headless screenshots and driven by probes, never played by a person: the first job of whoever continues is to play it and tune it. Trim this file to a short design and verification note before the PR.

Issue: https://github.com/OogaBoogaX/oogaboogaland/issues/140 (read it in full; it is the spec). Its five images are a world screenshot, two dimensioned plans (the plans govern layout) and two approximate concepts.

## Rules for whoever continues

- Read `AGENTS.md` first and follow it. Vanilla JS, classic IIFEs on `window.BL`, no dependencies, allocation-free frame loop, pooled and capped effects.
- Verification the maintainer (Harry) approved for this task: Node probes of the pure modules and `npm run test:unit` as you go, then `npm test -- hub` at the end. No per-edit browser runs. Never weaken a check. On a busy machine run it as `LANES=3 npm test -- hub`.
- Every change ends with `npm run build` and `node --check` on each touched file.
- Git: push only to the maintainer's fork (`origin` = `hotpixelgroup/oogaboogaland`), branch `mempool-rainforest`. Commits are authored as the maintainer with **no AI attribution anywhere**: no `Co-Authored-By` trailer, no "generated with" line, in commits, PRs, issues or comments. Never commit `oogaboogaland.html` or `src/js/characters.gen.js` (build output). The PR goes to `OogaBoogaX/oogaboogaland` `rock` only when he asks.
- Do not name branches with `codex/`.

## What is built

- **`src/js/pool-layout.js`** (new, pure, loads in Node): the one layout. Local frame: origin at the island centre, y = 0 at the bridge's top datum (world y about 6.27), +z toward the home island, a bearing from +z toward +x. `SITE.isletR = 22` puts the centre 67.5 m out through the unchanged `spot()`. Terraces half a metre apart: court and shore 0, lowland ring 0.5, forest floor and ring path 1.0, nests 1.5, ridge to 4.5, channel beds -0.5. Lake hole r < 8 over a cosine membrane (0 at the rim, -4 at the centre), chamber r < 12 at floor -10 with four flat reading stops, shaft r < 4 through the underside, descent at r = 16 (5 m wide, 6 m in three bays, 3.5 m headroom, 100 m, 10%) from bearing 22 degrees under a ridge, an outside ledge to doors at -3 and -5, a window over the chamber at 75%. `body()` fills a 108 x 68 x 108 grid of 0.5 m cells once a page.
- **`src/js/pool-models.js`**: `islet` (the grid through the home island's `terrain.gridGeometry` and `compactVertices`; the grid is also its `cutawaySource`; about 9.9k quads; the wall behind each painting is cut into metre squares of twin tones, same colour under a second material number, so the Canvas 2D renderer can sort the paint against it), `rampFloor` (smooth floors, `supportOnly` faces), `chamberBacking` (171 quads a little inside the rock behind the chamber's floor, wall and roof, so the pinholes where the mesher's faces meet at a T show dark rock and not the sky; it is clipped by the cut-away like everything else and drawn first on Canvas 2D), `membrane` (glass; collides as a thin closed shell), `crossing`, `NEST_BEDS`, `wallTorch`, `VEINS`, `roots`, new `build`. Old cave pieces removed.
- **`src/js/pool-water.js`** (new): level from `snapshot.vsize` through `HYDRO.POINTS`; bounded easing; three stages with hysteresis; lake disc, flood sheet, falls, veins, block cube (two pooled sequences, queue of three).
- **`src/js/pool-paintings.js`** (new): four wall paintings with per-category freshness and a dialog board each.
- **`src/js/weather.js`**: rain, cloud and sky follow arriving volume; smoothing, expiry by socket age, a footprint for the larger island, shelter under its ground.
- **`src/js/clankers.js`**: the sleep lifecycle (`updateSleep`, `updateWake`, `reserveBed`): a gorilla whose Ooga sleeps reserves a bed, walks hub -> approach stair -> bridge -> court -> ring path -> nest, lies down, breathes and marks sleep, and walks home when its Ooga wakes. Sleepers found asleep at page entry are placed in bed. Possession wakes it; release while its Ooga sleeps walks it back. Sleep follows `crew.stateOf(cave)` (the override, else the contribution age), not the momentary `cave.state`, which flips when a sleeper stirs for a donation or a fire: keyed to that, every gorilla commuted over the bridge at each donation. A sleeper inside the lab frees its bench at once and then walks out; the walk home ends in the meadow below the approach stair, not at the bridge's head.
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
| Bed choice | dealt once a UTC day by `fnv1a` of day, name and bed, in roster order | `clankers.js` `bedsToday` |
| Sleep trip stall fallback | 25 s | `clankers.js` `SLEEP_STALL` |

## Verification actually performed

- `npm run build` clean; `node --check` on every touched file.
- `npm run test:unit`: 125/125, including two new rule checks: `pool layout` (the descent's grade, headroom and roof; beds above the flood and apart; the lake inside its membrane) and `pool water` (the level scale, flood stages, stale hold, the cube queue).
- Node probes with the real collision code (`solid-props.js`): bridge -> court -> mouth -> 100 m descent -> chamber and back, ledge -> both doors -> descent, the full ring path for an Ooga and a gorilla-sized body, every nest, the chamber ring, the ridge top and out of the lake's bowl in four directions all walk; the membrane holds.
- Headless Chrome probes and screenshots (M1 Pro, busy machine):
  - The hub boots with no console errors, about 350 ms slower than `rock` (5.5 s against 5.15 s to ready; `rock` already starts at medium quality there).
  - Views checked by eye: overview, court and signs, ring path and a nest, a tunnel with torch, veins and a door, the chamber with membrane and cube, all four paintings with the issue's snapshot values, a full flood with falls, a downpour from the bridge, an Ooga floating.
  - `?view=mempool` arrives on the chamber floor facing the first painting; the area label reads MEMPOOL.
  - An Ooga in the lake floats with feet at level minus draught, treads water, and walks out to the ring path in a second.
  - A gorilla's support in the lake is level minus 0.9 m from above and at float, one step of lift from the bed, the chamber floor under the lake, and the shore at its own height.
  - Nine sleepers are in beds at entry. A working gorilla put to sleep leaves its cave and reaches its bed in 42 s; one on a roof climbs down and arrives in 46 s; a sleeper woken walks home in 20 s; a sleeper possessed keeps its bed and, released, goes back to it.
  - A tap on a painting opens its board.
  - From the chamber, an Ooga floating in the lake at 45 MvB shows through the skin and the water, with the clouds and the canopy behind it; from above, the bowl and the paintings below show through the lake.
- `LANES=3 npm test -- hub`, last full run (on the latest commit, after a restart of the machine): **266/268**.
  - **`birds-eye lower floors`** fails every run here: "Runtime.evaluate got no reply in 90 s", no assertion. On unchanged `rock` on the same machine that session passes in 88 s against the 90 s limit; a birds-eye frame in the HQ basement profiles about 3.5% slower with the island (more nodes to walk), which is enough. It has printed STOP, so it is handed to the maintainer with `untracked/test-ledger.json`; it wants a run on a machine with headroom, not a change. `birds-eye combat camera` sits near its 120 s session limit for the same reason and passes on retry.
  - **`work movement cave trips`** failed once in that run: of five workers on the home island, one (portlandhodl) made a single avoidance hop (`jumps: 1`, a 0.28 m step) where the check allows none. Nothing changed since the runs it passed in touches walking (the changes were colours, a depth bias and a hidden backing mesh), and its session run again alone (`ONLY="work movement cave trips" LANES=3 npm test -- hub`) passed. The crew draws some choices from the crypto dice, so trips differ run to run; treat it as intermittent and watch it. It passed in the seven full runs before.
  - The run before that one was lost to the machine: Chrome hung in every session (driver timeouts, no assertion), as it then did on `rock`'s own page, until the machine was restarted. Those timeouts cleared in the run above.
- Fixed during the session after the suite caught them: `rainforest approach` (gorillas commuting over the bridge at each donation), `lab work` (its sleeper now frees its bench at once; the check counts coworkers and no longer the gorilla walking out to bed).
- Canvas 2D (`?canvas2d=1`), in screenshots: the court and the flooded lake, the chamber with the lake seen through the membrane, and all of a painting's rows in front of its wall (the paintings carry `depthBias` and their walls are cut small for that renderer's depth sort).
- Not done: a person playing it, the perf lane, a phone, two signed-in pages together.

## Known limits and things to play-test

1. **Seen only in headless screenshots** (the overview, the court, the ring path, a nest, a tunnel, the chamber, the paintings with the issue's snapshot values, a flood, a storm, the cube), never played by a person. Colours, forest density, torch light and the glass alphas (membrane 0.18, water 0.5) have had one pass. The lake's skin is one near-clear tone in faint rings with a pale rim, and its surface three close blues (`poolWater` `CALM`), so the chamber looks up through water at the sky, the canopy and whoever floats there, not at a checkerboard; the falls, veins and cube keep the full Bifrost palette.
2. A gorilla that starts its sleep trip on high ground climbs or hops down and walks; where it cannot find a way within 25 s (one roof in the probes) it is placed in its bed.
3. **Beds are not sent over the network**, and do not need to be: each day's beds are dealt from the roster's names alone (`bedsToday` in `clankers.js`), so every page computes the same bed for the same gorilla. Two pages can still differ for a moment around midnight UTC, or in where a gorilla is along its walk, since each page walks its own gorillas as it always has.
4. Tunnel **walls are voxel**, like the rest of the island; only the floors are smooth.
5. The tunnel network is the descent, the ledge and its two doors, and the window. The plan's A/B links are not built.
6. At low water the membrane's rim is a **transparent bank** that walkers stand on.
7. Rain lands on the ground and the water, not on tree crowns.
8. The swim pose is minimal: a floating Ooga treads water with its arms out (`floatPose` in `scene-hub.js`, local, crew and remote bodies alike). Gorillas keep their walking pose.
9. Outlines and the rock cover cap (`rock-guides`, `camera-cover`) still know only the home island. Underground on this island the close camera collides with the rock and birds-eye and orbit views cut the roof away; there is no x-ray outline.
10. The epoch painting says its age is unknown, because the snapshot has no stamp for it.
11. The `mempool` preview card was retaken (`npm run cards`, keeping only `cards/mempool.jpg`): the chamber's WAITING painting with that moment's live readings. Its route keeps the feeds on, so the simulator's donation toast happened to be in frame; retake it or replace it with hand-made art if that matters.

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
