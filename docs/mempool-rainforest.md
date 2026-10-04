# Issue #140: Mempool rainforest, working notes and handoff

**Status: work in progress on branch `mempool-rainforest`. The page does not boot at this commit** (see "State of the tree"). This file is the handoff between sessions; trim it to a short design and verification note before the PR.

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

Done and probed in Node:

- `src/js/pool-layout.js` (new): complete.
- `src/js/pool-models.js`: rewritten for the new island (`islet`, `rampFloor`, `membrane`, `crossing`, `NEST_BEDS`, `wallTorch`, `VEINS`, `roots`, new `build`). Old cave pieces removed. `carve`, `carveCells`, `panelFrom`, `chainBoard`, `infoSign`, `beastRig`, `spot` kept for their other users.
- `src/js/pool-water.js` (new): complete.
- `src/js/pool-wildlife.js`: animals now carry a `base` height and take `groundAt` and `spotOk` from the hub.
- `src/js/scene-hub.js`: `buildMempoolIsland` replaced (placement, solids, boards on the court, torches as lamps, dense scatter, wildlife, water, paintings handles, `groundAt`, `overAt`, `coveredAt`, `floatAt`, `afloat`).

Probe results so far: every route walks with the real collision code (bridge -> court -> mouth -> 100 m ramp -> chamber and back, ledge -> both doors, full ring path for an Ooga and a gorilla-sized body, every nest, chamber ring, ridge top); membrane holds; water levels, flood stages, falls and the cube sequence behave.

**Broken right now:**

1. `scene-hub.js` calls `BL.poolPaintings.create(...)`, which does not exist yet.
2. `src/index.html` has no script tags for `pool-layout.js` (before `pool-models.js`), `pool-water.js` and `pool-paintings.js` (after `pool-models.js`, before `scene-hub.js`), and still loads `scene-pool.js`.
3. The rest of `scene-hub.js` still refers to removed things: `site.stair`, `S.shaftR`, `presets.pool`, the `poolstair` prop and `enterScene(presets.pool, "pool")`, `poolModels.SITE.isletR` in the area label, the old disk in `clankerSatelliteLandAt`, `isletR` in `buildCloudObstacles`.
4. `npm run build` has not been run since these edits.

## Remaining work, in order

