# Regression repairs: PR #122

This draft retains gameplay, visibility, input, collision and scene-lifecycle repairs discovered during full-suite validation. Render-target settings and their memory checks belong to #124; exact terrain vertex compaction and its check belong to #129. Their code, memory claims and long obsolete measurement history have been removed from this diff. Neither memory roadmap nor issue #93 is closed here.

## Retained repair groups

- Controls and movement: explicit pointer capture, real event timestamps for taps, reachable NPC work trips, stair transitions, collision escape and safe breakable respawns.
- Visibility: matched front/back triangulation of cupped foliage; conservative object/rock and camera cutaway ownership; shared immutable character bakes with bounded variants and idle-budget protection.
- Lifecycle: cleanup when Rally changes tracks and factory scenes return, bounded pools and shared state; streaming heap-accounting and duplicate-name failure-ledger fixes in the runner.
- Fixtures and UI: current authored cave/mirror and actor contracts, real DSB pointer targets after compositor scrolling, poker title-card layout and debug camera, jumbotron rotation and scene return routes. Existing behavioral thresholds remain intact.

## Validation

The pre-cleanup source at 1adff639a352ea22015712b82f2885ece2a7c58c completed 742/743 checks in 14.3 minutes. The sole failure was covered-cave wall movement: 38.27 FPS, p95 50 ms, low quality. Those totals are historical and must not be presented as a new run of the cleaned head. The unchanged ≥55 FPS/high floor remains open in #128.

A pre-cleanup foliage proof found 7,504 mismatched front/back sheets before repair and zero after, with unchanged vertices, normals, colors and polygon boundaries. The previous targeted gameplay/lifecycle run passed 180/180. Older raw measurement history remains recoverable from the pre-cleanup commit rather than repeated as current evidence.

The cleanup removes the separate memory changes and their dedicated tests, plus the terrain sight-column shortcut that did not meet the performance floor. It preserves the remaining functional repairs and performance assertions. Fresh cleanup validation: build and changed-file syntax checks pass; unit suite passes 122/122 (the dedicated terrain-compaction check moved to #129). A new passing full-suite result is not claimed. Keep the PR draft until its required full suite passes.
