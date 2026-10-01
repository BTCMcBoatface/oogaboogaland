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

## Validation limitations

Build, changed-JavaScript syntax and whitespace checks pass. The targeted geometry and adaptive-quality regressions pass.

The full suite was run on the render-target changes and reported 81 browser failures before crashing in the global tier. Unchanged upstream reproduces the surface-cave dimension failure, mirror-health failure and fatal breakable-prop fixture error (`crew.player` has no root). Additional browser failures have not all been classified against upstream. The suite did not reach its final count or ledger write.

Isolated performance runs on both upstream and the render-target patch fail the existing floor: ordinary movement averages 59.18/59.79 FPS but reaches a 50 ms maximum interval; covered movement averages 32.15/31.75 FPS against the 55 FPS floor. No thresholds were changed. These measurements predate terrain compaction and do not prove its performance.

Terrain validation completes the fingerprint, sight probe and return visits, but its console check fails on Chrome's Canvas `getImageData`/`willReadFrequently` warning. The same warning occurs in the upstream terrain run. An earlier driver hang was retried once on a fresh browser. The complete suite has not passed, and has not been rerun after terrain compaction because the repository requires stopping repeated failures rather than retrying them.

This change is a draft pending clean full-suite/performance validation. It must not close #93 or be represented as a complete solution to its full checklist.

## Checks for a maintainer

Run `npm run build`, `npm run test:unit`, `npm run test:full` and, with other test browsers closed, `npm run test:perf`. The terrain fingerprint and memory-boundary regressions live in the existing `test/run.mjs`; no third test file or dependency is added. Compare Chrome Task Manager separately before making a total-tab memory claim.
