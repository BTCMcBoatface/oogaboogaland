# Issue #93: step 1 — render targets

Only the two primary settings in recommendation 1 are implemented. Optional bloom, pixel-budget and shadow changes are excluded. Geometry, visibility bakes, deferred loading and unrelated gameplay repairs remain separate work. This does not close #93.

A finite positive deviceMemory hint at or below 8 selects medium before renderer creation. Missing or invalid hints retain the pointer default. This approximate browser hint is not physical RAM measurement. Existing downward-only boot and frame governors remain active. High requests 2 MSAA samples instead of 4, with other settings unchanged.

## Evidence

Base: upstream rock at dab6e36bea482f2d712b65f3e2d559348400b527. See [raw records](render-target-memory-evidence.json).

Eight browser cases pass with clean consoles: 4/8 GB, 16 GB, absent/zero/NaN hints, touch input and Canvas fallback. Resizing, tier changes and two lab/pool return visits pass. Limited-memory cases avoid initial high allocation.

At 1440×900 CSS pixels and DPR 2, high targets remain 2039×1274. Native renderbuffer queries report 4 versus 2 samples. Calculated storage of the three screen buffers is 124,688,928 versus 62,344,464 bytes, assuming four bytes per pixel per sample: **59.46 MiB saved**. The baseline allocation is recreated in the same renderer by intercepting its native sample request. This excludes textures, geometry and process overhead. Total browser memory of 700–750 MB on a base M1 remains unverified.

Build and changed-file syntax checks pass. Upstream and changed unit runs hit the same cave/mirror assertions and missing-player-root breakables exception. The existing quality probe retains prior assertions and adds memory boundaries, invalid hints and downward-only behavior.

The unchanged performance check ran serially on upstream and this change. Covered motion measures 32.35 versus 32.94 FPS, p95 50 ms, low quality in both. Both also fail the ordinary-motion maximum-frame requirement. The failures predate this change; one pair does not establish performance equivalence or improvement. The requirements remain 55 FPS/high, p95 <25 ms and maximum/worst gap <50 ms. No checks are disabled or weakened. Full-suite success is not established; the PR remains draft.
