(() => {
  "use strict";
  const BL = window.BL;
  // The black ball cap, built once in the head's frame from smooth masses: the crown, the brim over the eyes and the
  // button on top, with "Secp256k1" in white script across the front as a printed label.
  const CROWN = { y: 7.0, z: -0.2, rx: 4.3, ry: 2.3, rz: 4.1, e: 2.3 };
  let cap = null, patch = null;
  const capGeometry = (u) => {
    if (cap) return cap;
    const { geometry, blob } = BL.models, black = [22, 22, 22];
    const geo = geometry();
    geo.smooth = true;
    blob(geo, 0, CROWN.y * u, CROWN.z * u, CROWN.rx * u, CROWN.ry * u, CROWN.rz * u, black, 0, CROWN.e);
    blob(geo, 0, 5.3 * u, 3.6 * u, 3.3 * u, 0.32 * u, 2.3 * u, black, 0, 2.4);
    blob(geo, 0, 9.25 * u, -0.2 * u, 0.5 * u, 0.3 * u, 0.5 * u, black);
    return (cap = geo);
  };
  // The label: the word on the cap's black, laid on a strip of narrow panels that follows the crown's curve a hair in
  // front of it. The picture maps across the strip's x and y, so it reads straight however the crown bends.
  const labelGeometry = (u) => {
    if (patch) return patch;
    // Painted on the renderer's first look, so a build without a page (the unit checks) needs no canvas.
    let image = null;
    const load = () => {
      if (image) return image;
      const canvas = document.createElement("canvas"), g = canvas.getContext("2d");
      canvas.width = 512; canvas.height = 128;
      g.fillStyle = "#161616";
      g.fillRect(0, 0, 512, 128);
      g.fillStyle = "#f4f1ea";
      g.font = "italic 600 104px 'Brush Script MT', 'Segoe Script', 'Snell Roundhand', cursive";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("Secp256k1", 256, 66);
      image = new Image();
      image.src = canvas.toDataURL("image/png");
      return image;
    };
    const W = 3.4 * u, H = W / 4, y0 = 7.15 * u - H / 2, steps = 8, verts = [], faces = [];
    const front = (x) => {
      const f = 1 - Math.pow(Math.abs(x / (CROWN.rx * u)), CROWN.e) - Math.pow(Math.abs((y0 + H / 2 - CROWN.y * u) / (CROWN.ry * u)), CROWN.e);
      return CROWN.z * u + CROWN.rz * u * Math.pow(Math.max(0, f), 1 / CROWN.e) + 0.05 * u;
    };
    for (let i = 0; i <= steps; i++) {
      const x = -W / 2 + W * i / steps, z = front(x);
      verts.push(x, y0, z, x, y0 + H, z);
    }
    for (let i = 0; i < steps; i++) faces.push({ i: [i * 2, i * 2 + 2, i * 2 + 3, i * 2 + 1], color: [0, 0, 0], emissive: 0 });
    patch = { verts, faces, lines: [], castShadow: false };
    patch.imageSurface = { asset: { width: 512, height: 128, load }, rect: [-W / 2, y0, W, H] };
    return patch;
  };
  BL.characters.add({
    handle: "dplusplus1024",
    joined: 1788800917,
    lastCommit: 1788153655,
    // Platinum chin-length bob under a black cap, fair skin, winged liner and pink lips.
    look: { portrait: { min: [-1, -3, -1], max: [7, 8, 8] }, build: "slim", hair: "#e4e2ee", skin: "#f4d2c2", hairStyle: "bob", liner: true, lips: "#d98a8a" },
    dress: {
      // A black strappy top over the chest, tucked at the belt, thin straps over the shoulders.
      torso(k, v) {
        const top = k.color("#17171a");
        v.fill(1, 7, 4, 6, 1, 4, top);
        for (const x of [2, 6]) for (const z of [1, 4]) v.set(x, 7, z, top);
        v.fill(3, 5, 7, 7, 1, 4, (x, y, z) => v.has(x, y, z) ? k.skinJ() : null);
      },
      headgear(k) {
        BL.scene.addChild(k.parts.head, BL.scene.createNode({ geometry: capGeometry(k.u) }), BL.scene.createNode({ geometry: labelGeometry(k.u) }));
      }
    }
  });
})();
