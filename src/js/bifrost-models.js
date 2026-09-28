// ₿IFRÖST's chamber: a round hall of stone and bronze round a decorative ₿ mechanism, entered from the island by
// a short tunnel, with a ring of windows onto other worlds. Everything is built once for the page in the hall's
// own frame: the floor at y 0, the mechanism at the origin, the tunnel running out along +z to the field that
// joins it to the island, and each window at its bearing b on the wall, measured from +z toward +x (x = sin b,
// z = cos b): counter-clockwise seen from above, the mirror of the island's clock.
//
// A window is a row in `WINDOWS` and a slot in `SLOTS`, in the same order. A `travel` row walks through to its
// scene, and looks through a short passage lined with the field's blue onto a picture of that world (the scene
// takes the picture); a world not open yet is a `mirror`, a reflector that sends whoever touches it back into the
// hall. Opening a world is changing its row, and giving the scene its picture and stand-in.
//
// The name is carved in raised gilt letters (`word`), chiselled strokes swept along each letter's centre line,
// since the island's 3x5 sign alphabet has no ₿ or Ö. `supportAt`, `clearAt` and `walkable` are the walkable
// floor, shared by the scene's walkers and its tests.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { models, math } = BL;
  const { cached, variants, geometry, pushVert, face, box, bevelBox, lathe, ring, tube, merge, forward, moved, turnedX, turnedY, turnedZ, noShadow, makeVox, voxelGeometry } = models;
  const { hexToRgb } = math;
  const FM = BL.factoryModels;
  const TAU = Math.PI * 2;

  const STONE = ["#5e5751", "#544d48", "#69615a", "#4c4642"], STONE_DK = "#38332f", STONE_LT = "#7a7066";
  const BRONZE = "#a86a34", BRONZE_DK = "#6e4222", BRASS = "#c9962e", GOLD = "#ffc83a", GOLD_DK = "#b87a10";
  const TIMBER = "#8a5a32", TIMBER_DK = "#5c3a1e";
  const FIELD = "#3f8cff", FIELD_LT = "#bfe3ff", FIELD_DK = "#0b1a44", PASSAGE = "#10245e", CLOTH = "#1a2130";

  // The hall: its radius to the wall's inner face, the wall's height to the dome, the dome's crown, and the wall's
  // thickness in blocks of `unit`.
  const HALL = { r: 12.5, wall: 8.25, apex: 13, thick: 1.5, unit: 0.75 };
  // The way in: an arched opening `halfW` either side, its round top springing at `spring`, and the tunnel out along
  // +z to the field, which stands `field` from the middle of the hall. The island's gate will join it there.
  const ENTRY = { halfW: 2, spring: 2.4, field: HALL.r + 7, beyond: 1.2 };
  // A window's opening, the depth of its passage, the plane its field stands at past the wall's face, and how far
  // past that plane a traveller can walk while the scene fades.
  const WINDOW = { halfW: 1.8, spring: 2.6, depth: 4.5, plane: 0.3, recess: 1.6, flare: 0.6, rise: 0.8 };
  // The mechanism: the dais's two steps [radius, top], the plinth the Oogas cannot pass, and where the ₿ turns.
  const CORE = { steps: [[3.1, 0.25], [2.4, 0.5]], plinth: 1.5, glyphY: 3.4, rings: [1.6, 1.85, 2.1] };

  // The windows, left to right as the tunnel looks in, at their bearings round the wall. Only an open world carries a
  // label, and a `tint`: the colour its frame's rim and light glow in, the colour of that world.
  const WINDOWS = [
    { id: "west", kind: "mirror" },
    { id: "dsb", kind: "travel", scene: "dsb", name: "DSB Land", label: "DSB", tint: "#3f8cff" },
    { id: "north", kind: "mirror" },
    { id: "east", kind: "mirror" }
  ];
  const SLOTS = [-1.95, -2.75, 2.75, 1.95];
  if (WINDOWS.length !== SLOTS.length) throw new Error("₿IFRÖST has a window without a slot");
  // A window's frame: on the wall's face at its bearing, turned so local +z looks into the hall and x runs across.
  const frameOf = (i) => {
    const b = SLOTS[i];
    return { bearing: b, x: Math.sin(b) * HALL.r, z: Math.cos(b) * HALL.r, ry: b + Math.PI };
  };
  // Whether (across, y) is inside an arched opening `halfW` either side whose round top springs at `spring`.
  const inArch = (across, y, halfW, spring) => y >= 0 && Math.abs(across) <= halfW && (y <= spring || Math.hypot(across, y - spring) <= halfW);
  // Every opening in the wall: the way in at bearing 0, then the windows.
  const OPENINGS = [{ bearing: 0, halfW: ENTRY.halfW, spring: ENTRY.spring }, ...SLOTS.map((bearing) => ({ bearing, halfW: WINDOW.halfW, spring: WINDOW.spring }))];

  // ---- small builders ------------------------------------------------------------------------------

  // A flat face through `points` [[x, y, z], ...], wound to look toward (tx, ty, tz).
  const facing = (geo, points, color, emissive, tx, ty, tz) => {
    const ids = points.map(([x, y, z]) => pushVert(geo, x, y, z)), v = geo.verts;
    let nx = 0, ny = 0, nz = 0, mx = 0, my = 0, mz = 0;
    for (let k = 0; k < ids.length; k++) {
      const p = ids[k] * 3, q = ids[(k + 1) % ids.length] * 3;
      nx += (v[p + 1] - v[q + 1]) * (v[p + 2] + v[q + 2]);
      ny += (v[p + 2] - v[q + 2]) * (v[p] + v[q]);
      nz += (v[p] - v[q]) * (v[p + 1] + v[q + 1]);
      mx += v[p] / ids.length; my += v[p + 1] / ids.length; mz += v[p + 2] / ids.length;
    }
    face(geo, nx * (tx - mx) + ny * (ty - my) + nz * (tz - mz) < 0 ? ids.reverse() : ids, hexToRgb(color), { emissive });
    return geo;
  };
  // The outline of an arched opening, counter-clockwise from its bottom left: convex, so one face.
  const archOutline = (halfW, spring, z, n = 14) => [
    [-halfW, 0, z], [halfW, 0, z],
    ...Array.from({ length: n + 1 }, (_, k) => { const a = Math.PI * k / n; return [Math.cos(a) * halfW, spring + Math.sin(a) * halfW, z]; })
  ];
  // An arch of dressed stone round an opening, facing +z about z 0: voussoirs round the top with a pale keystone,
  // and jambs of blocks down both sides. `depth` is its thickness through the wall.
  const archRing = (halfW, spring, depth, band = 0.8) => {
    const geos = [], r = halfW + band / 2, n = Math.max(7, Math.round(Math.PI * r / 0.62) | 1);
    for (let k = 0; k <= n; k++) {
      const a = Math.PI * k / n, key = k === (n >> 1) && n % 2 === 0, w = r * Math.PI / n * 0.92;
      geos.push(moved(turnedZ(bevelBox({ w: key ? w * 1.3 : w, h: key ? band * 1.15 : band, d: key ? depth + 0.16 : depth, color: key ? STONE_LT : k % 2 ? STONE[3] : STONE[1], bevel: 0.08 }), a - Math.PI / 2), Math.cos(a) * r, spring + Math.sin(a) * r, 0));
    }
    const rows = Math.max(1, Math.round(spring / 0.62));
    for (const s of [-1, 1]) for (let row = 0; row < rows; row++) {
      const h = spring / rows;
      geos.push(bevelBox({ w: band, h: h - 0.04, d: depth, color: row % 2 ? STONE[0] : STONE[2], bevel: 0.07, offset: { x: s * r, y: h * (row + 0.5), z: 0 } }));
    }
    return merge(...geos);
  };
  // A point `d` along an arch's edge `halfW` out, from the foot of its left leg over the top to the foot of its right,
  // at z; `archEdge` gives the edge's whole length.
  const archEdge = (halfW, spring) => 2 * (spring - 0.1) + Math.PI * halfW;
  const archAt = (halfW, spring, z, d) => {
    const legs = spring - 0.1;
    if (d < legs) return { x: -halfW, y: 0.1 + d, z };
    if (d > legs + Math.PI * halfW) return { x: halfW, y: spring - (d - legs - Math.PI * halfW), z };
    const a = Math.PI - (d - legs) / halfW;
    return { x: Math.cos(a) * halfW, y: spring + Math.sin(a) * halfW, z };
  };
  // A round strip along an arch's edge and down both legs, at z: glowing neon, or brass trim with `emissive` 0.
  const archNeon = (halfW, spring, z, color, radius = 0.07, emissive = 1) => {
    const total = archEdge(halfW, spring);
    return tube({ path: (t) => archAt(halfW, spring, z, t * total), radius: () => radius, rings: 56, segments: 7, colorFn: () => color, emissive });
  };
  // A path through straight points [[x, y, z], ...], for `tube`.
  const through = (points) => {
    const lens = [0];
    for (let i = 1; i < points.length; i++) lens.push(lens[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1], points[i][2] - points[i - 1][2]));
    const total = lens[lens.length - 1];
    return (t) => {
      const d = t * total;
      let i = 1;
      while (i < points.length - 1 && lens[i] < d) i++;
      const a = points[i - 1], b = points[i], k = (d - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
      return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, z: a[2] + (b[2] - a[2]) * k };
    };
  };
  const ball = (r, color, emissive = 0) => lathe({ profile: Array.from({ length: 6 }, (_, k) => [Math.sin(k / 5 * Math.PI) * r, -Math.cos(k / 5 * Math.PI) * r]), segments: 10, color, emissive });
  // A disc `r` across and `d` thick facing +z about z 0, for medallions.
  const disc = (r, d, color, emissive = 0) => forward(lathe({ profile: [[0, -d / 2], [r, -d / 2], [r, d / 2], [0, d / 2]], segments: 20, color, emissive }));
  // A circle of round section `r` across in the plane z, for rims.
  const hoop = (r, z, thick, color, emissive = 0) => tube({ path: (t) => ({ x: Math.cos(t * TAU) * r, y: Math.sin(t * TAU) * r, z }), radius: () => thick, rings: 28, segments: 5, colorFn: () => color, emissive });
  // A banner as the concept hangs them: a long cloth of deep blue cut to a swallowtail, edged in gold, with a chevron at
  // its head and a big ₿ carved in raised gilt filling its width, on both faces; a bronze rod with brass finials, and a
  // gold tassel at each tail. The rod is at the origin and the cloth faces +z.
  const BANNER = { w: 1.12, h: 2.7, tail: 0.42, mark: 0.9 };
  const banner = cached(() => {
    const { w, h, tail } = BANNER, t = 0.02, cloth = geometry(), trim = [], y0 = -0.1;
    // The cloth in two convex halves either side of the notch, each face wound outward.
    for (const half of [[[-w / 2, y0], [0, y0], [0, y0 - h + tail], [-w / 2, y0 - h]], [[0, y0], [w / 2, y0], [w / 2, y0 - h], [0, y0 - h + tail]]]) {
      facing(cloth, half.map(([x, y]) => [x, y, t]), CLOTH, 0, 0, -h / 2, 5);
      facing(cloth, half.map(([x, y]) => [x, y, -t]), CLOTH, 0, 0, -h / 2, -5);
    }
    // One face's gold: the edging just inside the cloth's outline and the chevron at its head (`trim`), and the ₿
    // (`mark`), pressed flatter than the name's letters so it lies on the cloth.
    const face = () => {
      const i = 0.07, z = t + 0.012, edge = [[-w / 2 + i, y0 - i], [w / 2 - i, y0 - i], [w / 2 - i, y0 - h + i * 1.6], [0, y0 - h + tail + i * 1.2], [-w / 2 + i, y0 - h + i * 1.6]];
      const parts = edge.map((p, k) => { const q = edge[(k + 1) % edge.length]; return FM.beam(p[0], p[1], z, q[0], q[1], z, 0.04, GOLD, 0.25); });
      parts.push(FM.beam(-0.26, y0 - 0.2, z, 0, y0 - 0.34, z, 0.04, GOLD, 0.25), FM.beam(0, y0 - 0.34, z, 0.26, y0 - 0.2, z, 0.04, GOLD, 0.25));
      const mark = word("₿", BANNER.mark), v = mark.verts;
      for (let k = 2; k < v.length; k += 3) v[k] *= 0.35;
      return { trim: merge(...parts), mark: moved(mark, 0, y0 - 1.72, z - 0.01) };
    };
    const front = face(), back = face();
    trim.push(front.trim, turnedY(back.trim, Math.PI));
    for (const x of [-w / 2, w / 2]) trim.push(moved(ball(0.05, GOLD, 0.3), x, y0 - h - 0.06, 0), FM.beam(x, y0 - h, 0, x, y0 - h - 0.04, 0, 0.02, GOLD_DK));
    // The ₿ is shaded smooth, as the name is; everything else keeps its flat faces.
    const geo = merge(front.mark, turnedY(back.mark, Math.PI));
    geo.smooth = true;
    BL.hubModels.flatInto(geo,
      bevelBox({ w: w + 0.3, h: 0.09, d: 0.09, color: BRONZE_DK, bevel: 0.02 }),
      moved(ball(0.075, BRASS), -(w / 2 + 0.2), 0, 0), moved(ball(0.075, BRASS), w / 2 + 0.2, 0, 0),
      cloth, ...trim
    );
    return geo;
  });
  // Banners placed and merged into one geometry, shaded as `banner` is: `merge` drops `smooth`, and every flat face in a
  // banner has vertices of its own, so setting it again rounds only the ₿.
  const banners = (...placed) => Object.assign(merge(...placed), { smooth: true });

  // ---- the name, chiselled ---------------------------------------------------------------------------

  // Unit metrics, cap height 1: the stroke's width, how far it stands proud, and its chamfer. The face is gilt, the
  // chamfers catch the light and the walls sit in shadow.
  const GW = 0.2, GD = 0.14, GB = 0.045;
  const GILT = ["#ffc83a", "#ffe7a0", "#b87a10"].map(hexToRgb), GLOW = [0.3, 0.45, 0.12];
  // The corner `b` inside both lines through p with inward unit normals na and nb.
  const inset = (p, na, nb, b) => {
    const det = na[0] * nb[1] - na[1] * nb[0];
    if (Math.abs(det) < 1e-6) return [p[0] + na[0] * b, p[1] + na[1] * b];
    return [p[0] + b * (nb[1] - na[1]) / det, p[1] + b * (na[0] - nb[0]) / det];
  };
  // One stroke along centre-line points [[x, y], ...]: open, with chamfered ends square to the path (or along `caps`),
  // or closed. An end that runs into another stroke is `blind`: it has no end faces, and is buried past the other's
  // edge so none of its chamfer shows. Five strips (wall, chamfer, face, chamfer, wall), each with vertices of its
  // own, so smooth shading rounds curves along the stroke and keeps the creases across it.
  const stroke = (pts, { w = GW, closed = false, caps = [null, null], blind = [false, false] } = {}) => {
    const geo = geometry(), n = pts.length, h = w / 2, zs = GD - GB;
    const seg = (i) => { const a = pts[i], c = pts[(i + 1) % n], dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
    if (!closed) for (const [a, c, k] of [[pts[0], pts[1], 0], [pts[n - 1], pts[n - 2], 1]]) if (!blind[k] && Math.hypot(c[0] - a[0], c[1] - a[1]) < 2 * GB) throw new Error("A chiselled stroke's end is shorter than its chamfer");
    const L = [], R = [], FL = [], FR = [];
    for (let i = 0; i < n; i++) {
      const p = pts[i], end = !closed && (i === 0 || i === n - 1);
      const tin = closed || i > 0 ? seg((i - 1 + n) % n) : seg(0), tout = closed || i < n - 1 ? seg(i) : seg(n - 2);
      let l, r, fl, fr;
      if (end) {
        const t = i === 0 ? tout : tin, nrm = [-t[1], t[0]], k = i === 0 ? 0 : 1;
        if (blind[k]) {
          l = [p[0] + nrm[0] * h, p[1] + nrm[1] * h]; r = [p[0] - nrm[0] * h, p[1] - nrm[1] * h];
          fl = [p[0] + nrm[0] * (h - GB), p[1] + nrm[1] * (h - GB)]; fr = [p[0] - nrm[0] * (h - GB), p[1] - nrm[1] * (h - GB)];
        } else {
          const cap = caps[k] || nrm, along = cap[0] * nrm[0] + cap[1] * nrm[1], m = h / Math.abs(along) * Math.sign(along);
          l = [p[0] + cap[0] * m, p[1] + cap[1] * m];
          r = [2 * p[0] - l[0], 2 * p[1] - l[1]];
          // The cap's inward normal, toward the stroke's body.
          let cn = [-cap[1], cap[0]];
          const into = i === 0 ? t : [-t[0], -t[1]];
          if (cn[0] * into[0] + cn[1] * into[1] < 0) cn = [-cn[0], -cn[1]];
          fl = inset(l, [-nrm[0], -nrm[1]], cn, GB);
          fr = inset(r, nrm, cn, GB);
        }
      } else {
        const nin = [-tin[1], tin[0]], nout = [-tout[1], tout[0]];
        let mx = nin[0] + nout[0], my = nin[1] + nout[1];
        const ml = Math.hypot(mx, my);
        mx /= ml; my /= ml;
        const k = 1 / (mx * nin[0] + my * nin[1]);
        l = [p[0] + mx * h * k, p[1] + my * h * k]; r = [p[0] - mx * h * k, p[1] - my * h * k];
        fl = [p[0] + mx * (h - GB) * k, p[1] + my * (h - GB) * k]; fr = [p[0] - mx * (h - GB) * k, p[1] - my * (h - GB) * k];
      }
      L.push(l); R.push(r); FL.push(fl); FR.push(fr);
    }
    // A ribbon between two rails, wound so it looks away from the stroke's inside.
    const strip = (A, za, B, zb, part) => {
      const ia = A.map((q) => pushVert(geo, q[0], q[1], za)), ib = B.map((q) => pushVert(geo, q[0], q[1], zb));
      for (let i = 0; i < (closed ? n : n - 1); i++) { const j = (i + 1) % n; face(geo, [ia[i], ia[j], ib[j], ib[i]], GILT[part], { emissive: GLOW[part] }); }
    };
    strip(L, zs, L, 0, 2);
    strip(FL, GD, L, zs, 1);
    strip(FR, GD, FL, GD, 0);
    strip(R, zs, FR, GD, 1);
    strip(R, 0, R, zs, 2);
    if (!closed) for (const [i, k] of [[0, 0], [n - 1, 1]]) {
      if (blind[k]) continue;
      const q = (p, z) => pushVert(geo, p[0], p[1], z);
      const wall = [q(R[i], 0), q(L[i], 0), q(L[i], zs), q(R[i], zs)], bevel = [q(R[i], zs), q(L[i], zs), q(FL[i], GD), q(FR[i], GD)];
      face(geo, k === 0 ? wall.reverse() : wall, GILT[2], { emissive: GLOW[2] });
      face(geo, k === 0 ? bevel.reverse() : bevel, GILT[1], { emissive: GLOW[1] });
    }
    return geo;
  };
  // An arc sampled every `step` radians from a0 to a1, either way round.
  const arc = (cx, cy, rx, ry, a0, a1, step = Math.PI / 14) => {
    const k = Math.max(2, Math.ceil(Math.abs(a1 - a0) / step)), out = [];
    for (let i = 0; i <= k; i++) { const a = a0 + (a1 - a0) * i / k; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    return out;
  };
  // The point `len` on past p, away from q: a straight lead onto a curve's end, so the end is longer than its chamfer.
  const lead = (p, q, len) => { const dx = p[0] - q[0], dy = p[1] - q[1], l = Math.hypot(dx, dy); return [p[0] + dx / l * len, p[1] + dy / l * len]; };
  // A round dot, turned with the stroke's chamfer.
  const dot = (x, y, r) => {
    const zs = GD - GB;
    // Doubled profile points keep the creases, as the factory's turned parts do.
    return moved(forward(lathe({ profile: [[r, 0], [r, zs], [r, zs], [r - GB, GD], [r - GB, GD], [0, GD]], segments: 16, color: (t) => t < 0.2 ? "#b87a10" : t < 0.7 ? "#ffe7a0" : "#ffc83a", emissive: 0.3 })), x, y, 0);
  };
  const gh = GW / 2, top = 1 - gh, bury = 1 - GW + GB;
  // A bowl from the stem: a bar out at y0, round the right, back in at y1 (y0 > y1), its outer edge at `outer`.
  const bowl = (y0, y1, outer) => {
    const r = (y0 - y1) / 2;
    return arc(outer - gh - r, (y0 + y1) / 2, r, r, Math.PI / 2, -Math.PI / 2);
  };
  // Each glyph: its advance, and the strokes it is cut from, in unit metrics with the baseline at y 0.
  const GLYPHS = {
    "₿": { width: 0.62, parts: () => {
      // The upper bowl ends blind at the foot of its curve, inside the middle bar, which the lower bowl carries.
      const upper = bowl(top, 0.53, 0.56), lower = bowl(0.53, gh, 0.62);
      return [
        stroke([[gh, GW - GB], [gh, bury]], { blind: [true, true] }),
        stroke([[0, top], ...upper], { blind: [false, true] }),
        stroke([[GW - GB, 0.53], ...lower, [0, gh]], { blind: [true, false] }),
        ...[0.14, 0.36].flatMap((x) => [stroke([[x, 1 - GB], [x, 1.17]], { w: 0.1, blind: [true, false] }), stroke([[x, GB], [x, -0.17]], { w: 0.1, blind: [true, false] })])
      ];
    } },
    I: { width: GW, parts: () => [stroke([[gh, 0], [gh, 1]])] },
    F: { width: 0.54, parts: () => [stroke([[gh, 0], [gh, bury]], { blind: [false, true] }), stroke([[0, top], [0.54, top]]), stroke([[GW - GB, 0.53], [0.46, 0.53]], { blind: [true, false] })] },
    R: { width: 0.62, parts: () => [
      stroke([[gh, 0], [gh, bury]], { blind: [false, true] }),
      stroke([[0, top], ...bowl(top, 0.47, 0.6), [GW - GB, 0.47]], { blind: [false, true] }),
      stroke([[0.3, 0.47], [0.52, 0]], { caps: [null, [1, 0]], blind: [true, false] })
    ] },
    "Ö": { width: 0.8, parts: () => [
      stroke(arc(0.4, 0.5, 0.4 - gh, 0.5 - gh, 0, TAU, TAU / 36).slice(0, -1), { closed: true }),
      dot(0.24, 1.17, 0.085), dot(0.56, 1.17, 0.085)
    ] },
    S: { width: 0.64, parts: () => {
      const r = (1 - GW) / 4, rx = r * 1.12, cx = 0.32;
      const upper = arc(cx, 1 - gh - r, rx, r, 0.75, Math.PI * 1.5), lower = arc(cx, gh + r, rx, r, Math.PI / 2, -Math.PI + 0.75);
      return [stroke([lead(upper[0], upper[1], 0.1), ...upper, ...lower.slice(1), lead(lower[lower.length - 1], lower[lower.length - 2], 0.1)])];
    } },
    T: { width: 0.62, parts: () => [stroke([[0, top], [0.62, top]]), stroke([[0.31, 0], [0.31, bury]], { blind: [false, true] })] }
  };
  // Text `height` metres to the cap line, centred on x 0 with its baseline at y 0, facing +z with its back at z 0.
  // Throws on a letter with no glyph. Built fresh: callers cache what they keep.
  const word = (text, height, gap = 0.16) => {
    const chars = [...text], parts = [];
    for (const ch of chars) if (!GLYPHS[ch]) throw new Error(`No chiselled glyph for "${ch}"`);
    const total = chars.reduce((sum, ch) => sum + GLYPHS[ch].width, 0) + gap * (chars.length - 1);
    let x = -total / 2;
    for (const ch of chars) {
      for (const g of GLYPHS[ch].parts()) parts.push(moved(g, x, 0, 0));
      x += GLYPHS[ch].width + gap;
    }
    const geo = merge(...parts), v = geo.verts;
    for (let i = 0; i < v.length; i++) v[i] *= height;
    // `merge` does not carry `smooth`; the strokes' own vertices keep their creases.
    geo.smooth = true;
    geo.castShadow = false;
    geo.width = total * height;
    return geo;
  };
  // The name over the way in, on a stone plaque in a bronze frame with gold studs at its corners, held out from the
  // curving wall on two brackets so the wall never hides its ends, and high enough to clear the arch below: the
  // letters, and the plaque behind them. `out` is how far the plaque's face stands into the hall from the wall's line.
  const NAME = { height: 0.8, y: 6.35, out: 1.1 };
  const name = cached(() => {
    const letters = word("₿IFRÖST", NAME.height), w = letters.width + 1.1, h = NAME.height + 1, cy = NAME.height / 2, back = -0.32;
    const frame = [
      bevelBox({ w: w + 0.3, h: 0.16, d: 0.42, color: BRONZE, bevel: 0.04, offset: { y: cy + h / 2 + 0.08, z: -0.16 } }),
      bevelBox({ w: w + 0.3, h: 0.16, d: 0.42, color: BRONZE, bevel: 0.04, offset: { y: cy - h / 2 - 0.08, z: -0.16 } }),
      bevelBox({ w: 0.16, h: h + 0.32, d: 0.42, color: BRONZE, bevel: 0.04, offset: { x: -w / 2 - 0.08, y: cy, z: -0.16 } }),
      bevelBox({ w: 0.16, h: h + 0.32, d: 0.42, color: BRONZE, bevel: 0.04, offset: { x: w / 2 + 0.08, y: cy, z: -0.16 } })
    ];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) frame.push(moved(ball(0.1, GOLD, 0.35), sx * (w / 2 + 0.08), cy + sy * (h / 2 + 0.08), 0.08));
    // The brackets back to the wall, and the brass rail under the letters.
    for (const x of [-w / 3, w / 3]) frame.push(FM.beam(x, cy, back, x, cy + 0.2, back - NAME.out + 0.1, 0.16, BRONZE_DK), FM.beam(x, cy - 0.5, back, x, cy + 0.1, back - NAME.out + 0.1, 0.1, BRONZE_DK));
    frame.push(box({ w: letters.width + 0.3, h: 0.05, d: 0.08, color: BRASS, offset: { y: -0.16, z: 0.02 } }));
    return { letters, plaque: merge(bevelBox({ w, h, d: 0.3, color: STONE[1], bevel: 0.08, offset: { y: cy, z: -0.15 } }), ...frame) };
  });

  // ---- the hall ------------------------------------------------------------------------------------

  // The wall in blocks, cut through at every opening a little wider than its arch, so the dressed stone of the arch
  // covers the cut; the dome over it; and the floor (`floor`).
  const hall = cached(() => {
    const u = HALL.unit, R = HALL.r, T = HALL.thick, n = Math.ceil((R + T) / u), rows = Math.round(HALL.wall / u), v = makeVox();
    const cut = (x, y, z) => OPENINGS.some((o) => {
      const sr = Math.sin(o.bearing), cr = Math.cos(o.bearing), along = x * sr + z * cr;
      return along > R - 1 && inArch(x * cr - z * sr, y, o.halfW + 0.3, o.spring);
    });
    for (let i = -n; i < n; i++) for (let k = -n; k < n; k++) {
      const x = (i + 0.5) * u, z = (k + 0.5) * u, r = Math.hypot(x, z);
      if (r < R || r > R + T) continue;
      for (let j = 0; j < rows; j++) {
        const y = (j + 0.5) * u;
        if (cut(x, y, z)) continue;
        // Courses of dressed stone, a darker plinth course at the foot and a pale string course under the dome.
        v.set(i, j, k, j === 0 ? 5 : j === rows - 1 ? 6 : 1 + ((Math.floor(Math.atan2(x, z) * R / 1.5) + j * 3) & 3));
      }
    }
    const walls = voxelGeometry(v, { unit: u, palette: [null, ...STONE, STONE_DK, STONE_LT], origin: { x: 0, y: 0, z: 0 } });
    // The dome, top down so its faces look into the hall, with bronze ribs from the wall's head to the crown's ring.
    const crown = 1.4, dome = [[crown, HALL.apex], [R * 0.5, HALL.apex - 1.1], [R * 0.82, HALL.wall + 2.7], [R + 0.3, HALL.wall - 0.05]];
    const vault = lathe({ profile: dome, segments: 48, color: (t) => t < 0.3 ? "#4a433e" : t < 0.7 ? "#433d38" : STONE_DK });
    const cap = lathe({ profile: [[0, HALL.apex + 0.3], [crown + 0.1, HALL.apex + 0.02]], segments: 24, color: BRONZE_DK });
    const domeAt = (t) => {
      const f = t * (dome.length - 1), i = Math.min(dome.length - 2, Math.floor(f)), k = f - i;
      return [dome[i + 1][0] + (dome[i][0] - dome[i + 1][0]) * (1 - k), dome[i + 1][1] + (dome[i][1] - dome[i + 1][1]) * (1 - k)];
    };
    const ribs = [];
    for (let s = 0; s < 12; s++) {
      const a = (s + 0.5) / 12 * TAU;
      ribs.push(tube({ path: (t) => { const [r, y] = domeAt(t); return { x: Math.sin(a) * (r - 0.18), y: y - 0.12, z: Math.cos(a) * (r - 0.18) }; }, radius: () => 0.13, rings: 18, segments: 6, colorFn: (t) => t > 0.9 ? BRASS : BRONZE }));
    }
    const rim = [ring({ r: R - 0.05, thickness: 0.14, y: HALL.wall, segments: 64, color: BRONZE }), ring({ r: crown, thickness: 0.16, y: HALL.apex - 0.1, segments: 32, color: BRASS })];
    return { walls, dome: merge(vault, cap, ...ribs, ...rim), ...floor() };
  });

  // The floor as the concept lays it: flags in rings round the dais over dark grout, each course broken to bond with
  // the last and each flag a shade of its course's stone; a pale court round the dais, a ring of ₿ cut into the next
  // course between bronze bands, bronze spokes across the middle courses, and bigger flags out to the wall. `inlay` is
  // the metal and the cut ₿, a hair above the flags.
  const COURSES = [
    [CORE.steps[0][0], 4.3, 20, ["#8d8275", "#83786c", "#978c7f"]],
    [4.45, 5.95, 24, ["#4f4741", "#564e47", "#4a433d"]],
    [6.1, 7.75, 36, ["#6d645b", "#665d55", "#736a60"]],
    [7.75, 9.4, 44, ["#5f574f", "#685f56", "#5a524b"]],
    [9.55, 11.2, 52, ["#4f4842", "#57504a", "#4b453f"]],
    [11.2, HALL.r + 0.8, 60, ["#5b534c", "#534c46", "#615951"]]
  ];
  const BANDS = [[4.3, 4.45, BRONZE], [5.95, 6.1, BRASS], [9.4, 9.55, BRONZE]];
  const floor = () => {
    const grout = lathe({ profile: [[HALL.r + 0.8, 0], [CORE.steps[0][0], 0]], segments: 64, color: "#2b2622" }), flags = geometry(), metal = geometry(), gap = 0.035;
    const up = (geo, pts, color, emissive = 0) => facing(geo, pts, color, emissive, pts[0][0], 50, pts[0][2]);
    COURSES.forEach(([r0, r1, n, tones], c) => {
      for (let k = 0; k < n; k++) {
        const a0 = (k + (c % 2) * 0.5) / n * TAU, a1 = a0 + TAU / n, i0 = r0 + gap, i1 = r1 - gap, g0 = gap / i0, g1 = gap / i1;
        const pts = [[i0, a0 + g0], [i1, a0 + g1], [i1, (a0 + a1) / 2], [i1, a1 - g1], [i0, a1 - g0]].map(([r, a]) => [Math.sin(a) * r, 0.01, Math.cos(a) * r]);
        up(flags, pts, tones[(k * 7 + c * 3 + (k * k) % 5) % tones.length]);
      }
    });
    for (const [r0, r1, color] of BANDS) for (let k = 0; k < 64; k++) {
      const a0 = k / 64 * TAU, a1 = (k + 1) / 64 * TAU;
      up(metal, [[r0, a0], [r1, a0], [r1, a1], [r0, a1]].map(([r, a]) => [Math.sin(a) * r, 0.014, Math.cos(a) * r]), color, 0.12);
    }
    // Bronze spokes on the joints between the middle courses' flags, from the brass band out to the outer bronze one.
    for (let k = 0; k < 12; k++) {
      const a = (k + 0.5) / 12 * TAU, s = Math.sin(a), c = Math.cos(a), px = c * 0.04, pz = -s * 0.04;
      up(metal, [[s * 6.1 - px, 0.014, c * 6.1 - pz], [s * 6.1 + px, 0.014, c * 6.1 + pz], [s * 9.4 + px, 0.014, c * 9.4 + pz], [s * 9.4 - px, 0.014, c * 9.4 - pz]], BRONZE, 0.12);
    }
    // Twelve ₿ cut into the dark course, turned to read from the dais, in the warm gold the concept lights them.
    const cut = [];
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * TAU + TAU / 24;
      cut.push(moved(turnedY(turnedX(FM.smoothBitcoin(0.62, 0.01, "#e0923a", 0.4), -Math.PI / 2), a + Math.PI), Math.sin(a) * 5.2, 0.016, Math.cos(a) * 5.2));
    }
    return { floor: merge(grout, flags), inlay: noShadow(merge(metal, ...cut)) };
  };

  // Stone pilasters between the openings, each with a banner of the ₿ on its face, a bush on its capital and a lantern
  // on a post before it.
  const PILLARS = (() => {
    const at = OPENINGS.map((o) => o.bearing).sort((a, b) => a - b), out = [];
    for (let i = 0; i < at.length; i++) {
      const a = at[i], b = i + 1 < at.length ? at[i + 1] : at[0] + TAU;
      out.push((a + b) / 2);
    }
    return out;
  })();
  const PILLAR_R = HALL.r - 0.25, POST_R = HALL.r - 2.2;
  const pillars = cached(() => {
    const geos = [], cloth = [];
    for (const b of PILLARS) {
      const sr = Math.sin(b), cr = Math.cos(b), place = (g) => moved(turnedY(g, b + Math.PI), sr * PILLAR_R, 0, cr * PILLAR_R);
      geos.push(place(merge(
        bevelBox({ w: 1.3, h: HALL.wall, d: 0.9, color: STONE[2], bevel: 0.1, offset: { y: HALL.wall / 2 } }),
        bevelBox({ w: 1.55, h: 0.5, d: 1.1, color: STONE_DK, bevel: 0.08, offset: { y: 0.25 } }),
        bevelBox({ w: 1.5, h: 0.16, d: 1.05, color: BRONZE, bevel: 0.04, offset: { y: 0.58 } }),
        bevelBox({ w: 1.5, h: 0.16, d: 1.05, color: BRONZE, bevel: 0.04, offset: { y: HALL.wall - 0.5 } }),
        bevelBox({ w: 1.62, h: 0.4, d: 1.15, color: STONE_LT, bevel: 0.08, offset: { y: HALL.wall - 0.2 } })
      )));
      cloth.push(place(moved(merge(banner()), 0, 7.35, 0.52)));
    }
    return { stone: merge(...geos), banners: banners(...cloth) };
  });

  // ---- the openings -------------------------------------------------------------------------------

  // The arch round the way in, turned to face the hall, and the tunnel out to the field: coursed walls under a
  // barrel vault, three ribs of stone with blue studs, banners between the ribs, the field's strips down the floor,
  // and the field itself at the far end, set in an arch of its own between bronze emitters. Past the field the tunnel
  // is closed.
  const tunnel = cached(() => {
    const { halfW, spring, field } = ENTRY, R = HALL.r, z0 = R - 0.4, z1 = field + ENTRY.beyond + 0.2, len = z1 - z0, mid = (z0 + z1) / 2;
    const geos = [], lit = [], wall = halfW + 0.35, rows = Math.round(spring / 0.6);
    // A hair under the hall's grout, which reaches into the doorway.
    geos.push(box({ w: 2 * wall + 0.8, h: 0.3, d: len, color: STONE[3], offset: { y: -0.16, z: mid } }));
    for (const s of [-1, 1]) for (let row = 0; row < rows; row++) for (let z = z0; z < z1 - 0.3; z += 1.2) {
      const h = spring / rows;
      geos.push(bevelBox({ w: 0.7, h: h - 0.04, d: 1.16, color: (row + Math.round(z / 1.2)) % 2 ? STONE[0] : STONE[2], bevel: 0.07, offset: { x: s * wall, y: h * (row + 0.5), z: Math.min(z + 0.6, z1 - 0.6) } }));
    }
    const vr = halfW + 0.35, n = 11;
    for (let k = 0; k <= n; k++) {
      const a = Math.PI * k / n;
      geos.push(moved(turnedZ(box({ w: vr * Math.PI / n * 1.05, h: 0.5, d: len, color: k % 2 ? STONE[1] : STONE[3] }), a - Math.PI / 2), Math.cos(a) * (vr + 0.2), spring + Math.sin(a) * (vr + 0.2), mid));
    }
    for (const z of [R + 1.4, R + 3.7, field - 1.6]) {
      geos.push(moved(archRing(halfW + 0.1, spring, 0.5, 0.5), 0, 0, z));
      for (let k = 1; k < 6; k++) {
        const a = Math.PI * k / 6, r = halfW + 0.35;
        lit.push(box({ w: 0.14, h: 0.14, d: 0.56, color: FIELD, emissive: 1, offset: { x: Math.cos(a) * r, y: spring + Math.sin(a) * r, z } }));
      }
    }
    // A banner on each wall between the ribs, turned to face across the tunnel.
    const cloth = [];
    for (const z of [R + 2.55, R + 4.55]) for (const s of [-1, 1]) cloth.push(moved(turnedY(merge(banner()), -s * Math.PI / 2), s * (halfW - 0.05), 3.75, z));
    for (const x of [-1.2, 1.2]) lit.push(box({ w: 0.12, h: 0.02, d: field - z0, color: FIELD, emissive: 0.9, offset: { x, y: 0.01, z: (z0 + field) / 2 } }));
    // The field's arch and emitters, and the rock that closes the tunnel past it.
    geos.push(moved(turnedY(archRing(halfW, spring, 0.7), Math.PI), 0, 0, field + 0.2));
    for (const s of [-1, 1]) {
      geos.push(bevelBox({ w: 0.36, h: spring + 0.6, d: 0.36, color: BRONZE_DK, bevel: 0.05, offset: { x: s * (halfW - 0.05), y: (spring + 0.6) / 2, z: field - 0.35 } }));
      for (let y = 0.5; y < spring + 0.3; y += 0.45) lit.push(box({ w: 0.44, h: 0.1, d: 0.44, color: FIELD_LT, emissive: 0.95, offset: { x: s * (halfW - 0.05), y, z: field - 0.35 } }));
    }
    geos.push(box({ w: 2 * wall + 1.4, h: spring + halfW + 1.6, d: 0.6, color: STONE_DK, offset: { y: (spring + halfW + 1.6) / 2, z: z1 + 0.3 } }));
    return { stone: merge(...geos), banners: banners(...cloth), glow: noShadow(merge(...lit)), mouth: turnedY(archRing(halfW + 0.2, spring, 1.3), Math.PI) };
  });

  // The field, facing +z about z 0: a deep blue sheet filling an arched opening, a bright rim round its edge, and the
  // swirl, three arms of light that the scene turns about the sheet's middle (`swirlY`) so the field churns.
  const fieldSheet = (halfW, spring) => {
    const fill = facing(geometry(), archOutline(halfW, spring, 0), FIELD_DK, 0.9, 0, spring, 1);
    return noShadow(merge(fill, archNeon(halfW - 0.06, spring, 0.03, FIELD_LT, 0.06)));
  };
  const swirl = (radius) => {
    const arms = [];
    for (let k = 0; k < 3; k++) {
      const a0 = k / 3 * TAU;
      arms.push(tube({ path: (t) => { const a = a0 + t * Math.PI * 1.7, r = 0.18 + t * radius; return { x: Math.cos(a) * r, y: Math.sin(a) * r, z: 0.05 }; }, radius: (t) => 0.035 + t * 0.05, rings: 28, segments: 5, colorFn: (t) => t < 0.5 ? FIELD_LT : FIELD, emissive: 1 }));
    }
    arms.push(moved(forward(lathe({ profile: [[0.3, 0], [0, 0.04]], segments: 12, color: "#e8f6ff", emissive: 1 })), 0, 0, 0.06));
    return noShadow(merge(...arms));
  };
  const entryField = cached(() => ({ sheet: fieldSheet(ENTRY.halfW, ENTRY.spring), swirl: swirl(1.55), swirlY: ENTRY.spring - 0.1 }));

  // A window, in its frame. The frame stands proud of the wall as the concept draws it: a deep ring of dressed stone
  // edged in brass inside and out, a second course stepped back behind it, plinths under the jambs, brass imposts
  // where the arch springs, and a gilt ₿ medallion on the keystone. Inside it runs the field's blue: a bright strip
  // round the opening, a deeper one behind, and studs of light along the soffit, all at part strength so the scene
  // can brighten an open world's as someone comes near (`glow`). A `travel` window has a passage going back to where its picture
  // hangs, lined in the field's dark blue with bright ribs; a `mirror` has a reflector just inside the arch.
  const WINDOW_TOP = WINDOW.spring + WINDOW.halfW;
  // The frame's ring (its width and depth), the stepped course behind it (width and depth), and how far the whole frame
  // stands proud of the wall's line, so the curving wall never covers the course: at the course's width the wall
  // comes about 0.4 m nearer the hall, and its blocks as much again. `front` and `courseFront` are the two faces.
  const PROUD = 0.45;
  const FRAME = { band: 1.2, depth: 1.5, course: 0.4, courseDepth: 0.8, proud: PROUD, front: PROUD + 0.75, courseFront: PROUD + 0.45 };
  const archStone = cached(() => {
    const { halfW, spring } = WINDOW, { band, depth, course, courseDepth, proud } = FRAME, front = FRAME.front + 0.03, out = halfW + band, jamb = halfW + band / 2;
    const geos = [moved(archRing(halfW, spring, depth, band), 0, 0, proud), moved(archRing(out, spring, courseDepth, course), 0, 0, FRAME.courseFront - courseDepth / 2)];
    geos.push(archNeon(halfW + 0.03, spring, front, BRASS, 0.06, 0), archNeon(out - 0.03, spring, front, BRASS, 0.06, 0), archNeon(out + course - 0.03, spring, FRAME.courseFront + 0.02, BRASS, 0.05, 0));
    for (const s of [-1, 1]) {
      geos.push(bevelBox({ w: band + 0.3, h: 0.7, d: depth + 0.3, color: STONE_DK, bevel: 0.08, offset: { x: s * jamb, y: 0.35, z: proud } }));
      geos.push(bevelBox({ w: band + 0.2, h: 0.12, d: depth + 0.2, color: BRASS, bevel: 0.03, offset: { x: s * jamb, y: 0.74, z: proud } }));
      geos.push(bevelBox({ w: band + 0.26, h: 0.2, d: depth + 0.22, color: BRASS, bevel: 0.04, offset: { x: s * jamb, y: spring, z: proud } }));
    }
    const key = spring + halfW + band / 2;
    geos.push(moved(disc(0.44, 0.1, BRONZE_DK), 0, key, front + 0.1), moved(hoop(0.4, 0, 0.035, GOLD, 0.3), 0, key, front + 0.16), moved(FM.smoothBitcoin(0.56, 0.06, GOLD, 0.8), 0, key, front + 0.18));
    return merge(...geos);
  });
  const archGlow = cached(() => {
    const { halfW, spring } = WINDOW, studs = [], edge = halfW - 0.02, total = archEdge(edge, spring);
    for (let d = 0.25; d < total; d += 0.42) studs.push(box({ w: 0.12, h: 0.12, d: 0.12, color: "#e8f6ff", emissive: 0.4, offset: archAt(edge, spring, FRAME.proud, d) }));
    return noShadow(merge(archNeon(halfW - 0.1, spring, FRAME.front - 0.4, FIELD_LT, 0.13, 0.35), archNeon(halfW - 0.08, spring, -0.25, FIELD, 0.08, 0.35), ...studs));
  });
  // An open world's frame is marked out by a glowing rim just outside its ring, growing outward so it never covers the
  // keystone's ₿, and a thinner one round the stepped course behind: its world's `tint` at rest, then in `RIM_STEPS` steps thicker and whiter, up to
  // white-hot, which the scene climbs as someone comes near. Cached by tint and step.
  const RIM_STEPS = 8;
  const blend = (a, b, t) => "#" + hexToRgb(a).map((v, k) => Math.round(v + (hexToRgb(b)[k] - v) * t).toString(16).padStart(2, "0")).join("");
  const rims = new Map();
  const portalRim = (tint, k) => {
    const key = `${tint}|${k}`;
    if (rims.has(key)) return rims.get(key);
    const t = k / (RIM_STEPS - 1), { halfW, spring } = WINDOW, out = halfW + FRAME.band;
    const color = blend(tint, "#f4f9ff", t * 0.9), glow = 0.65 + 0.35 * t;
    const r = 0.09 + 0.14 * t;
    const geo = noShadow(merge(archNeon(out - 0.06 + r, spring, FRAME.front + 0.05, color, r, glow), archNeon(out + FRAME.course, spring, FRAME.courseFront + 0.04, color, 0.05 + 0.08 * t, glow)));
    rims.set(key, geo);
    return geo;
  };
  // A label's board hangs from the wall on two brass rods, `w` wide, its middle at y 0, the rods climbing `up` and back
  // `back` to the wall.
  const hangers = new Map();
  const hanger = (w, up, back) => {
    const key = `${w.toFixed(2)}|${up}|${back}`;
    if (!hangers.has(key)) hangers.set(key, merge(...[-w / 2 + 0.12, w / 2 - 0.12].map((x) => FM.beam(x, 0.3, -0.02, x, up, -back, 0.04, BRASS))));
    return hangers.get(key);
  };
  const passage = cached(() => {
    const { halfW, spring, depth, flare, rise } = WINDOW, geo = geometry(), glow = [], near = halfW + 0.05, far = halfW + flare, h0 = spring + halfW + 0.05, h1 = h0 + rise;
    // The walls and roof look in, toward the passage's middle; the floor is a slate quad of its own, faintly lit.
    facing(geo, [[-near, 0, 0], [-far, 0, -depth], [-far, h1, -depth], [-near, h0, 0]], PASSAGE, 0.3, 0, h0 / 2, -depth / 2);
    facing(geo, [[near, 0, 0], [far, 0, -depth], [far, h1, -depth], [near, h0, 0]], PASSAGE, 0.3, 0, h0 / 2, -depth / 2);
    facing(geo, [[-near, h0, 0], [near, h0, 0], [far, h1, -depth], [-far, h1, -depth]], PASSAGE, 0.3, 0, 0, -depth / 2);
    facing(geo, [[-far, 0.005, -depth], [far, 0.005, -depth], [near, 0.005, 0], [-near, 0.005, 0]], "#3c3e52", 0.15, 0, 1, -depth / 2);
    for (const z of [-1.2, -2.4, -3.6]) {
      const k = -z / depth, w = near + (far - near) * k - 0.04, h = h0 + (h1 - h0) * k - 0.04;
      glow.push(tube({ path: through([[-w, 0.02, z], [-w, h, z], [w, h, z], [w, 0.02, z]]), radius: () => 0.05, rings: 24, segments: 5, colorFn: () => FIELD, emissive: 0.5 }));
    }
    return { walls: geo, glow: noShadow(merge(...glow)), picture: { w: 2 * far, h: h1, z: -depth + 0.02 } };
  });
  // The picture's quad, `w` by `h` from the floor up, facing +z at `z`, with `asset` (an image asset, as `outsideView`
  // takes it) over it.
  const pictureQuad = (asset, { w, h, z }) => {
    const geo = { verts: [-w / 2, 0, z, w / 2, 0, z, w / 2, h, z, -w / 2, h, z], faces: [{ i: [0, 1, 2, 3], color: [0, 0, 0], emissive: 0 }], lines: [], castShadow: false };
    geo.imageSurface = { asset, rect: [-w / 2, 0, w, h] };
    return geo;
  };
  // Until a picture is taken, the window shows the world simply: DSB Land's purple night over a band of its falls,
  // with stars.
  const dsbStandIn = cached(() => {
    const { w, h, z } = passage().picture, parts = [];
    const band = (y0, y1, color, emissive) => parts.push(box({ w, h: y1 - y0, d: 0.05, color, emissive, offset: { y: (y0 + y1) / 2, z } }));
    band(0, h * 0.3, "#403054", 0.55); band(h * 0.3, h * 0.36, "#49ddd9", 0.8); band(h * 0.36, h * 0.62, "#2a1648", 0.7); band(h * 0.62, h, "#12082a", 0.8);
    for (let k = 0; k < 9; k++) parts.push(box({ w: 0.14, h: 0.14, d: 0.04, color: k % 3 ? "#49ddd9" : "#ffdf38", emissive: 1, offset: { x: ((k * 0.618) % 1 - 0.5) * w * 0.85, y: h * (0.66 + ((k * 0.37) % 1) * 0.3), z: z + 0.04 } }));
    return noShadow(merge(...parts));
  });
  // A window's mirror, `MIRROR_Z` past the wall's face inside its arch: one quad facing +z at z 0, a reflector keyed on
  // its own geometry, so each window has a glass of its own (by slot). `flash` is the same opening in the field's blue
  // a hair in front, which the scene fades in when the glass sends someone back; `backing` closes the arch behind the
  // glass, which shows nothing until its first capture and on Canvas 2D only its sheen. Every window shares those two.
  const MIRROR_Z = 0.25;
  const quadAt = (z, color, emissive) => ({
    verts: [-WINDOW.halfW, 0.05, z, WINDOW.halfW, 0.05, z, WINDOW.halfW, WINDOW_TOP, z, -WINDOW.halfW, WINDOW_TOP, z],
    faces: [{ i: [0, 1, 2, 3], color: hexToRgb(color), emissive }], lines: [], castShadow: false
  });
  const mirrorShared = cached(() => ({
    flash: quadAt(0.03, "#5fb8ff", 1),
    backing: box({ w: 2 * WINDOW.halfW + 0.4, h: WINDOW_TOP + 0.4, d: 0.2, color: "#0a0d16", offset: { y: (WINDOW_TOP + 0.4) / 2, z: -MIRROR_Z - 0.35 } })
  }));
  const mirror = variants(() => ({ glass: { ...quadAt(0, "#8395a6", 0), reflector: true }, ...mirrorShared() }));

  // ---- the mechanism ------------------------------------------------------------------------------

  // The dais and the plinth, turned in stone and bronze; the ₿ that turns over it; three rings of bronze and brass that
  // turn about it, each with gold studs; and the beam of light from over the ₿ to the crown's ring.
  const coreBase = cached(() => {
    const [[r0, y0], [r1, y1]] = CORE.steps, p = CORE.plinth;
    const dais = lathe({ profile: [[r0, 0], [r0, y0], [r1, y0], [r1, y1], [p + 0.3, y1], [p + 0.3, y1 + 0.02]], segments: 40, color: (t) => t < 0.4 ? STONE[2] : STONE[1] });
    const plinth = lathe({ profile: [[p, y1], [p, y1 + 0.25], [p - 0.25, y1 + 0.35], [p - 0.45, y1 + 1.5], [p - 0.2, y1 + 1.65], [p - 0.2, y1 + 1.8], [0.6, y1 + 1.9], [0, y1 + 1.92]], segments: 24, color: (t) => t < 0.2 || t > 0.6 ? BRASS : BRONZE_DK });
    const lamps = [];
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * TAU;
      lamps.push(box({ w: 0.22, h: 0.1, d: 0.22, color: FIELD, emissive: 1, offset: { x: Math.sin(a) * (r1 - 0.25), y: y1 + 0.05, z: Math.cos(a) * (r1 - 0.25) } }));
    }
    return { stone: merge(dais, plinth), glow: noShadow(merge(ring({ r: p - 0.35, thickness: 0.06, y: y1 + 1.95, segments: 32, color: GOLD, emissive: 1 }), ...lamps)) };
  });
  const coreGlyph = cached(() => FM.smoothBitcoin(1.9, 0.32, GOLD, 1));
  const coreRings = cached(() => CORE.rings.map((r, i) => {
    const studs = [];
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + i * 0.4; studs.push(moved(ball(0.09, GOLD, 0.6), Math.cos(a) * r, 0, Math.sin(a) * r)); }
    return merge(ring({ r, thickness: 0.055 + i * 0.01, segments: 48, color: i === 1 ? BRASS : BRONZE }), ...studs);
  }));
  const coreBeam = cached(() => noShadow(lathe({ profile: [[0.1, CORE.glyphY + 1.2], [0.1, HALL.apex], [0, HALL.apex + 0.1]], segments: 10, color: "#ffd98a", emissive: 0.85 })));

  // ---- the furniture ------------------------------------------------------------------------------------

  // The court's lamp posts round the dais, as the concept rings it, clear of the ways to the windows and the tunnel;
  // benches of timber round the middle of the hall facing in; and stone planters of bushes flanking each window. The
  // scene stands a bush on each planter and on each pilaster's capital.
  const COURT = [25, 70, 135, 180, -135, -70, -25].map((d) => d * Math.PI / 180), COURT_R = 3.8;
  const BENCHES = [75, 135, -135, -75].map((d) => d * Math.PI / 180), BENCH_R = 7.4;
  const PLANTERS = SLOTS.flatMap((b) => [b - 0.32, b + 0.32]), PLANTER_R = 11, PLANTER_TOP = 0.62;
  const courtPosts = cached(() => merge(...COURT.flatMap((a) => {
    const x = Math.sin(a) * COURT_R, z = Math.cos(a) * COURT_R;
    return [
      bevelBox({ w: 0.36, h: 0.14, d: 0.36, color: STONE_DK, bevel: 0.04, offset: { x, y: 0.07, z } }),
      bevelBox({ w: 0.2, h: 0.92, d: 0.2, color: TIMBER_DK, bevel: 0.04, offset: { x, y: 0.58, z } }),
      bevelBox({ w: 0.3, h: 0.08, d: 0.3, color: BRONZE_DK, bevel: 0.02, offset: { x, y: 1.02, z } })
    ];
  })));
  const bench = cached(() => merge(
    bevelBox({ w: 1.9, h: 0.1, d: 0.26, color: TIMBER, bevel: 0.03, offset: { y: 0.5, z: -0.14 } }),
    bevelBox({ w: 1.9, h: 0.1, d: 0.26, color: TIMBER, bevel: 0.03, offset: { y: 0.5, z: 0.14 } }),
    bevelBox({ w: 0.13, h: 0.46, d: 0.5, color: TIMBER_DK, bevel: 0.03, offset: { x: -0.72, y: 0.23 } }),
    bevelBox({ w: 0.13, h: 0.46, d: 0.5, color: TIMBER_DK, bevel: 0.03, offset: { x: 0.72, y: 0.23 } }),
    bevelBox({ w: 1.44, h: 0.08, d: 0.08, color: TIMBER_DK, bevel: 0.02, offset: { y: 0.16 } })
  ));
  const planter = cached(() => merge(
    bevelBox({ w: 1.1, h: 0.56, d: 1.1, color: STONE[2], bevel: 0.07, offset: { y: 0.28 } }),
    bevelBox({ w: 1.2, h: 0.09, d: 1.2, color: BRONZE, bevel: 0.03, offset: { y: 0.57 } }),
    box({ w: 0.94, h: 0.05, d: 0.94, color: "#3a2a1e", offset: { y: 0.6 } })
  ));

  // Lanterns in the factory's style: on posts before the pilasters, on the court's posts, hung in the tunnel, and two
  // from arms beside the name; `lights` is where each glows.
  const lighting = cached(() => {
    const lamps = [], plaque = name().letters.width / 2 + 0.55 + 0.55, arm = HALL.r - NAME.out;
    for (const b of PILLARS) lamps.push(["post", Math.sin(b) * POST_R, 0, Math.cos(b) * POST_R, b + Math.PI / 2]);
    for (const a of COURT) lamps.push(["rail", Math.sin(a) * COURT_R, 0, Math.cos(a) * COURT_R]);
    for (const z of [HALL.r + 2.55, HALL.r + 4.85]) for (const x of [-1.25, 1.25]) lamps.push(["hang", x, ENTRY.spring + 1.55, z]);
    for (const x of [-plaque, plaque]) lamps.push(["hang", x, NAME.y + NAME.height + 0.9, arm]);
    const lit = FM.lanterns(lamps, []);
    const arms = [-plaque, plaque].map((x) => FM.beam(x, NAME.y + NAME.height + 0.9, HALL.r - 0.1, x, NAME.y + NAME.height + 0.9, arm - 0.08, 0.1, BRONZE_DK));
    return { ...lit, frame: merge(lit.frame, ...arms) };
  });

  // Set dressing from the shared kit: stores and rune stones either side of the way in, vines over it. `DRESS` is also
  // what the walkers step round: [kind, x, z, turns, variant, radius].
  const DRESS = [
    ["runeStone", -3.4, HALL.r - 1.6, 0, 0, 0.6], ["runeStone", 3.4, HALL.r - 1.6, 0, 1, 0.6],
    ["crate", -6.2, 10.2, 1, 0, 0.6], ["barrel", -7.2, 9.4, 0, 1, 0.45], ["crate", 6.4, 10, 0, 1, 0.6]
  ];
  const dressing = cached(() => {
    const set = BL.dressing.set();
    for (const [kind, x, z, turns, variant] of DRESS) set.put(kind, x, 0, z, turns, variant);
    set.put("vine", -2.6, 5.5, HALL.r - 0.55, 2, 0);
    set.put("vine", 2.4, 5.2, HALL.r - 0.55, 2, 1);
    return set.build();
  });

  // ---- where the walkers go ----------------------------------------------------------------------------

  // The floor is flat but for the dais's two steps; past the wall's line there is floor only in the tunnel and in a
  // window's opening.
  const supportAt = (x, z) => {
    const r = Math.hypot(x, z), [[r0, y0], [r1, y1]] = CORE.steps;
    return r < r1 ? y1 : r < r0 ? y0 : 0;
  };
  // Obstacles as circles [x, z, radius]: the lantern posts, the court's posts, the benches (two circles each), the
  // planters, the fronts of the windows' frames either side, and the dressing.
  const BLOCKS = new Float32Array([
    ...PILLARS.flatMap((b) => [Math.sin(b) * POST_R, Math.cos(b) * POST_R, 0.25]),
    ...COURT.flatMap((a) => [Math.sin(a) * COURT_R, Math.cos(a) * COURT_R, 0.22]),
    ...BENCHES.flatMap((a) => [-0.55, 0.55].flatMap((t) => [Math.sin(a) * BENCH_R + Math.cos(a) * t, Math.cos(a) * BENCH_R - Math.sin(a) * t, 0.5])),
    ...PLANTERS.flatMap((a) => [Math.sin(a) * PLANTER_R, Math.cos(a) * PLANTER_R, 0.72]),
    ...SLOTS.flatMap((b) => [-1, 1].flatMap((s) => {
      const r = HALL.r - FRAME.front + 0.3, x = WINDOW.halfW + FRAME.band / 2;
      return [Math.sin(b) * r + Math.cos(b) * s * x, Math.cos(b) * r - Math.sin(b) * s * x, 0.55];
    })),
    ...DRESS.flatMap(([, x, z, , , r]) => [x, z, r])
  ]);
  // How far past the wall's face a walker's body may reach in each window: a traveller walks on through the field
  // while the scene fades; a mirror stops them just short of the glass.
  const reachOf = (kind) => kind === "travel" ? WINDOW.plane + WINDOW.recess : MIRROR_Z - 0.05;
  const clearAt = (x, z, radius, kinds) => {
    const r = Math.hypot(x, z);
    if (r < CORE.plinth + radius) return false;
    for (let i = 0; i < BLOCKS.length; i += 3) {
      const dx = x - BLOCKS[i], dz = z - BLOCKS[i + 1], d = BLOCKS[i + 2] + radius;
      if (dx * dx + dz * dz < d * d) return false;
    }
    if (r <= HALL.r - 0.9 - radius) return true;
    // Through the way in, as far as just past the field.
    if (z > 0 && Math.abs(x) <= ENTRY.halfW - 0.1 - radius) return z <= ENTRY.field + ENTRY.beyond;
    // Into a window's opening, as far as its kind allows, from wherever the hall's ring leaves off for this walker.
    for (let i = 0; i < SLOTS.length; i++) {
      const b = SLOTS[i], sr = Math.sin(b), cr = Math.cos(b), along = x * sr + z * cr - HALL.r, across = x * cr - z * sr;
      if (Math.abs(across) <= WINDOW.halfW - 0.1 - radius && along > -1.5 - radius && along <= reachOf(kinds[i]) - radius) return true;
    }
    return false;
  };
  // Whether a walker of `radius` can step from (ax, az) to (bx, bz), clear all the way; `kinds` is each window's kind
  // as the scene resolved it.
  const walkable = (ax, az, bx, bz, radius, kinds) => {
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.2));
    for (let i = 1; i <= steps; i++) if (!clearAt(ax + (bx - ax) * i / steps, az + (bz - az) * i / steps, radius, kinds)) return false;
    return true;
  };

  BL.bifrostModels = {
    HALL, ENTRY, WINDOW, WINDOW_TOP, FRAME, CORE, WINDOWS, SLOTS, PILLARS, PILLAR_R, NAME, MIRROR_Z, COURT, BENCHES, BENCH_R, PLANTERS, PLANTER_R, PLANTER_TOP,
    frameOf, inArch, hall, pillars, tunnel, entryField, archStone, archGlow, RIM_STEPS, portalRim, hanger, passage, pictureQuad, dsbStandIn, mirror, name,
    coreBase, coreGlyph, coreRings, coreBeam, courtPosts, bench, planter, lighting, dressing, fieldSheet, swirl, archRing, banner,
    supportAt, clearAt, walkable, word, GLYPHS
  };
})();
