# Issue #140: Mempool rainforest, working notes and handoff

**Status: work in progress on branch `mempool-rainforest`.** `npm run build` is clean and the unit tier passes (123/123), but the page has not been opened in a browser since the rebuild: the first job of the next session is `npm test -- hub` and fixing what it finds. This file is the handoff between sessions; trim it to a short design and verification note before the PR.

Issue: https://github.com/OogaBoogaX/oogaboogaland/issues/140 (read it in full first; it is the spec). Its five images: a world screenshot, two dimensioned plans (the plans govern layout), two approximate concepts.

## Rules for whoever continues

- Read `AGENTS.md` first and follow it. Vanilla JS, classic IIFEs on `window.BL`, no dependencies, allocation-free frame loop, pooled and capped effects.
- Verification mode the maintainer (Harry) approved for this task: Node-side probes of the pure modules and `npm run test:unit` as you go, then the `hub` scene test once at the end (`npm test -- hub`). No per-edit browser runs, no screenshots. Never weaken a check.
- Every change ends with `npm run build` and `node --check` on each touched file.
- Git: the maintainer asked for this branch to be pushed to his fork (`origin` = `hotpixelgroup/oogaboogaland`). Commit and push only to `origin mempool-rainforest`. Do not commit `oogaboogaland.html` or `src/js/characters.gen.js` (build output). The PR goes to `OogaBoogaX/oogaboogaland` `rock` when the maintainer asks for it, not before.
- Do not name branches with `codex/`.

## Design decisions (settled)

- **One layout authority.** `src/js/pool-layout.js` (`BL.poolLayout`, pure math, loads in Node) defines every dimension and fills a dense voxel grid (0.5 m cells, 108 x 68 x 108) once per page. Everything else reads it.
- **Local frame.** Origin at the island centre, y = 0 at the bridge's top datum (world y about 6.27), +z toward the home island, bearing from +z toward +x (`x = r sin`, `z = r cos`). `SITE.isletR = 22` makes the existing `spot()` put the centre 67.5 m out with `bridgeLocalZ = 21`; the bridge geometry is unchanged.
- **Terraces, like the home island.** Cell tops: court and shore 0, lowland ring 0.5, forest floor and ring path 1.0, nests 1.5, ridge up to 4.5, channel beds -0.5. Oogas (step 0.6) and clankers (step 0.52) walk 0.5 m terraces today.
- **Mesh and collision.** `poolModels.islet()` runs the grid through the home island's own `BL.terrain.gridGeometry` and `compactVertices`; the same grid is its `cutawaySource`. The hub adds it to `solids` (`solid-props.js`: triangle BVH, height-aware `supportAt`, closed-mesh `inside` test), so tunnels and the chamber collide with no extra code. About 9.8k quads.
- **Smooth floors.** `poolModels.rampFloor()` is a strip of quads over the voxel steps of the descent, the two doors and the outside ledge. Its faces carry `supportOnly: true` so it is a floor only; without that flag everything beneath a sheet counts as inside rock.
- **Lake and chamber.** A hole r < 8 through the ground opens onto `membrane` (cosine bowl, 0 at the rim, -4 at the centre; drawn with `geometry.glass`, collides as a thin closed shell). Chamber r < 12, floor -10, stepped dome roof; shaft r < 4 through the underside. Four flat "reading stops" on the chamber wall at bearings 0, 90, 180, 270 (`L.STOPS`) are for the paintings.
- **Descent.** r = 16, 5 m wide (6 m in three bays), 3.5 m headroom, 100 m, 10% grade, starting at bearing 22 degrees beside the bridge court under a ridge that keeps 1 m of roof on it. A ledge runs down the outside of the cliff beside it to doors at -3 and -5; a window overlooks the chamber at 75%.
- **Water** (`src/js/pool-water.js`, `BL.poolWater`). Level from `snapshot.vsize` through `HYDRO.POINTS` (0 vB -> -3, 20 MvB -> -1, 60 MvB -> 0 spill crest, 200 MvB -> +0.6); bounded easing; three display stages with hysteresis. Lake surface is a unit glass disc scaled to `L.waterRadius(level)`; the flood is one flat glass sheet at the level, hidden by depth wherever a terrace stands higher. Falls are Bifrost-style stacks of metre pieces animated by `node.glow`. Block cube: two pooled sequences, queue of three, about 8 s in the chamber, then down to the sea. Do not use `face.water` (opaque, wrong from below, absent on Canvas).
- **Renderer facts that shaped this.** `geometry.glass` is a real alpha pass (both sides, depth-tested, no depth write, unsorted); set `castShadow = false`. Canvas 2D culls back faces, so glass sheets are built two-sided there. No per-frame vertex animation: animate with node transforms and `glow`. The hub's shadow volume does not reach the island.

## State of the tree

Done (probed in Node where the module is pure; nothing has run in a browser yet):