1. **`src/js/pool-paintings.js`** (`BL.poolPaintings.create({ site, renderer })` -> `{ stops, refresh(snapshot, now, water), update(dt), dispose() }`). One flat panel per `L.STOPS` bearing on the wall face at local along = 12.0 (place it at 11.97), from the jumbotron 5x7 font via `poolModels.panelFrom` with no backing (pigment only: ochre, red earth, charcoal, bone). Rows and bindings are in the issue section 11; minimum: WAITING `count` TX, BACKLOG `vsize / 1e6` MvB, BLOCKS DEEP `deep` (say "ABOUT"), BLOCK `height`, BLOCK TX `lastTxCount`, the five fee tiers in SAT/VB, epoch `progressPercent`. Per-field freshness from `backlogAt`, `feesAt`, `heightAt`, `priceAt` (0 = not observed this session; a restored value is "held"); epoch and hashrate have no stamp, so say the age is unknown. Stale reads stale, a real zero stays zero. Rebuild a panel only when its printed string changes and `renderer.releaseGeometry` the old one. `panelFrom` faces are emissive 0.85: keep `node.glow` about 0.35 for matte pigment and pulse it on fresh data. Each stop is a `poolpainting` prop that opens the shared board dialog (`hud.openBoard`).
2. **Hub wiring** in `scene-hub.js`: create/apply/update/dispose `mempoolIsland.water` and `.paintings` (enter near L8330, `update` near L6368, `onChain`, `onMempool` -> `water.block()` beside `weather.strike()`, `leave` near L9124, `inMotion`, `stats`); replace the `poolstair`/`poolsign` tap with a toast or a walk hint; `PROP_TIPS`/`RETICLE_PROPS`; area label through `overAt`/`coveredAt` ("RAINFOREST" above, "MEMPOOL" below); `clankerSatelliteLandAt` through `L.onIsland`; `buildCloudObstacles` through `S.reach` and `S.isletDepth`; weather `heightAt: mempoolIsland.groundAt`.
3. **Floating.** Add `mempoolIsland.floatAt(x, z, from, rise, draught)` into `playerSupportAt` (about L3134) and the clanker support (`clankerSupportAt`, about L7274). Draught per rig, not one constant: about 0.55 x `bodyHeight` for an Ooga, about 0.9 m for a gorilla on all fours. No new controls; a small arm pose is optional.
4. **Underground gating.** World-height checks assume the home island: `subterranean` in `updateBirdsEyeCutaway` (about L3850), `birdsEyeCeiling` (L3736), `clampCamera` (about L6044 and L6063), and `crew.js` L2759 and L5207 (they start an HQ bed route for any feet below -0.5). Gate each to the home island's footprint; for the pool island use `coveredAt` and `solids.ceilingAt` so birds-eye and orbit views cut the roof above a walker in the tunnels. Dim `RENDER_OPTS.directStrength` when the camera target is covered there (no sun shadow reaches the island). Voice zone: `shareDrivenOoga` should send `cave-mempool` when the driven Ooga is covered there.
5. **`/mempool` route.** `routes.js`: `scene: "hub", place: "mempool"`. Add a `mempool` branch to `navigate()` (about L5633) arriving on the chamber ring at local (0, -10, 7) facing a stop, the `view=` whitelist (L25-26), and `scripts/cards.mjs` `LIVE` (keyed on scene today).
6. **Weather remap** (`weather.js`, `chain.js` comments, the hub's weather board text): rain amount, drop size, cloud deck and sky grey from arriving volume (`snapshot.inflow` / `gale`, label vB/s), wind unchanged. `inflow` is raw and `gale` is only recomputed in `derive`, so smooth it in the weather (EMA of a few tens of seconds plus the existing step hysteresis) and expire it from `snapshot.socketAt` age inside `update`, easing to calm and reporting "unavailable", never zero arrivals. Scale `FIELD_R`, `CLOUD_R`, `BOLT_RANGE`, `NEAR_*`, `HEARD_*` to the 22 m island. Attenuate sound and flash by a shelter factor when the camera target is covered. Update `weatherStepChecks` in `test/run.mjs` and the board notes.
7. **Clanker sleep** (`clankers.js` hide gate at about L5765, `alive()` at L90, `recoverStall` at L6005, `resumeEntry` at L4754; `npc-sync.js` record offsets 101-111 are free, bump `FORMAT`). Use `BL.contributors.stateFor(cave.contributor)` and skip `cave.remoteControlled` placeholders. Reserve one of `L.SLOTS` (20 places, 4 per nest, listed so a short roster spreads over all five nests) by a stateless seeded choice (`fnv1a` of the name plus a replicated value), walk hub -> approach stair -> bridge -> court -> ring path west -> nest, lie with the existing lounge poses ("left", "right", "back"), `fx.zzzAt(x, y, z, null)`, wake and return when the Ooga does. Possession wins and wakes it. Release the workstation and lab item first (pattern at L5808-5831 and in `debugMove` L2703). Add `debug` hooks on the `poolIsland` handle for sleep/wake previews.
8. **Retire `scene-pool.js`:** delete it and its script tag, `index.html` L158 and L198-204, `test/run.mjs` L2349, L3510-3519, L3626-3631, L3651, L3657, L7167, L7268 (give `hubMirror` another short trip), update AGENTS.md and README lines that name the cave, the stair or the old weather mapping.
9. **Finish:** `npm run build`, `node --check` on every touched file, `npm run test:unit`, then `npm test -- hub` once. Check boot time against `BOOT_MEDIUM` with `__ooga.timing`: the island adds roughly 100 ms (grid) + 170 ms (mesh) + 220 ms (collision tree) in Node.

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
