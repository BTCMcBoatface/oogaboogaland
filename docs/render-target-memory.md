# Issue #93: step 1 — render targets

Only the two primary settings in recommendation 1 are implemented. Optional bloom, pixel-budget and shadow changes are excluded. Geometry, visibility bakes, deferred loading and unrelated gameplay repairs remain separate work. This does not close #93.

A finite positive deviceMemory hint at or below 8 selects medium before renderer creation. Missing or invalid hints retain the pointer default. This approximate browser hint is not physical RAM measurement. Existing downward-only boot and frame governors remain active. High requests 2 MSAA samples instead of 4, with other settings unchanged.

## Evidence

Validated source: `6d3aff6a152a134a29dd7ccf036db36118551492`; unchanged base: `dab6e36bea482f2d712b65f3e2d559348400b527`. Fresh validation on 2026-10-02 used Node 24.12.0, an M1 Pro with 32 GB, and two browser lanes; the performance lane ran alone. See [raw measurements and comparison](render-target-memory-evidence.json).

Build and changed-file syntax checks pass. The existing adaptive-quality probe passes all assertions, including memory boundaries, invalid hints and downward-only behavior. Independent native allocation and context-loss/restoration probes pass on base and head with clean logs; drawing resumes after restoration.

At 1440×900 CSS pixels and DPR 2, independent base/head browsers allocate the same 2039×1274 high targets, with native sample counts of 4 versus 2. Estimated storage of the three screen renderbuffers is 124,688,928 versus 62,344,464 bytes, assuming four bytes per pixel per sample: **59.46 MiB saved**. This excludes textures, geometry, driver padding and process overhead. Total browser memory of 700–750 MB on a base M1 remains unverified.

Fresh `LANES=2 npm run test:full` attempts fail on both versions. The head reports 81 FAIL lines (79 distinct names), the base 80 (78 distinct names), with 76 names shared. Both then abort at the same missing-player-root breakables unit fixture, so neither prints final pass totals or completes the entire suite. Three head-only results remain unresolved: DSB shop clicks, tomato throwing and the six-return node-count soak. Two results appear only on the base. These differences do not establish either a new regression or equivalence; the base gameplay session throws before reaching the tomato assertion.

Covered movement measures 32.62 FPS on base versus 29.45 on head, p95 50 ms and low quality in both; ordinary movement also fails on both. Existing Chrome processes and variable timing limit performance comparisons. The unchanged requirements remain 55 FPS/high, p95 <25 ms and maximum/worst gap <50 ms. #128 tracks the performance blocker. No checks or thresholds are changed.

The earlier eight-case clean-console result is historical. In the fresh expanded run, seven cases complete their allocation/control assertions but fail the inherited Canvas readback warning after scene returns. The eighth is excluded because its context probe incorrectly waited for `renderer.ready` to become false on context loss; the corrected event-based probe passes separately on base and head. A fresh 8/8 clean-console result is not claimed. The PR remains draft.