- `src/js/pool-layout.js` (new): complete.
- `src/js/pool-models.js`: rewritten for the new island (`islet`, `rampFloor`, `membrane`, `crossing`, `NEST_BEDS`, `wallTorch`, `VEINS`, `roots`, new `build`). Old cave pieces removed; `carve`, `carveCells`, `panelFrom`, `chainBoard`, `infoSign`, `beastRig`, `spot` kept for their other users.
- `src/js/pool-water.js` (new): complete.
- `src/js/pool-paintings.js` (new): four stops, per-category freshness, a `board` per stop for the dialog. Needs a real canvas, so it is unprobed.
- `src/js/pool-wildlife.js`: animals carry a `base` height and take `groundAt` and `spotOk` from the hub.
- `src/js/weather.js`: rain, cloud and sky now follow arriving volume (`snapshot.gale`, averaged over `STORM_TAU` 30 s, expired by `socketAt` age after `ARRIVALS_FRESH_MS` 90 s inside `update`); footprint sized to the 22 m island; `update(dt, opts, shelter)`.
- `src/js/scene-hub.js`: new `buildMempoolIsland` (placement, solids, boards on the court, torches as lamps, scatter, wildlife, water, paintings; `groundAt`, `overAt`, `coveredAt`, `floatAt`); water and paintings wired into enter, update, `onChain`, `onMempool`, leave, `inMotion`, `stats`; floating support in `playerSupportAt`, `visualSupportAt`, `clankerSupportAt`, `clankerPadSupportAt`; `navigate("mempool")`; area label; clanker admission; cloud keep-out; `belowHome` in `clampCamera`; pool-aware `subterranean`, cut height and `birdsEyeCeiling`; voice zone `cave-mempool`; daylight dimmed and weather sheltered when the camera target is under the island's ground; weather key board rewritten with a lake page.
- `src/js/crew.js`: the HQ exit route on release only starts over the home island (`ctx.underHome`).
- `scene-pool.js` deleted; `index.html` script tags and pool sections updated; `routes.js` `mempool` -> `scene: "hub", place: "mempool"`; `scripts/cards.mjs` keys its live set on the route path.

Probe results: every route walks with the real collision code (bridge -> court -> mouth -> 100 m ramp -> chamber and back, ledge -> both doors, full ring path for an Ooga and a gorilla-sized body, every nest, chamber ring, ridge top); membrane holds; water levels, flood stages, falls and the cube sequence behave.

## Remaining work, in order

1. **Boot it.** `npm test -- hub` will fail first on the retired scene: fix `test/run.mjs` (remove `pool` from the scene list near L2349, `hubRoutes` L3510-3519 taps the removed `poolstair`, `poolLeave` L3626-3631, `hubMirror` L3651 uses `B.go("pool")` as its short trip and needs another, `canvasTour` L3657 lists `pool`, the `scene("pool", ...)` registrations near L7167 and L7268, the rainforest bridge check L3469-3507 uses `SITE.span`). Then fix whatever the hub boot throws. Check boot time with `__ooga.timing` against `BOOT_MEDIUM`.
2. **Clanker sleep** (not started). `clankers.js` hide gate at about L5765, `alive()` at L90, `recoverStall` at L6005, `resumeEntry` at L4754; `npc-sync.js` record offsets 101-111 are free (bump `FORMAT`). Use `BL.contributors.stateFor(cave.contributor)` and skip `cave.remoteControlled` placeholders. Reserve one of `L.SLOTS` (20 places, 4 per nest, ordered so a short roster spreads over all five nests) by a stateless seeded choice (`fnv1a` of the name plus a replicated value), walk hub -> approach stair -> bridge -> court -> ring path -> nest (no planner reaches the island today: give it fixed waypoints), lie with the existing lounge poses ("left", "right", "back"), `fx.zzzAt(x, y, z, null)`, wake and return when the Ooga does. Possession wins and wakes it. Release the workstation and lab item first (pattern at L5808-5831 and in `debugMove` L2703). `recoverStall` teleports a still clanker in phase "chill" off non-grass after 8 s: use a new phase. Add debug hooks on the `poolIsland` handle for sleep/wake, low water, flood and a block (`water.preview(vB)`, `water.block()` exist).
3. **Swim pose** (optional, minimal): `mempoolIsland.afloat(x, z, y, draught)` exists for it.
4. **Docs and text:** AGENTS.md (module table rows for the new files, load order, routes list, the `pool` scene rows in the testing tables, the weather mapping), README lines that name the cave, the stair or the old weather mapping, `chain.js` header comments, the director's feed panel wording (`director.js` about L465).
5. **Tests:** update `weatherStepChecks` wording (it names soak), add a Node rule check for `poolWater.levelFor` monotonicity and for the layout routes if wanted (extend, do not duplicate).
6. **Finish:** `npm run build`, `node --check` on every touched file, `npm run test:unit`, `npm test -- hub`.

## Probe loader

Probes live in the ignored `untracked/issue-140/` on the original machine. To recreate: run the classic scripts in one `vm` context with a `window` stub, in index.html order.

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

## Known limits to report in the PR

- Tunnel walls are voxel (the island's style); only the floors are smooth.
- Rain lands on the ground and the water, not on tree crowns.
- At low water the membrane's rim is a transparent bank that walkers stand on.
- The tunnel network is the descent plus the ledge and its two doors; the plan's A/B links are not built.
