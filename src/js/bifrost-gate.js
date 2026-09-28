// ₿IFRÖST's gate as the owner's concept draws it, and the kit its islet is dressed from. The gate is a free-standing
// wall of chunky stone blocks: stepped towers either side climbing to a stepped gable, and in the middle a round arch
// framed by a navy band of blocky glowing runes between gold trims, a ring of voussoirs and a thick gold band. The
// glowing ₿ medallion sits on the arch, a spire of blue crystal crowns the gable and two golden horns curve out from its
// shoulders. Navy banners with the concept's bind rune hang on the towers, candles burn on every ledge and braziers
// flank the portal at the head of five steps. The back is a wall of three banners between candle pillars, under a
// second medallion.
//
// Everything is built once a page in the gate's frame: x across, y up from the portal's floor, +z out toward the
// bridge, the origin on the portal frame's outer face. The portal keeps the chamber's way in exactly (`ENTRY`), since
// the window behind it (`bifrost-window.js`) draws the chamber's tunnel into that opening. The field stands at
// `GATE.fieldZ`. Behind it a passage wider and taller than the window's clip runs back to a dark wall, closed in stone
// all round, with its floor at the portal's; nothing of the gate enters the window's true-size front.
//
// `build()` returns the geometries: the solid `stone` over a closed shell of boxes, the `trims` (gold, horns, rods,
// candle wax), the `banners`, the dusk-lit `glow` (flames and fires), the always-lit `light` (the medallions, runes,
// crystal, the field's rim and sparkles) and the `field`, a glowing glass sheet. The kit serves the isle as well:
// `runeBanner`, `lantern`, `brazier` and `runeWord`, each cached, at the origin and facing +z.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { models, math } = BL;
  const { cached, variants, geometry, box, bevelBox, lathe, tube, merge, moved, turnedX, turnedY, turnedZ, noShadow, makeVox, voxelGeometry } = models;
  const { mulberry32 } = math;
  const BM = BL.bifrostModels, FM = BL.factoryModels;
  const { facing, archAt, archEdge, archOutline, inArch, disc, ENTRY } = BM;
  const TAU = Math.PI * 2;

  // The owner's colours: deep navy cloth, gold and warm orange trims, electric blue glow, warm flames, grey-brown stone
  // with earthy patches, pale paving.
  const NAVY = "#1c2a62", GOLD = "#f4a52c", GOLD_LT = "#ffd25e", GOLD_DK = "#c7741c", AMBER = "#ef8a1d", BACKING = "#4a2f18";
  const BLUE = "#2b74ff", BLUE_MID = "#62b4ff", BLUE_LT = "#bde6ff", ICE = "#5ec8ff", DEEP = "#0e1d4c", SPARK = "#ffffff";
  const STONE = ["#7e756f", "#716963", "#897f77", "#675f5a"], STONE_LT = "#a0968d", STONE_DK = "#524b47", DIRT = "#7a5b45", PLINTH = "#58514c";
  const RUNE_STONE = ["#3e383a", "#474042"], RUNE_BAND = ["#172569", "#1b2c7a"], RUNE_GLOW = "#7fd6ff";
  const PAVE = ["#a1978d", "#958b82"], STEP = ["#a39a91", "#978e86", "#aca299"], LINING = "#2a272c";
  const WAX = "#eee0c2", IRON = "#2b2724", WOOD = "#5b3b22", EMBER = "#ff5a16", GLASS = "#ffb948", RUNE_WHITE = "#f2f0ff";
  const FLAME = ["#ff7a1e", "#ffa53a", "#ffd36a", "#fff3c4"], SHELL = "#000000";

  // The stone's lattice: half-metre blocks with the facade's face at Z0, so the portal's floor, the passage's walls and
  // roof and its back wall all fall on block faces; the court meets the footing's lowest course partway up.
  const U = 0.5, Z0 = -0.25;
  // The five steps down to the court: their half-width, where the landing ends and the first riser drops, each tread's
  // depth and each riser's height.
  const STAIRS = { halfWidth: 2.5, from: 1.25, tread: 0.4, riser: 0.25, steps: 5 };
  // The passage behind the field: the half-width a walker keeps clear, the back wall's face, and the stone's hollow
  // round it, wider and taller than the window's clip (the opening's half-width plus its 0.75 margin, and 4.8 up).
  const PASSAGE = { half: 1.95, back: -2.25, hollow: 3, roof: 5 };
  // Everything the isle and the hub place the gate by: the portal's floor above the court (`rise`), the stairs' depth
  // from the frame's face to their foot (`run`), the facade's half-width, the back wall's face and the facade's own
  // (`face`), the field and the opening (the chamber's way in), the room the phase reads, the spire's top, the stairs
  // and the passage, the medallion's height and radius, the spire's depth and heights, the braziers on the landing
  // [x, z], and the footprint the gate stands on, as a box and an outline [x, z].
  const GATE = {
    rise: STAIRS.riser * STAIRS.steps, run: STAIRS.from + STAIRS.tread * (STAIRS.steps - 1), halfWidth: 7, back: -4.25, face: Z0,
    fieldZ: -0.6, halfW: ENTRY.halfW, spring: ENTRY.spring, room: { w: 4, h: 4.8, from: 0.3, to: 1.9 }, top: 14.8,
    stairs: STAIRS, passage: PASSAGE, medallion: { y: 6.5, r: 1.5 }, spire: { z: -1.5, base: 10, crystal: 10.8, cap: 13.25 },
    braziers: [[-3.35, 0.72], [3.35, 0.72]],
    footprint: {
      minX: -7, maxX: 7, minZ: -5.05, maxZ: 2.85,
      outline: [[-7, 1.25], [-2.5, 1.25], [-2.5, 2.85], [2.5, 2.85], [2.5, 1.25], [7, 1.25], [7, -3.25], [6, -3.25], [6, -4.25], [2.7, -4.25], [2.7, -5.05], [-2.7, -5.05], [-2.7, -4.25], [-6, -4.25], [-6, -3.25], [-7, -3.25]]
    }
  };
  // The front elevation: the stone's top over each band of |x|, [out to, top], stepping down from the gable to the
  // towers' outer columns; and the back face of each band, the outer columns a metre shallower.
  const TOPS = [[1, 10], [2, 9.5], [3, 8.5], [4, 8], [5, 7], [6, 6], [7, 5]];
  const topAt = (ax) => TOPS.find(([x]) => ax < x)[1];
  const backAt = (ax) => ax < 6 ? GATE.back : -3.25;
  // The portal's frame out from the opening: the gold trim round the opening's edge, the rune band, its outer gold edge,
  // the ring of voussoirs and the thick gold band, each [inner radius, outer radius, its face's z]; all run back to the
  // field. Each overlaps the next by a few centimetres, since their pieces are cut on chords, and no two faces share a
  // plane. `cut` is how far round the arch the facade's front blocks give way to the frame, every block it takes lying
  // wholly inside the gold band.
  const FRAME = { trim: [2, 2.12, 0.02], rune: [2.06, 2.78, -0.1], edge: [2.73, 2.97, 0.03], ring: [2.93, 3.75, 0], band: [3.71, 4, 0.1], cut: 3.6 };
  // The runes round the arch: ₿IFRÖST climbing each side from the spring toward the medallion, every rune stood upright
  // along the band with its head toward the keystone, the first `from` radians above the spring and each next `pitch`
  // on; their pixels `px` across the band and `py` along it, so each rune stands about square, `proud` of the band.
  const BAND = { word: "ᛒᛁᚠᚱᛟᛊᛏ", from: 0.15, pitch: 0.19, px: 0.068, py: 0.056, proud: 0.05 };
  // Where the horns stand across the gable's depth, and the curve of the right one, [x, y] from its root to its tip.
  const HORN = { z: -1.5, curve: [[2.95, 8.2], [4.25, 9.2], [4.4, 11.8], [3.05, 13.05]] };

  // ---- small builders ------------------------------------------------------------------------------

  // A convex outline [[x, y], ...] extruded from z0 to z1, closed and wound to look out of itself.
  const prismZ = (geo, pts, z0, z1, color, emissive = 0) => {
    const n = pts.length, cx = pts.reduce((s, p) => s + p[0], 0) / n, cy = pts.reduce((s, p) => s + p[1], 0) / n, zm = (z0 + z1) / 2;
    facing(geo, pts.map(([x, y]) => [x, y, z1]), color, emissive, cx, cy, z1 + 1);
    facing(geo, pts.map(([x, y]) => [x, y, z0]), color, emissive, cx, cy, z0 - 1);
    for (let k = 0; k < n; k++) {
      const [ax, ay] = pts[k], [bx, by] = pts[(k + 1) % n];
      facing(geo, [[ax, ay, z0], [bx, by, z0], [bx, by, z1], [ax, ay, z1]], color, emissive, ax + bx - cx, ay + by - cy, zm);
    }
    return geo;
  };
  // An arched band from r0 to r1 about the spring, from z0 back to its face at z1: `n` voussoirs over the top and `legs`
  // courses down each side to the floor (none for a band that stops at the spring). `tone(k)` colours piece k, and
  // `lift(k)` stands it proud of the face, so the ring reads as separate blocks.
  const archBand = (geo, r0, r1, z0, z1, n, legs, tone, emissive = 0, lift = () => 0) => {
    const S = ENTRY.spring;
    for (let k = 0; k < n; k++) {
      const a0 = Math.PI * k / n, a1 = Math.PI * (k + 1) / n, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      prismZ(geo, [[c0 * r0, S + s0 * r0], [c0 * r1, S + s0 * r1], [c1 * r1, S + s1 * r1], [c1 * r0, S + s1 * r0]], z0, z1 + lift(k), tone(k), emissive);
    }
    for (let row = 0; row < legs; row++) for (const s of [-1, 1]) {
      const y0 = S * row / legs, y1 = S * (row + 1) / legs, k = n + row * 2 + (s > 0 ? 1 : 0);
      prismZ(geo, [[s * r0, y0], [s * r1, y0], [s * r1, y1], [s * r0, y1]], z0, z1 + lift(k), tone(k), emissive);
    }
    return geo;
  };
  // A square bar from a to b ([x, y, z]), `w` thick, run on half its thickness past both ends so strokes meeting at an
  // angle close their joint.
  const stroke = (a, b, w, color, emissive) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], e = w * 0.45 / (Math.hypot(dx, dy, dz) || 1);
    return FM.beam(a[0] - dx * e, a[1] - dy * e, a[2] - dz * e, b[0] + dx * e, b[1] + dy * e, b[2] + dz * e, w, color, emissive);
  };
  // A flat bar painted on a face at z from (x0, y0) to (x1, y1), `w` wide and run on at its ends, looking along `dir`.
  const bar = (geo, x0, y0, x1, y1, w, z, color, emissive, dir) => {
    const l = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / l * w / 2, uy = (y1 - y0) / l * w / 2;
    return facing(geo, [[x0 - ux + uy, y0 - uy - ux, z], [x1 + ux + uy, y1 + uy - ux, z], [x1 + ux - uy, y1 + uy + ux, z], [x0 - ux - uy, y0 - uy + ux, z]], color, emissive, x0, y0, z + dir);
  };
  // A convex outline [[x, y], ...] moved in by `d` all round.
  const inset = (pts, d) => {
    const n = pts.length, cx = pts.reduce((s, p) => s + p[0], 0) / n, cy = pts.reduce((s, p) => s + p[1], 0) / n;
    const lines = pts.map((a, k) => {
      const b = pts[(k + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l;
      if (nx * (cx - a[0]) + ny * (cy - a[1]) < 0) { nx = -nx; ny = -ny; }
      return [a[0] + nx * d, a[1] + ny * d, (b[0] - a[0]) / l, (b[1] - a[1]) / l];
    });
    return lines.map((q, k) => {
      const p = lines[(k - 1 + n) % n], s = ((q[0] - p[0]) * q[3] - (q[1] - p[1]) * q[2]) / (p[2] * q[3] - p[3] * q[2]);
      return [p[0] + p[2] * s, p[1] + p[3] * s];
    });
  };
  // An axis-aligned closed box between two corners, for the collision shell.
  const block = (x0, x1, y0, y1, z0, z1) => box({ w: x1 - x0, h: y1 - y0, d: z1 - z0, color: SHELL, offset: { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2 } });
  // A tube along an arch's edge `r` out, from the foot of its left leg over the top to the foot of its right, at z.
  const archTube = (r, z, radius, color, emissive) => {
    const total = archEdge(r, ENTRY.spring);
    return tube({ path: (t) => archAt(r, ENTRY.spring, z, t * total), radius: () => radius, rings: 36, segments: 4, colorFn: () => color, emissive });
  };

  // ---- runes ----------------------------------------------------------------------------------------

  // The Elder Futhark as strokes [x0, y0, x1, y1] in a cell one high and six tenths wide about its middle, and the
  // word divider; `LATIN` reads a letter as the rune that stands for its sound.
  const RUNES = {
    "ᚠ": [[-0.25, 0, -0.25, 1], [-0.25, 0.55, 0.3, 0.85], [-0.25, 0.3, 0.3, 0.6]],
    "ᚢ": [[-0.25, 0, -0.25, 1], [-0.25, 1, 0.25, 0.7], [0.25, 0.7, 0.25, 0]],
    "ᚦ": [[-0.2, 0, -0.2, 1], [-0.2, 0.75, 0.25, 0.5], [0.25, 0.5, -0.2, 0.25]],
    "ᚨ": [[-0.2, 0, -0.2, 1], [-0.2, 1, 0.25, 0.75], [-0.2, 0.7, 0.25, 0.45]],
    "ᚱ": [[-0.3, 0, -0.3, 1], [-0.3, 1, 0.25, 0.75], [0.25, 0.75, -0.3, 0.5], [-0.3, 0.5, 0.3, 0]],
    "ᚲ": [[0.25, 1, -0.25, 0.5], [-0.25, 0.5, 0.25, 0]],
    "ᚷ": [[-0.3, 0, 0.3, 1], [-0.3, 1, 0.3, 0]],
    "ᚹ": [[-0.2, 0, -0.2, 1], [-0.2, 1, 0.25, 0.78], [0.25, 0.78, -0.2, 0.55]],
    "ᚺ": [[-0.25, 0, -0.25, 1], [0.25, 0, 0.25, 1], [-0.25, 0.65, 0.25, 0.35]],
    "ᚾ": [[0, 0, 0, 1], [-0.3, 0.65, 0.3, 0.35]],
    "ᛁ": [[0, 0, 0, 1]],
    "ᛃ": [[0, 0.95, -0.28, 0.7], [-0.28, 0.7, 0, 0.45], [0, 0.55, 0.28, 0.3], [0.28, 0.3, 0, 0.05]],
    "ᛈ": [[-0.25, 0, -0.25, 1], [-0.25, 1, 0.25, 0.72], [-0.25, 0, 0.25, 0.28]],
    "ᛉ": [[0, 0, 0, 1], [0, 0.55, -0.3, 0.95], [0, 0.55, 0.3, 0.95]],
    "ᛊ": [[-0.25, 1, 0.2, 0.62], [0.2, 0.62, -0.2, 0.38], [-0.2, 0.38, 0.25, 0]],
    "ᛏ": [[0, 0, 0, 1], [0, 1, -0.3, 0.7], [0, 1, 0.3, 0.7]],
    "ᛒ": [[-0.3, 0, -0.3, 1], [-0.3, 1, 0.25, 0.75], [0.25, 0.75, -0.3, 0.5], [-0.3, 0.5, 0.25, 0.25], [0.25, 0.25, -0.3, 0]],
    "ᛖ": [[-0.25, 0, -0.25, 1], [0.25, 0, 0.25, 1], [-0.25, 1, 0, 0.7], [0, 0.7, 0.25, 1]],
    "ᛗ": [[-0.25, 0, -0.25, 1], [0.25, 0, 0.25, 1], [-0.25, 1, 0.25, 0.55], [0.25, 1, -0.25, 0.55]],
    "ᛚ": [[-0.2, 0, -0.2, 1], [-0.2, 1, 0.25, 0.7]],
    "ᛜ": [[0, 0.2, 0.28, 0.5], [0.28, 0.5, 0, 0.8], [0, 0.8, -0.28, 0.5], [-0.28, 0.5, 0, 0.2]],
    "ᛞ": [[-0.3, 0, -0.3, 1], [0.3, 0, 0.3, 1], [-0.3, 1, 0.3, 0], [-0.3, 0, 0.3, 1]],
    "ᛟ": [[0, 1, 0.3, 0.65], [0.3, 0.65, -0.25, 0], [0, 1, -0.3, 0.65], [-0.3, 0.65, 0.25, 0]],
    "᛫": [[-0.07, 0.5, 0.07, 0.5]]
  };
  const LATIN = {
    A: "ᚨ", B: "ᛒ", C: "ᚲ", D: "ᛞ", E: "ᛖ", F: "ᚠ", G: "ᚷ", H: "ᚺ", I: "ᛁ", J: "ᛃ", K: "ᚲ", L: "ᛚ", M: "ᛗ", N: "ᚾ", O: "ᛟ", "Ö": "ᛟ",
    P: "ᛈ", Q: "ᚲ", R: "ᚱ", S: "ᛊ", T: "ᛏ", U: "ᚢ", V: "ᚹ", W: "ᚹ", Y: "ᛃ", Z: "ᛉ", "Þ": "ᚦ", "₿": "ᛒ", "·": "᛫", ".": "᛫", ":": "᛫"
  };
  const runeOf = (ch) => {
    const strokes = RUNES[ch] || RUNES[LATIN[ch.toUpperCase()]];
    if (!strokes) throw new Error(`No rune for "${ch}"`);
    return strokes;
  };
  // The strokes of `text` pushed onto `out` as square bars `w` thick: each rune placed by `at(u, v, i)`, its cell's
  // point (u across, v up) for the rune at index i, a space leaving its place empty.
  const runeStrokes = (text, at, w, out, color = ICE, emissive = 1) => {
    [...text].forEach((ch, i) => {
      if (ch === " ") return;
      for (const [x0, y0, x1, y1] of runeOf(ch)) out.push(stroke(at(x0, y0, i), at(x1, y1, i), w, color, emissive));
    });
    return out;
  };
  // A line of runes `height` tall, centred on the origin and standing a tenth of their height proud of z 0, facing +z.
  // Cached by text, height and colour; merge before moving.
  const words = new Map();
  const runeWord = (text, height, color = ICE, emissive = 1) => {
    const key = `${text}|${height}|${color}|${emissive}`;
    if (!words.has(key)) {
      const n = [...text].length, w = height * 0.11;
      words.set(key, noShadow(merge(...runeStrokes(text, (u, v, i) => [(u + (i - (n - 1) / 2) * 0.8) * height, (v - 0.5) * height, w / 2], w, [], color, emissive))));
    }
    return words.get(key);
  };
  // The arch's runes as the concept draws them, blocky: five pixels across and seven high, row by row from the top,
  // "#" lit, their slants stepped a pixel at a time.
  const PIXEL_RUNES = {
    "ᛒ": ["###..", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "###.."],
    "ᛁ": ["..#..", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
    "ᚠ": ["#..#.", "#.#.#", "##.#.", "#.#..", "##...", "#....", "#...."],
    "ᚱ": ["###..", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
    "ᛟ": ["..#..", ".#.#.", "#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
    "ᛊ": [".#...", "..#..", "...#.", "..#..", ".#...", "..#..", "...#."],
    "ᛏ": ["..#..", ".###.", "#.#.#", "..#..", "..#..", "..#..", "..#.."]
  };
  // A rune of `PIXEL_RUNES` upright about the origin with pixels `px` wide and `py` high, each run of lit pixels along a
  // row one glowing block, standing from z 0 to `proud`.
  const pixelRune = (ch, px, py, proud) => {
    const rows = PIXEL_RUNES[ch], parts = [];
    if (!rows) throw new Error(`No pixel rune for "${ch}"`);
    rows.forEach((row, r) => {
      for (let c = 0; c < row.length;) {
        if (row[c] !== "#") { c++; continue; }
        let n = 1;
        while (row[c + n] === "#") n++;
        parts.push(box({ w: n * px, h: py, d: proud, color: RUNE_GLOW, emissive: 1, offset: { x: (c + n / 2 - row.length / 2) * px, y: ((rows.length - 1) / 2 - r) * py, z: proud / 2 } }));
        c += n;
      }
    });
    return merge(...parts);
  };

  // ---- the kit ----------------------------------------------------------------------------------------

  // A banner as the concept hangs them, `scale` times one 1.1 m wide and 2.6 m from its rod at the origin to its point:
  // navy cloth edged in gold and cut to a point with a gold drop at its tip, its white mark on both faces, each reading
  // true from its own side (`cloth`), and the gilt rod with its knobs (`rod`). Cached by mark and scale.
  const BANNER = { w: 1.1, h: 2.6, tail: 0.42, top: -0.06, hem: 0.085, t: 0.02 };
  // The marks the concept's banners carry, drawn in thick square-ended strokes. Each stroke is [x0, y0, x1, y1] in stave
  // lengths, up from the stave's foot (y 0) to its head (y 1), and each mark gives, on a banner of scale 1, how far
  // below the rod the stave's head hangs (`head`), the stave's length (`len`), the strokes' width (`w`) and how far the
  // stave stands off the banner's middle, in stave lengths (`dx`).
  // - `gate`, the towers' bind rune: the stave's head forked into three prongs, the outer two turning in to cross it and
  //   open into a diamond round its middle, crossing it again below and turning down into two short feet, with the stave
  //   running on beneath them.
  // - `back`, the back wall's middle banner: the stave crossed a little above its middle by an X whose four ends turn
  //   straight up and down, ᛉ over ᛦ.
  // - `post`, the posts' ᛕᛁ: a branch up and out to the right from above the stave's middle, its tip turned straight up,
  //   one down and out from the same point, and a short ᛁ standing at the foot under the lower branch's end.
  const MARKS = {
    gate: {
      head: -0.5, len: 1.45, w: 0.08, dx: 0, strokes: [
        [0, 0, 0, 1], [-0.15, 1, -0.15, 0.885], [0.15, 1, 0.15, 0.885], [-0.15, 0.885, 0, 0.765], [0.15, 0.885, 0, 0.765],
        [0, 0.765, -0.17, 0.56], [0, 0.765, 0.17, 0.56], [-0.17, 0.56, 0, 0.355], [0.17, 0.56, 0, 0.355],
        [0, 0.355, -0.15, 0.22], [0, 0.355, 0.15, 0.22], [-0.15, 0.22, -0.15, 0.16], [0.15, 0.22, 0.15, 0.16]
      ]
    },
    back: {
      head: -0.62, len: 1.25, w: 0.083, dx: 0, strokes: [
        [0, 0, 0, 1], [-0.168, 0.925, -0.168, 0.747], [0.168, 0.925, 0.168, 0.747], [-0.168, 0.747, 0, 0.555], [0.168, 0.747, 0, 0.555],
        [0, 0.555, -0.168, 0.363], [0, 0.555, 0.168, 0.363], [-0.168, 0.363, -0.168, 0.24], [0.168, 0.363, 0.168, 0.24]
      ]
    },
    post: {
      head: -0.55, len: 1.2, w: 0.1, dx: -0.17, strokes: [
        [0, 0, 0, 1], [0, 0.64, 0.29, 0.86], [0.29, 0.86, 0.29, 1], [0, 0.64, 0.34, 0.34], [0.26, 0, 0.26, 0.22]
      ]
    }
  };
  const bannerCache = new Map();
  const runeBanner = (scale = 1, mark = "gate") => {
    const key = `${mark}|${scale}`;
    if (bannerCache.has(key)) return bannerCache.get(key);
    const M = MARKS[mark];
    if (!M) throw new Error(`No banner mark "${mark}"`);
    const { w, h, tail, top, hem, t } = BANNER, cloth = geometry();
    const outer = [[-w / 2, top], [w / 2, top], [w / 2, top - h + tail], [0, top - h], [-w / 2, top - h + tail]], inner = inset(outer, hem);
    const at = (u, v, side) => [side * (M.dx + u) * M.len, M.head + (v - 1) * M.len];
    for (const side of [1, -1]) {
      const flat = (pts, color, emissive) => facing(cloth, pts.map(([x, y]) => [x, y, side * t]), color, emissive, 0, top - h / 2, side * 5);
      flat(inner, NAVY, 0.05);
      outer.forEach((p, k) => { const k2 = (k + 1) % outer.length; flat([p, outer[k2], inner[k2], inner[k]], GOLD, 0.25); });
      for (const [u0, v0, u1, v1] of M.strokes) bar(cloth, ...at(u0, v0, side), ...at(u1, v1, side), M.w, side * (t + 0.004), RUNE_WHITE, 0.35, side);
    }
    const drop = moved(lathe({ profile: [[0, 0.02], [0.08, -0.08], [0, -0.22]], segments: 4, color: GOLD_LT, emissive: 0.3 }), 0, top - h, 0);
    const knob = () => lathe({ profile: [[0, -0.09], [0.075, -0.04], [0.075, 0.04], [0, 0.09]], segments: 6, color: GOLD, emissive: 0.25 });
    const rod = merge(box({ w: w + 0.24, h: 0.07, d: 0.07, color: GOLD_DK, emissive: 0.15 }), moved(knob(), -(w / 2 + 0.16), 0, 0), moved(knob(), w / 2 + 0.16, 0, 0));
    const grow = (geo) => { const v = geo.verts; for (let i = 0; i < v.length; i++) v[i] *= scale; return geo; };
    const out = { cloth: grow(merge(cloth, drop)), rod: grow(rod) };
    bannerCache.set(key, out);
    return out;
  };

  // A square lantern 0.6 m tall with its foot at the origin: a timber foot and head, iron posts at its corners and a
  // band round its middle, an iron cap with a ring to hang it by (`body`), and its warm glass (`glass`).
  const lantern = cached(() => ({
    body: merge(
      box({ w: 0.3, h: 0.05, d: 0.3, color: WOOD, offset: { y: 0.025 } }),
      ...[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => box({ w: 0.045, h: 0.34, d: 0.045, color: IRON, offset: { x: sx * 0.12, y: 0.22, z: sz * 0.12 } })),
      box({ w: 0.225, h: 0.035, d: 0.225, color: IRON, offset: { y: 0.22 } }),
      box({ w: 0.32, h: 0.05, d: 0.32, color: WOOD, offset: { y: 0.415 } }),
      moved(turnedY(lathe({ profile: [[0.2, 0], [0.09, 0.09], [0, 0.11]], segments: 4, color: IRON }), Math.PI / 4), 0, 0.44, 0),
      box({ w: 0.05, h: 0.06, d: 0.05, color: IRON, offset: { y: 0.575 } })
    ),
    glass: noShadow(box({ w: 0.2, h: 0.33, d: 0.2, color: GLASS, emissive: 1, offset: { y: 0.215 } }))
  }));

  // A stone brazier a metre high with its foot at the origin: a dark footing, the block, a pale cap and a kerb of dark
  // stone round the bowl (`stone`); and its fire, a bed of embers under flames of stacked blocks (`fire`).
  const FIRE = [[0.5, 0.24, 1.02, 0, 0, 0], [0.4, 0.24, 1.2, 0.03, -0.03, 1], [0.3, 0.22, 1.38, 0.06, 0.04, 2], [0.22, 0.2, 1.54, 0.02, 0.06, 2], [0.14, 0.16, 1.68, -0.02, 0.03, 3], [0.22, 0.24, 1.18, -0.19, 0.08, 1], [0.18, 0.2, 1.22, 0.2, -0.12, 0], [0.12, 0.14, 1.4, -0.14, -0.1, 2]];
  const brazier = cached(() => ({
    stone: merge(
      bevelBox({ w: 1, h: 0.14, d: 1, color: STONE_DK, bevel: 0.04, offset: { y: 0.07 } }),
      bevelBox({ w: 0.84, h: 0.62, d: 0.84, color: STONE[2], bevel: 0.05, offset: { y: 0.45 } }),
      bevelBox({ w: 0.98, h: 0.12, d: 0.98, color: STONE_LT, bevel: 0.04, offset: { y: 0.82 } }),
      ...[-1, 1].flatMap((s) => [
        box({ w: 0.98, h: 0.14, d: 0.13, color: STONE_DK, offset: { y: 0.95, z: s * 0.425 } }),
        box({ w: 0.13, h: 0.14, d: 0.72, color: STONE_DK, offset: { x: s * 0.425, y: 0.95 } })
      ])
    ),
    fire: noShadow(merge(
      box({ w: 0.72, h: 0.06, d: 0.72, color: EMBER, emissive: 0.85, offset: { y: 0.91 } }),
      ...FIRE.map(([w, h, y, x, z, k]) => box({ w, h, d: w, color: FLAME[k], emissive: 1, offset: { x, y, z } }))
    ))
  }));

  // A candle of wax with its flame, four heights from 0.14 m: the wax for the trims, the flame for the dusk ramp.
  const candle = variants((i) => {
    const h = 0.14 + 0.05 * i;
    return {
      wax: box({ w: 0.1, h, d: 0.1, color: WAX, offset: { y: h / 2 } }),
      flame: noShadow(merge(box({ w: 0.07, h: 0.09, d: 0.07, color: FLAME[1], emissive: 1, offset: { y: h + 0.055 } }), box({ w: 0.04, h: 0.07, d: 0.04, color: FLAME[3], emissive: 1, offset: { y: h + 0.12 } })))
    };
  });

  // ---- the gate ---------------------------------------------------------------------------------------

  // The stone in half-metre blocks: the towers and the gable to the front elevation's steps over a footing that reaches
  // the court (its lowest course sunk into it when the rise is not a whole number of blocks), the landing before them at
  // the portal's floor, and the passage hollowed behind the field. Round the arch the front blocks give way to the frame.
  // Each block takes a shade of stone, now and then an earthy or darker one; each column's top block is pale coping, the
  // landing is paved, the hollow is lined dark and its back wall glows faintly in the field's blue, which is all Canvas
  // 2D shows through the field. Faces at or under the court are left out.
  const hash = (a, b, c) => (Math.imul(a, 73856093) ^ Math.imul(b, 19349663) ^ Math.imul(c, 83492791)) >>> 0;
  const BLOCKS = [...STONE, DIRT, STONE_DK, STONE_LT, PLINTH, PAVE[0], PAVE[1], LINING, DEEP];
  const mass = () => {
    const v = makeVox(), n = Math.round(GATE.halfWidth / U), end = Math.round((STAIRS.from - Z0) / U), wall = Math.round((PASSAGE.back - Z0) / U) - 1;
    const foot = -Math.ceil(GATE.rise / U - 1e-9);
    for (let i = -n; i < n; i++) {
      const x = (i + 0.5) * U, ax = Math.abs(x), top = Math.round(topAt(ax) / U);
      for (let k = Math.round((backAt(ax) - Z0) / U); k < end; k++) {
        const z = Z0 + (k + 0.5) * U, behind = k < 0 && z > PASSAGE.back;
        for (let j = foot; j < (k < 0 ? top : 0); j++) {
          const y = (j + 0.5) * U, h = hash(i, j, k) % 100, hollow = ax < PASSAGE.hollow && y < PASSAGE.roof;
          if (j >= 0 && (behind && hollow || k === -1 && inArch(x, y, FRAME.cut, ENTRY.spring))) continue;
          let c;
          if (j < 0) c = j === -1 && k >= 0 ? 8 + (h & 1) : 7;
          else if (k === wall && hollow) c = 11;
          else if (behind && k < -1 && ax < PASSAGE.hollow + U && y < PASSAGE.roof + U) c = 10;
          else if (j === top - 1) c = h < 85 ? 6 : 2;
          else c = h < 7 ? 4 : h < 14 ? 5 : h & 3;
          v.set(i, j, k, c);
        }
      }
    }
    const geo = voxelGeometry(v, { unit: U, palette: BLOCKS, origin: { x: 0, y: 0, z: Z0 }, emissive: { 11: 0.55 } }), V = geo.verts;
    geo.faces = geo.faces.filter((f) => !f.i.every((idx) => V[idx * 3 + 1] < 1e-6 - GATE.rise));
    // Flat shaded blocks, each its own shade, as the concept's are: no masonry drawn over them.
    delete geo.voxel;
    return geo;
  };

  // The five steps from the court to the landing, each course laid in big pale blocks breaking joint with the next.
  const stairs = () => {
    const parts = [], { halfWidth: W, from, tread, riser, steps } = STAIRS;
    for (let k = 1; k < steps; k++) {
      const z0 = from + tread * (k - 1), z1 = from + tread * k, top = -riser * k, cuts = k % 2 ? [-W, -0.9, 0.9, W] : [-W, -1.6, 0, 1.6, W];
      for (let c = 0; c + 1 < cuts.length; c++) {
        parts.push(bevelBox({ w: cuts[c + 1] - cuts[c] - 0.02, h: top + GATE.rise, d: z1 - z0, color: STEP[(k + c) % STEP.length], bevel: 0.04, offset: { x: (cuts[c] + cuts[c + 1]) / 2, y: (top - GATE.rise) / 2, z: (z0 + z1) / 2 } }));
      }
    }
    return merge(...parts);
  };

  // A medallion in its own frame, its wall at z 0 and facing +z: a bronze backing let into the wall (`backing`), and
  // what glows (`glow`), a ring of gold blocks round an orange coin with a raised ₿.
  const medallion = cached(() => {
    const { r } = GATE.medallion, rim = 0.28, n = 24, ring = geometry(), coin = geometry();
    for (let k = 0; k < n; k++) {
      const a0 = k / n * TAU, a1 = (k + 1) / n * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      prismZ(ring, [[c0 * (r - rim), s0 * (r - rim)], [c0 * r, s0 * r], [c1 * r, s1 * r], [c1 * (r - rim), s1 * (r - rim)]], 0.12, 0.44 + (k & 1) * 0.04, k & 1 ? GOLD : GOLD_LT, 0.55);
    }
    facing(coin, Array.from({ length: n }, (_, k) => [Math.cos(k / n * TAU) * (r - rim + 0.02), Math.sin(k / n * TAU) * (r - rim + 0.02), 0.36]), AMBER, 0.9, 0, 0, 5);
    return { backing: disc(r + 0.12, 0.62, BACKING), glow: merge(ring, coin, moved(FM.smoothBitcoin(1.6, 0.12, "#ffe27a", 1), 0, 0, 0.42)) };
  });

  // A golden horn along HORN's curve, on the left for s -1: gold blocks stepped along it, shrinking from its root to its
  // pale tip, with darker bands round it.
  const horn = (s) => {
    const P = HORN.curve, M = 96, pts = [], lens = [0];
    for (let m = 0; m <= M; m++) {
      const t = m / M, u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
      pts.push([a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]]);
      if (m) lens.push(lens[m - 1] + Math.hypot(pts[m][0] - pts[m - 1][0], pts[m][1] - pts[m - 1][1]));
    }
    const L = lens[M], parts = [];
    for (let d = 0, m = 0; d <= L;) {
      while (m < M && lens[m + 1] < d) m++;
      const f = d / L, w = 0.84 - 0.56 * f, k = m < M ? (d - lens[m]) / (lens[m + 1] - lens[m]) : 0;
      const x = pts[m][0] + (pts[Math.min(M, m + 1)][0] - pts[m][0]) * k, y = pts[m][1] + (pts[Math.min(M, m + 1)][1] - pts[m][1]) * k;
      const band = f > 0.2 && f < 0.26 || f > 0.45 && f < 0.51 || f > 0.66 && f < 0.71;
      parts.push(box({ w, h: w, d: w, color: f > 0.86 ? GOLD_LT : band ? GOLD_DK : GOLD, emissive: 0.2, offset: { x: s * x, y, z: HORN.z } }));
      d += w * 0.5;
    }
    return merge(...parts);
  };

  // A crystal of the spire, a square prism `r` across its faces and `h` tall with its foot at the origin, cut to a point
  // `tip` long (or left square), pale toward its top.
  const shard = (r, h, tip) => turnedY(lathe({ profile: [[r * 0.75, 0], [r, 0.12], [r, h - tip], [tip ? 0 : r * 0.9, h]], segments: 4, color: (t) => t > 0.6 ? BLUE_LT : ICE, emissive: 1 }), Math.PI / 4);

  // The field: a glass sheet of the field's blue filling the opening a hair before the field's plane, paler in a band
  // round its edge, glowing and see-through, so the chamber the window draws shows through it.
  const field = () => {
    const geo = geometry(), z = GATE.fieldZ + 0.03, { halfW: H, spring: S } = ENTRY, I = H - 0.32, n = 14;
    facing(geo, archOutline(I, S, z, n), BLUE, 1, 0, S, z + 1);
    for (const s of [-1, 1]) facing(geo, [[s * I, 0, z], [s * H, 0, z], [s * H, S, z], [s * I, S, z]], BLUE_MID, 1, 0, S, z + 1);
    for (let k = 0; k < n; k++) {
      const a0 = Math.PI * k / n, a1 = Math.PI * (k + 1) / n;
      facing(geo, [[Math.cos(a0) * I, S + Math.sin(a0) * I, z], [Math.cos(a0) * H, S + Math.sin(a0) * H, z], [Math.cos(a1) * H, S + Math.sin(a1) * H, z], [Math.cos(a1) * I, S + Math.sin(a1) * I, z]], BLUE_MID, 1, 0, S, z + 1);
    }
    geo.glass = 0.4;
    return noShadow(geo);
  };
  // The field's sparkles, white and pale blue specks and a few four-pointed glints a hair before the sheet.
  const sparkles = () => {
    const geo = geometry(), rand = mulberry32(2150), z = GATE.fieldZ + 0.05, S = ENTRY.spring;
    for (let k = 0; k < 44;) {
      const x = (rand() * 2 - 1) * 1.8, y = 0.15 + rand() * 4.05, s = 0.03 + rand() * 0.045, color = rand() < 0.7 ? SPARK : BLUE_LT;
      if (!inArch(x, y, 1.75, S)) continue;
      facing(geo, [[x - s, y - s, z], [x + s, y - s, z], [x + s, y + s, z], [x - s, y + s, z]], color, 1, x, y, z + 1);
      k++;
    }
    for (let k = 0; k < 7;) {
      const x = (rand() * 2 - 1) * 1.5, y = 0.5 + rand() * 3.5, l = 0.1 + rand() * 0.06;
      if (!inArch(x, y, 1.5, S)) continue;
      bar(geo, x - l, y, x + l, y, 0.03, z + 0.002, SPARK, 1, 1);
      bar(geo, x, y - l, x, y + l, 0.03, z + 0.004, SPARK, 1, 1);
      k++;
    }
    return geo;
  };

  // The collision shell, all closed boxes: the footing and landing, the steps, each band of the towers and gable to its
  // top (standing out to the frame's face across the arch), the crown over the passage and the passage's back wall, the
  // spire, the medallions, the braziers and the back pillars. The passage stays open from the landing through the
  // field to its back wall, `PASSAGE.half` either side and four metres high.
  const shell = () => {
    const { back, rise } = GATE, P = PASSAGE, M = GATE.medallion, Sp = GATE.spire, reach = M.r + 0.12;
    const parts = [
      block(-6, 6, -rise, 0, back, STAIRS.from), block(-P.half, P.half, 4, 9.5, back, 0.12), block(-1, 1, 9.5, 10, back, Z0), block(-P.half, P.half, 0, 4, back, P.back),
      block(-1, 1, Sp.base, Sp.crystal, Sp.z - 0.85, Sp.z + 0.85), block(-0.35, 0.35, Sp.crystal, GATE.top, Sp.z - 0.35, Sp.z + 0.35),
      block(-reach, reach, M.y - reach, M.y + reach, 0.12, 0.6), block(-reach, reach, M.y - reach, M.y + reach, back - 0.45, back)
    ];
    for (let k = 1; k < STAIRS.steps; k++) parts.push(block(-STAIRS.halfWidth, STAIRS.halfWidth, -rise, -STAIRS.riser * k, STAIRS.from, STAIRS.from + STAIRS.tread * k));
    for (const s of [-1, 1]) {
      const span = (a, b) => s < 0 ? [-b, -a] : [a, b];
      parts.push(block(...span(6, 7), -rise, 0, backAt(6.5), STAIRS.from));
      let x0 = 0;
      for (const [x1, top] of TOPS) {
        if (x1 > P.half) parts.push(block(...span(Math.max(x0, P.half), x1), 0, top, backAt((x0 + x1) / 2), x1 <= FRAME.band[1] ? 0.12 : Z0));
        x0 = x1;
      }
      parts.push(block(...span(1.7, 2.7), -rise, 4.4, back - 0.8, back));
    }
    for (const [x, z] of GATE.braziers) parts.push(block(x - 0.5, x + 0.5, 0, 1.02, z - 0.5, z + 0.5));
    return merge(...parts);
  };

  // Everything of the gate, built once a page in its frame.
  const build = cached(() => {
    const { back } = GATE, S = ENTRY.spring, F = GATE.fieldZ, M = GATE.medallion, Sp = GATE.spire;
    const stone = [mass(), stairs()], trims = [], cloth = [], glow = [];
    const frame = geometry(), gilt = geometry(), lit = [];

    // The portal's frame: the gold trim round the opening, the rune band, navy and faintly aglow over the arch and dark
    // stone down its jambs, with a gold sill across it at each spring, its outer gold edge, the ring of voussoirs
    // standing out a block at a time and the thick gold band over the arch, closed by gold imposts; the band again on
    // the back wall round its medallion. A gold threshold at the field's foot.
    archBand(gilt, FRAME.trim[0], FRAME.trim[1], F, FRAME.trim[2], 18, 1, (k) => k & 1 ? GOLD_LT : GOLD, 0.3);
    archBand(frame, FRAME.rune[0], FRAME.rune[1], F, FRAME.rune[2], 11, 0, (k) => RUNE_BAND[k & 1], 0.3);
    archBand(frame, FRAME.rune[0], FRAME.rune[1], F, FRAME.rune[2], 0, 3, (k) => RUNE_STONE[(k >> 1) & 1]);
    archBand(gilt, FRAME.edge[0], FRAME.edge[1], F, FRAME.edge[2], 18, 1, (k) => k & 1 ? GOLD : GOLD_LT, 0.3);
    archBand(frame, FRAME.ring[0], FRAME.ring[1], F, FRAME.ring[2], 15, 3, (k) => [STONE[0], STONE[2], STONE[1], STONE_LT][k & 3], 0, (k) => (k & 1) * 0.06);
    archBand(gilt, FRAME.band[0], FRAME.band[1], F, FRAME.band[2], 18, 0, (k) => k & 1 ? GOLD : AMBER, 0.3);
    archBand(gilt, FRAME.band[0], FRAME.band[1], back - 0.12, back + 0.05, 18, 0, (k) => k & 1 ? GOLD : AMBER, 0.3);
    for (const s of [-1, 1]) {
      const x = s * (FRAME.band[0] + FRAME.band[1]) / 2, sill = (FRAME.trim[0] + FRAME.edge[1]) / 2;
      trims.push(bevelBox({ w: 0.46, h: 0.28, d: 0.75, color: GOLD_DK, bevel: 0.04, offset: { x, y: S - 0.14, z: -0.225 } }), bevelBox({ w: 0.46, h: 0.28, d: 0.3, color: GOLD_DK, bevel: 0.04, offset: { x, y: S - 0.14, z: back - 0.1 } }));
      trims.push(bevelBox({ w: FRAME.edge[1] - FRAME.trim[0], h: 0.12, d: 0.6, color: GOLD_DK, bevel: 0.03, offset: { x: s * sill, y: S, z: FRAME.edge[2] + 0.02 - 0.3 } }));
    }
    stone.push(frame);
    trims.push(gilt, box({ w: 2 * ENTRY.halfW, h: 0.03, d: 0.1, color: GOLD, emissive: 0.3, offset: { y: 0.015, z: F + 0.08 } }));

    // The runes round the band, blocky and glowing: ₿IFRÖST up each side from the spring toward the medallion, on the
    // middle of the navy between the trims, each rune turned so its head leans toward the keystone.
    {
      const rc = (FRAME.trim[1] + FRAME.edge[0]) / 2, face = FRAME.rune[2];
      for (const s of [-1, 1]) {
        [...BAND.word].forEach((ch, i) => {
          const a = BAND.from + i * BAND.pitch;
          lit.push(moved(turnedZ(pixelRune(ch, BAND.px, BAND.py, BAND.proud), s * a), s * rc * Math.cos(a), S + rc * Math.sin(a), face));
        });
      }
    }
    // The field's bright rim just before the sheet.
    lit.push(archTube(ENTRY.halfW - 0.05, F + 0.05, 0.05, BLUE_LT, 1), sparkles());

    // The medallions, on the arch and high on the back wall.
    const medal = medallion(), front = (geo) => moved(merge(geo), 0, M.y, 0.05), rear = (geo) => moved(turnedY(merge(geo), Math.PI), 0, M.y, back - 0.05);
    trims.push(front(medal.backing), rear(medal.backing));
    lit.push(front(medal.glow), rear(medal.glow));

    // The spire: a stepped plinth on the gable, a tall crystal with two leaning out beside it and two small ones before
    // them, and the stone finial the tall one carries, with a gold collar under its cap.
    stone.push(
      bevelBox({ w: 2, h: 0.45, d: 1.7, color: STONE_LT, bevel: 0.06, offset: { y: Sp.base + 0.225, z: Sp.z } }),
      bevelBox({ w: 1.3, h: Sp.crystal - Sp.base - 0.45, d: 1.2, color: STONE[2], bevel: 0.05, offset: { y: (Sp.base + 0.45 + Sp.crystal) / 2, z: Sp.z } }),
      bevelBox({ w: 0.66, h: 1.05, d: 0.66, color: STONE_DK, bevel: 0.06, offset: { y: Sp.cap + 0.525, z: Sp.z } }),
      moved(turnedY(lathe({ profile: [[0.47, 0], [0, GATE.top - Sp.cap - 1.05]], segments: 4, color: STONE_DK }), Math.PI / 4), 0, Sp.cap + 1.05, Sp.z)
    );
    trims.push(bevelBox({ w: 0.76, h: 0.1, d: 0.76, color: GOLD, bevel: 0.025, emissive: 0.3, offset: { y: Sp.cap + 1.05, z: Sp.z } }));
    lit.push(moved(shard(0.36, Sp.cap - Sp.crystal + 0.05, 0), 0, Sp.crystal, Sp.z));
    for (const s of [-1, 1]) {
      lit.push(moved(turnedZ(shard(0.27, 2, 0.6), -s * 0.24), s * 0.48, Sp.crystal - 0.05, Sp.z + 0.05));
      lit.push(moved(turnedX(turnedZ(shard(0.17, 1.1, 0.45), -s * 0.4), 0.3), s * 0.32, Sp.crystal - 0.05, Sp.z + 0.4));
    }

    // The horns, from the gable's shoulders.
    trims.push(horn(-1), horn(1));

    // The banners: one on each tower's face and back with the bind rune, and the big one with its own mark on the back
    // wall between the candle pillars, each on its rod held off the wall by iron stubs.
    const hang = (scale, mark, x, y, wall, rear) => {
      const b = runeBanner(scale, mark), z = rear ? wall - 0.13 : wall + 0.13, place = (geo) => moved(rear ? turnedY(merge(geo), Math.PI) : merge(geo), x, y, z);
      cloth.push(place(b.cloth));
      trims.push(place(b.rod));
      for (const sx of [-1, 1]) trims.push(FM.beam(x + sx * (BANNER.w / 2 + 0.05) * scale, y, wall, x + sx * (BANNER.w / 2 + 0.05) * scale, y, z, 0.06, IRON));
    };
    for (const s of [-1, 1]) {
      hang(1.45, "gate", s * 5.35, 4.85, Z0, false);
      hang(1.3, "gate", s * 4.95, 5.6, back, true);
    }
    hang(1.8, "back", 0, 4.8, back, true);

    // The braziers either side of the portal on the landing.
    for (const [x, z] of GATE.braziers) {
      stone.push(moved(merge(brazier().stone), x, 0, z));
      glow.push(moved(merge(brazier().fire), x, 0, z));
    }

    // The back's candle pillars: a footing on the court, a tall block from it with a slit of blue light down its back,
    // and a pale cap.
    for (const s of [-1, 1]) {
      const x = s * 2.2, z = back - 0.35, foot = 0.45 - GATE.rise;
      stone.push(
        bevelBox({ w: 1, h: 0.45, d: 0.9, color: STONE_DK, bevel: 0.06, offset: { x, y: foot - 0.225, z } }),
        bevelBox({ w: 0.8, h: 4.2 - foot, d: 0.7, color: STONE[2], bevel: 0.07, offset: { x, y: (4.2 + foot) / 2, z } }),
        bevelBox({ w: 1, h: 0.2, d: 0.9, color: STONE_LT, bevel: 0.05, offset: { x, y: 4.3, z } })
      );
      lit.push(box({ w: 0.14, h: 3, d: 0.04, color: ICE, emissive: 1, offset: { x, y: 1.7, z: back - 0.715 } }));
    }

    // Blue cubes set into the towers' sides and backs.
    for (const s of [-1, 1]) {
      for (const [y, z] of [[2.25, -1.3], [0.75, -2.6]]) lit.push(box({ w: 0.34, h: 0.34, d: 0.34, color: ICE, emissive: 1, offset: { x: s * GATE.halfWidth, y, z } }));
      lit.push(box({ w: 0.34, h: 0.34, d: 0.34, color: ICE, emissive: 1, offset: { x: s * 5.6, y: 0.9, z: back } }));
    }

    // Candles: on the front edge of each tower step, along the landing's edge before the towers, on the back edge of the
    // towers' steps, and three on each pillar's cap.
    let count = 0;
    const lightCandle = (x, y, z) => {
      const c = candle(hash(count++, 5, 9) % 4);
      trims.push(moved(merge(c.wax), x, y, z));
      glow.push(moved(merge(c.flame), x, y, z));
    };
    for (const s of [-1, 1]) {
      for (const [x, y] of [[6.3, 5], [6.72, 5], [5.28, 6], [5.7, 6], [4.3, 7], [4.72, 7], [3.25, 8]]) lightCandle(s * x, y, Z0 - 0.22);
      for (const x of [4.2, 4.75, 5.4, 6.05, 6.65]) lightCandle(s * x, 0, STAIRS.from - 0.22);
      for (const [x, y] of [[6.5, 5], [5.5, 6], [4.5, 7]]) lightCandle(s * x, y, backAt(x) + 0.22);
      for (const dx of [-0.25, 0, 0.25]) lightCandle(s * 2.2 + dx, 4.4, back - 0.35 + (dx ? 0.12 : -0.12));
    }

    const geo = merge(...stone);
    geo.collisionGeometry = shell();
    return {
      stone: geo, trims: merge(...trims), banners: merge(...cloth), glow: noShadow(merge(...glow)), light: noShadow(merge(...lit)), field: field()
    };
  });

  // The walking height in the gate's frame at (x, z): a tread of the stairs, the landing, or the passage's floor through
  // the field; -Infinity off them (the court before the stairs is the isle's).
  const floorAt = (x, z) => {
    const ax = Math.abs(x);
    if (z > STAIRS.from) return z <= GATE.run && ax <= STAIRS.halfWidth ? -STAIRS.riser * Math.ceil((z - STAIRS.from) / STAIRS.tread - 1e-9) : -Infinity;
    if (z >= Z0) return ax <= GATE.halfWidth ? 0 : -Infinity;
    return ax <= PASSAGE.half && z >= PASSAGE.back ? 0 : -Infinity;
  };

  BL.bifrostGate = {
    GATE, RUNES, build, floorAt, runeBanner, lantern, brazier, runeWord, runeStrokes,
    PALETTE: { NAVY, GOLD, GOLD_LT, GOLD_DK, AMBER, BLUE, BLUE_MID, BLUE_LT, ICE, DEEP, STONE, STONE_LT, STONE_DK, DIRT, PAVE, STEP, WAX, IRON, WOOD, EMBER, GLASS, FLAME, RUNE_WHITE }
  };
})();
