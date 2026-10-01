# Browser memory: issue #93

This implements the first render-target recommendations and compacts the completed island's retained vertex data. It addresses part of OogaBoogaX/oogaboogaland#93; lazy visibility bakes, audio loading and scene loading remain separate work.

## Changes

High quality uses 2× rather than 4× MSAA. A finite positive `navigator.deviceMemory` report of at most 8 GiB selects medium before the renderer is created, avoiding temporary high-tier targets. Missing or invalid reports retain the pointer default. The existing downward-only boot and frame governors remain active. The browser's memory signal is approximate and may be capped; a larger machine can consequently start on medium.

The completed island shares vertices with exactly identical coordinates, remaps face and line indices, and retains the result as `Float64Array`. Compaction runs once per cached island, after ramps and windows are appended and before derived collision/sight data is built. Double precision and signed zero are preserved. Mutable builders are unchanged, and the retained vertices remain available for Canvas rendering, picking and context recovery.

## Evidence

Baseline: upstream `rock` at `3ae9b275474662e446f1bfe05571a75dde607cbf`. The accompanying [raw evidence](browser-memory-evidence.json) includes both measurements, startup allocations, geometry fingerprints, sight checks, visits and console output.

Renderbuffer measurements use fresh headless Chrome profiles, the built hub at `?debug=1&nosim=1&hour=12&day=80`, 1440×900 CSS pixels and device scale factor 2. Instrumentation counts live allocations/deletions and queries actual `RENDERBUFFER_SAMPLES`. Bytes assume four-byte RGBA8/depth storage; textures, GPU geometry, driver overhead and browser processes are excluded.

| Tier | Before bytes | After bytes | Saving |
| --- | ---: | ---: | ---: |
| High | 128,883,232 | 66,538,768 | **59.46 MiB (48.4%)** |
| Medium | 50,959,296 | 50,959,296 | unchanged |
| Low | 1,048,576 | 1,048,576 | unchanged |

High screen buffers remain 2039×1274 and actual samples change from four to two. Both allocation runs have clean consoles. With an emulated 8 GiB report, startup selects medium and never allocates high-size screen buffers.

The Node seed-1 island has 652,486 vertices before and 180,056 after; numeric payload falls from 15,659,664 to 4,321,344 bytes (**10.81 MiB**). The browser fixture retains 180,037 vertices. Every face's expanded double-precision coordinates and winding have identical SHA-256 fingerprints before and after within each environment. Node's fingerprint is `cdc680af3864bf0f0b067c5dd39240163cb9c3ba421b42ca43c7e0d095dbd2df`; Chrome's is `2a572d33f96e74a8183ecbe9b36827b5d40d7f7dc4f02dc4bfbae37651e8e8b5`.

The browser's existing terrain sight probe passes all 1,525 rays, 385 clear-box certificates, 151 solid-box certificates and 90 window-fragment certificates. Two lab/hub return visits retain the compact vertex count. The new unit regression verifies the upstream fingerprint, storage reduction and cache identity. Adaptive-quality checks cover memory boundaries, invalid/absent reports, pointer type, boot timing and downward-only transitions.

Raw post-GC heap figures are included, but a single run does not establish total-tab or retained-heap savings. No frame-rate improvement is claimed.

## Validation status

The unit suite now completes with **123/123 checks passing**. Fixture corrections match the current surface-chamber width and mirror damage constant, give the breakable-prop player its required root, and count the thirteen distinct authored solid-prop cases. The solid-prop escape fix lets a body beside a top edge move horizontally out without permitting movement into the face.

Canvas contexts used for repeated pixel reads declare `willReadFrequently`. The existing terrain probe now passes with a clean console, an unchanged browser geometry fingerprint, all sight certificates and two return visits. Targeted header-height, jumbotron-cycle and Timechain-residency checks also pass with a clean console. The jumbotron again includes active projects in its unfiltered rotation.

The subsequent full run completes: **640/679 checks pass**. It retains every assertion and threshold. Failures include movement performance, walking and climbing, race geometry budgets, factory access, poker layout, and several outdated browser fixtures. The maintainer authorized continuing repairs after the repository's repeated-failure stop. Further corrections and their validation are in progress; this count predates those corrections.

The performance floor still fails. A separate overlay profile attributes the covered view's average cost to sight guides (11.29 ms), rock surfaces (5.47 ms), and cover drawing (4.77 ms), plus effects and collection. Covered movement measured 31.84 FPS against the unchanged 55 FPS floor. These are diagnostic timings, not evidence of a performance improvement.

