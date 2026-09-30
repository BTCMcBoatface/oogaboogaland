(() => {
  "use strict";
  const BL = window.BL;
  // The spacesuit: white shell, grey panels, orange straps and cuffs. Colours come from the cell, never from k.rand.
  const SUIT = "#e6e9ed", PANEL = "#a9b0b8", DARK = "#2b3037", ORANGE = "#f07a2a";
  // The helmet and the life-support pack, built once in their parts' frames from smooth masses: a round white shell
  // enclosing the head, a dark visor with a catch light, an orange neck ring and a lamp; a rounded pack on the back.
  let helmet = null, pack = null;
  const rgb = (hex) => BL.math.hexToRgb(hex);
  const helmetGeometry = (u) => {
    if (helmet) return helmet;
    const { geometry, blob } = BL.models, geo = geometry();
    geo.smooth = true;
    blob(geo, 0, 3.5 * u, 0.1 * u, 4.8 * u, 4.6 * u, 4.6 * u, rgb(SUIT), 0, 2.1);
    blob(geo, 0, 3.7 * u, 2.7 * u, 3.4 * u, 2.7 * u, 2.2 * u, rgb("#11161c"), 0, 2.2);
    blob(geo, -1.2 * u, 4.9 * u, 4.65 * u, 0.9 * u, 0.45 * u, 0.1 * u, rgb("#7d8a99"), 0.3, 2, 0.4);
    blob(geo, 0, -0.4 * u, 0.1 * u, 4.1 * u, 0.55 * u, 4.1 * u, rgb(ORANGE), 0, 2.4);
    blob(geo, 4.3 * u, 4.6 * u, 1.4 * u, 0.5 * u, 0.5 * u, 0.5 * u, rgb("#ffd9a6"), 0.8);
    return (helmet = geo);
  };
  const packGeometry = (u) => {
    if (pack) return pack;
    const { geometry, blob } = BL.models, geo = geometry();
    geo.smooth = true;
    blob(geo, 0, 4.6 * u, -3.9 * u, 3.3 * u, 3.4 * u, 1.3 * u, rgb(SUIT), 0, 3);
    for (const x of [-1.6, 1.6]) blob(geo, x * u, 4.4 * u, -5.1 * u, 0.7 * u, 2.4 * u, 0.35 * u, rgb(PANEL), 0, 2.6);
    blob(geo, 0, 7.4 * u, -3.9 * u, 2.6 * u, 0.35 * u, 1.0 * u, rgb(ORANGE), 0, 2.4);
    return (pack = geo);
  };
  BL.characters.add({
    handle: "SaniExp",
    display: "Sani",
    joined: 1790294400,
    // Historical activity from the bundled Oogatron snapshot; live stats refresh it.
    lastCommit: 1788367622,
    look: { bald: true, cleanShaven: true, face: "none" },
    dress: {
      // The suit over the chest: grey panels at the sides, orange straps from the shoulders to the belt, and a dark
      // control box on the chest with its lights.
      torso(k, v) {
        for (const key of v.map.keys()) v.map.set(key, k.color(SUIT));
        v.fill(0, 8, 3, 3, 0, 5, (x, y, z) => v.has(x, y, z) ? k.color(PANEL) : null);
        for (const x of [2, 6]) for (const z of [1, 4]) v.fill(x, x, 4, 7, z, z, k.color(ORANGE));
        v.fill(3, 5, 5, 6, 4, 4, k.color(DARK));
        v.set(3, 6, 4, k.color("#ff4d3d"));
        v.set(5, 6, 4, k.color("#57d67a"));
        k.loin = [k.color(SUIT), k.color(PANEL)];
      },
      // Suit sleeves with an orange cuff and grey gloves; suit legs with orange knee bands and dark boots. The same
      // shapes as the Ooga underneath, so fits and reach stay as they were.
      gear(k) {
        const u = k.u, arm = BL.models.makeVox();
        arm.fill(0, 2, 3, 7, 0, 2, k.color(SUIT));
        arm.fill(-1, 3, 8, 10, -1, 3, k.color(SUIT));
        arm.fill(0, 2, 2, 2, 0, 2, k.color(ORANGE));
        arm.fill(-1, 3, 0, 1, -1, 3, k.color(PANEL));
        const arms = k.vg(arm, { x: -1.5 * u, y: -11 * u, z: -1.5 * u }, undefined, k.armFit, k.armReach);
        k.parts.armL.geometry = k.parts.armR.geometry = arms;
        for (const [part, side] of [["legL", -1], ["legR", 1]]) {
          const leg = BL.models.makeVox();
          leg.fill(0, 3, 2, 4, 0, 3, k.color(SUIT));
          leg.fill(0, 3, 3, 3, 0, 3, k.color(ORANGE));
          leg.fill(0, 3, 0, 1, 0, 5, k.color(DARK));
          leg.set(side < 0 ? 3 : 0, 0, 6, k.color(DARK));
          leg.set(side < 0 ? 1 : 2, 0, 6, k.color(DARK));
          k.parts[part].geometry = k.vg(leg, { x: -2 * u, y: -5 * u, z: -2.5 * u });
        }
      },
      headgear(k) {
        BL.scene.addChild(k.parts.head, BL.scene.createNode({ geometry: helmetGeometry(k.u) }));
      },
      extras(k) {
        BL.scene.addChild(k.parts.torso, BL.scene.createNode({ geometry: packGeometry(k.u) }));
      }
    }
  });
})();
