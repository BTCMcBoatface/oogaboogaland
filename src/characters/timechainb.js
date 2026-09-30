(() => {
  "use strict";
  const BL = window.BL;
  const { makeVox, voxelGeometry } = BL.models;
  const { createNode, addChild } = BL.scene;
  const { hexToRgb } = BL.math;
  const staffVoxels = (rand) => {
    const v = makeVox();
    const woodJ = () => rand() < 0.2 ? 1 : 0;
    v.fill(0, 0, -2, 15, 0, 0, woodJ);
    for (const y of [3, 8, 12]) v.set(rand() < 0.5 ? -1 : 1, y, 0, 1);
    for (const [y, z] of [[16, 0], [17, 1], [17, 2], [16, 3], [15, 3]]) v.set(0, y, z, woodJ());
    return v;
  };
  const LION_PALETTE = [hexToRgb("#d4a04a"), hexToRgb("#bd8b38"), hexToRgb("#a5602a"), hexToRgb("#7d4520"), hexToRgb("#ecc98a"), hexToRgb("#141414")];
  const lionVoxels = (rand) => {
    const v = makeVox();
    const L = { fur: 0, furDk: 1, mane: 2, maneDk: 3, belly: 4, black: 5 };
    const fur = () => rand() < 0.15 ? L.furDk : L.fur;
    const mane = () => rand() < 0.35 ? L.maneDk : L.mane;
    v.fill(0, 3, 0, 5, 0, 3, fur);
    v.fill(1, 2, 0, 4, 3, 3, L.belly);
    v.fill(-1, 4, 6, 10, 1, 5, (x, y, z) => (x === -1 || x === 4) && (y === 6 || y === 10) ? null : x === -1 || x === 4 || y === 6 || y === 10 || z === 1 ? mane() : null);
    v.fill(0, 3, 7, 9, 2, 5, fur);
    v.fill(1, 2, 7, 7, 5, 6, L.belly);
    v.fill(1, 2, 8, 8, 5, 5, L.maneDk);
    v.set(0, 9, 5, L.black);
    v.set(3, 9, 5, L.black);
    v.set(0, 11, 2, L.fur);
    v.set(3, 11, 2, L.fur);
    for (const x of [0, 3]) {
      v.fill(x, x, 3, 4, 4, 6, fur);
      v.fill(x, x, 1, 2, 6, 6, fur);
      v.fill(x, x, -3, -1, 1, 2, fur);
      v.fill(x, x, -3, -3, 3, 3, fur);
    }
    v.fill(2, 2, -5, -1, -1, -1, fur);
    v.set(2, -6, -1, L.maneDk);
    return v;
  };
  // The cub drawn cartoon over the same frame: a round body with a pale belly, a fluffy mane round the head, a muzzle
  // with a black nose, eyes and ears, front legs reaching forward, hind legs and a tail with a dark tuft. Placed in
  // cell units where the voxel cub's parts stand, the voxel cub kept as its shell.
  const cartoonLion = (u, origin) => {
    const { geometry, blob } = BL.models, geo = geometry(), c = (i) => LION_PALETTE[i];
    geo.smooth = true;
    const part = (x, y, z, rx, ry, rz, i, e = 2) => blob(geo, origin.x + x * u, origin.y + y * u, origin.z + z * u, rx * u, ry * u, rz * u, c(i), 0, e);
    part(2, 3, 2, 2.1, 3.1, 2.0, 0);
    part(2, 2.6, 3.4, 1.3, 2.2, 0.9, 4);
    part(2, 8.4, 2.9, 3.1, 2.7, 2.4, 2, 2.2);
    part(2, 8.5, 4.3, 2.0, 1.7, 1.6, 0);
    part(2, 7.7, 5.7, 0.95, 0.65, 0.55, 4);
    part(2, 8.25, 6.2, 0.38, 0.28, 0.2, 5);
    for (const x of [1.1, 2.9]) part(x, 9.2, 5.75, 0.3, 0.36, 0.14, 5);
    for (const x of [0.6, 3.4]) part(x, 10.9, 3.2, 0.55, 0.55, 0.35, 0);
    for (const x of [0.6, 3.4]) {
      part(x, 3.9, 5.1, 0.55, 1.1, 1.3, 0);
      part(x, 2.1, 6.3, 0.62, 0.55, 0.6, 0);
      part(x, -1.4, 1.9, 0.62, 1.7, 0.9, 0);
      part(x, -2.8, 3.1, 0.6, 0.5, 0.75, 0);
    }
    part(2.5, -2.8, -0.5, 0.35, 2.5, 0.35, 0);
    part(2.5, -5.6, -0.5, 0.55, 0.6, 0.55, 3);
    return geo;
  };
  // The gold banded cap, round and built once in the head's frame from smooth masses: a dome set down over the crown
  // to just above the brows, two darker bands round it and a knob on top.
  let cap = null;
  const capGeometry = (u) => {
    if (cap) return cap;
    const { geometry, blob } = BL.models, geo = geometry(), gold = hexToRgb("#d4a83a"), goldDk = hexToRgb("#9c7a22");
    geo.smooth = true;
    // Set back over the crown so its front rests on the brow and its back covers the curls.
    const z = -1.0 * u;
    blob(geo, 0, 7.0 * u, z, 4.25 * u, 2.3 * u, 4.35 * u, gold, 0, 2.2);
    blob(geo, 0, 5.75 * u, z, 4.1 * u, 0.32 * u, 4.2 * u, goldDk, 0, 2.2);
    blob(geo, 0, 7.55 * u, z, 4.15 * u, 0.3 * u, 4.25 * u, goldDk, 0, 2.2);
    blob(geo, 0, 9.35 * u, z, 0.7 * u, 0.5 * u, 0.7 * u, gold);
    return (cap = geo);
  };
  BL.characters.add({
    handle: "timechainb",
    joined: 1788800921,
    lastCommit: 1788171200,
    // The Anunnaki: dark hair under a round gold banded cap, and a full beard to the chest.
    look: { portrait: { min: [-1, -2, 0], max: [7, 11, 8] }, face: "beard", beardLong: true, hatY: 12, skin: "#b8703c", hair: "#33200f" },
    dress: {
      // The staff stands upright in the grip.
      club: (k) => ({ voxels: staffVoxels(k.rand), rest: { x: 0.2, z: 0 } }),
      headgear(k) {
        addChild(k.parts.head, createNode({ geometry: capGeometry(k.u) }));
      },
      // A lion cub carried on the right arm
      extras(k) {
        const u = k.u;
        const origin = { x: k.armX + 1.5 * u, y: -1 * u, z: -2 * u }, geometry = cartoonLion(u, origin);
        geometry.toonShell = geometry.collisionGeometry = voxelGeometry(lionVoxels(k.rand), { unit: u, palette: LION_PALETTE, origin });
        k.parts.lion = createNode({ geometry });
        addChild(k.root, k.parts.lion);
      }
    }
  });
})();