The lifecycle runner's heap accounting now consumes snapshot node records incrementally, preserving its object/code totals and memory-growth assertions while avoiding Node's maximum string size. Synthetic snapshots split at six different chunk boundaries produce exact totals. The real factory lifecycle check now passes all 126 assertions (123 global plus three lifecycle/console checks). It measures exactly one subscription in the hall, none in the lab, and one for the hub window, with bounded heap, listeners and GPU records after six trips.

DSB player and character-continuity checks pass (137/137 and 128/128), traversing the current return through ₿IFRÖST before comparing the hub actor. The seated-animation check passes its original ranges, fixed root and compact footprint. A terrain-ray shortcut uses 246,016 additional bytes of cached height bounds; 15,917 deterministic random and boundary-aligned rays match the preceding implementation exactly. All original unit checks pass. The shortcut does not make the movement-performance floor pass.

The next repair batch passes the melee check (127/127), Timechain on both renderers (141/141), factory ladder controls (125/125), factory floor reachability (125/125) and factory walking (127/127). Melee fixtures wait for the restored mesh, and sample damage labels after a drawn frame. The lighthouse has a wider lower landing and a ladder clear of its tower. The console recovery fixture retains its inward-blocked requirement while avoiding a second overlap with the nearby crate.

Timechain's two Canvas taps were rejected because slow frames delayed handlers by 456–477 ms. Gesture duration now uses input event timestamps; the driver queues a real 40 ms press/release without waiting for a slow frame between them. All six wall details open through pointer events on both renderers. The original tap-duration and performance thresholds remain unchanged. A finer outline grid was measured and reverted because it did not improve performance. The unit suite remains 123/123.

Poker now passes 134/134 checks: its intro keeps the lobby behind it, its debug camera follows the scene contract, and the dealer assertion verifies the actual jacket, sleeves and cuffs. Desktop movement, local settlement, private cards, fallback drawing, phone controls and return visits pass.

Race scenery now selects coarse versions of the existing palm and bush builders. Palm face count is 288 instead of 950; the measured bay build retains the same 105 palms and 144 bushes, reducing their faces from 348,508 to 57,234. All six default palm/bush SHA-256 fingerprints remain identical, so detailed scenery elsewhere retains its exact geometry, colours, normals and sway. The existing race-track checks pass 129/129 with the 120,000-face and 900-node limits unchanged; the complete race suite now passes 143/143. Replacing a track clears that removed world's live dust and sparks and trims the idle pool, making the unchanged node budget hold after real driving.

Correcting the lower-floor fixture to read rendered headquarters nodes instead of layout data exposes eleven additional cutaway/weather failures (141/152 targeted checks pass). A follow-up run passes 143/152 after repairing the release fade and correcting the cloud-offset comparison to retain identical shading. The release keeps the last actor cut height while fading over 0.3 seconds, then restores the base state. The weather fixture now excludes complete relief-window roots. Four isolated rendering checks pass with a clean console, including the actual hub's 48 weather and 78 cloud nodes. The complete camera regression now passes 142/142 with a clean console. Its shoulder-framing setup returns from first-person through the real zoom control; its HUD setup selects the club, activates the tab, waits for drawn frames and then captures the native pointer. A Node geometry audit confirms all 5,997 horizontal upward-facing voxel floors remain in the immutable base; the old fixture included 668 wall fragments. The next lower-floor run passes 145/152: floor preservation and both weather/cloud renderer checks now pass; seven failures remain. Ramp-direction fixtures now measure the local authored segment, keeping the original 0.999 alignment threshold; the actual source builder passes that check in Node. Fresh full validation remains outstanding.

The gorilla resting check passes 125/125 after matching the authored allowance for HQ roofs; it still rejects active cave roofs and unrelated frontage. The fresh full run at `b3dec02` completes at **666/703** in 17.6 minutes. Its 37 failures include the unchanged performance floor, hub/gorilla movement, camera cutaways, DSB fixtures and lifecycle sessions. DSB lifecycle times out; factory lifecycle retries, then fails while reading a missing shared node. Earlier focused lifecycle passes do not establish a clean full run. The raw evidence lists every remaining failure.

This change remains a draft pending clean full-suite/performance validation. It must not close #93 or be represented as a complete solution to its full checklist.

## Checks for a maintainer

Run `npm run build`, `npm run test:unit`, `npm run test:full` and, with other test browsers closed, `npm run test:perf`. The terrain fingerprint and memory-boundary regressions live in the existing `test/run.mjs`; no third test file or dependency is added. Compare Chrome Task Manager separately before making a total-tab memory claim.
