# Issue #93 step 2: exact completed-island compaction

This extracts only the terrain vertex compaction from broad draft #122. It is the first slice of #125, not completion of all recommendation 2. It is prepared after renderer-settings PR #124, with no renderer settings duplicated here. Base: rock dab6e36bea482f2d712b65f3e2d559348400b527.

Weld exact shared positions after ramps/windows are appended, remap face/line indices, then retain Float64Array. Preserve signed zero and double precision for CPU collision and sight consumers. Mutable merge/voxelGeometry/gridGeometry builder contracts remain intact. Keep CPU vertices for Canvas, bounds, picking and GPU context recovery. Float32 conversion and dropping CPU copies require separate consumer/precision audits; they are not assumed safe.

[Raw evidence](terrain-compaction-evidence.json): seed-1 Node vertices fall from 652,486 to 180,056. Numeric payload falls from 15,659,664 to 4,321,344 bytes: 10.81 MiB. This measures numeric payload, not array overhead, heap or total-tab memory. All 1,984,266 expanded face coordinates compare with Object.is, metadata matches, the original face hash is retained, and 10,000 sight rays are identical. Cache identity is preserved. The fixture has no lines; line preservation is not exercised by its empty stream.

Browser fixture retains 180,037 vertices. Both backends render through two hub/lab returns. WebGL loss/restoration rebuilds GPU records from the retained source, with no GL error. The browser emits a Canvas readback warning also observed on upstream; clean-console validation is not claimed.

Build and changed-file syntax checks pass. The added terrain unit regression passes before the same upstream cave/mirror failures and missing-player-root breakables exception stop the runner. No thresholds or existing assertions are changed. Full-suite success, post-GC heap savings and performance improvement are not established. Keep this PR draft until required validation passes. Compaction has been removed from #122; remaining geometry work is tracked in #125.
