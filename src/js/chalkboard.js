// The EntropyLab chalkboard keeps one bounded list of marks for its close-up and its world-space writing.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const KEY = "ooga-chalkboard-v1", MAX_STROKES = 500, MAX_POINTS = 10000;
  const W = 800, H = 500, BOARD_W = 1.5, BOARD_H = 0.875;
  const CHALK = BL.math.hexToRgb("#e6eee4"), DUST = BL.math.hexToRgb("#829b83"), WIPE = BL.math.hexToRgb("#214237");
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const initial = () => {
    const marks = [];
    for (const [row, text] of ["01101010110", "11111101101"].entries()) {
      for (let i = 0; i < text.length; i++) {
        const x = 0.19 + i * 0.0615, y = 0.31 + row * 0.25;
        const wobble = Math.sin(i * 8.1 + row * 3.2) * 0.003;
        if (text[i] === "0") marks.push({ t: "c", p: [x - 0.011, y - 0.041, x + wobble, y - 0.047,
          x + 0.014, y - 0.027, x + 0.016, y + 0.021, x + 0.008, y + 0.046,
          x - 0.011, y + 0.04, x - 0.016, y + 0.009, x - 0.011, y - 0.041] });
        else marks.push({ t: "c", p: [x - 0.014, y - 0.022, x, y - 0.045,
          x + 0.004 + wobble, y + 0.043, x - 0.013, y + 0.045, x + 0.018, y + 0.042] });
      }
    }
    return marks;
  };
  const read = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(saved) || saved.length > MAX_STROKES) return [];
      let points = 0;
      return saved.filter((mark) => {
        if (!mark || (mark.t !== "c" && mark.t !== "e") || !Array.isArray(mark.p)
          || mark.p.length < 2 || mark.p.length % 2 || mark.p.length > 2000) return false;
        points += mark.p.length / 2;
        return points <= MAX_POINTS && mark.p.every((v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1);
      });
    } catch (_) { return []; }
  };
  const write = (marks) => {
    try { localStorage.setItem(KEY, JSON.stringify(marks)); } catch (_) { /* Storage may be unavailable. */ }
  };
  const quad = (geo, x0, y0, x1, y1, width, z, color) => {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len * width / 2, ny = dx / len * width / 2;
    const start = geo.verts.length / 3;
    geo.verts.push(x0 - nx, y0 - ny, z, x1 - nx, y1 - ny, z,
      x1 + nx, y1 + ny, z, x0 + nx, y0 + ny, z);
    geo.faces.push({ i: [start, start + 1, start + 2, start + 3], color, emissive: 0.12 });
  };
  const geometryFor = (marks) => {
    const geo = { verts: [], faces: [], lines: [], castShadow: false };
    let segment = 0;
    for (const mark of marks) for (let i = 2; i < mark.p.length; i += 2) {
      const x0 = (mark.p[i - 2] - 0.5) * BOARD_W, x1 = (mark.p[i] - 0.5) * BOARD_W;
      const y0 = 0.75 + (1 - mark.p[i - 1]) * BOARD_H, y1 = 0.75 + (1 - mark.p[i + 1]) * BOARD_H;
      const z = 0.012 + segment++ * 0.00001;
      quad(geo, x0, y0, x1, y1, mark.t === "e" ? 0.055 : 0.008, z, mark.t === "e" ? WIPE : CHALK);
      if (mark.t === "e") quad(geo, x0 + 0.008, y0 - 0.004, x1 + 0.008, y1 - 0.004, 0.004, z + 0.000005, DUST);
    }
    return geo;
  };
  const create = ({ renderer, onOpen, onClose }) => {
    const dialog = document.getElementById("chalk-modal"), frame = document.getElementById("chalk-frame");
    const canvas = document.getElementById("chalk-canvas"), ctx = canvas.getContext("2d", { alpha: false });
    const pointer = document.getElementById("chalk-pointer"), hint = document.getElementById("chalk-hint");
    const eraser = document.getElementById("chalk-eraser"), chalk = document.getElementById("chalk-chalk");
    const closeButton = document.getElementById("chalk-close");
    const listeners = new AbortController();
    const startingMarks = initial(), saved = read(), marks = startingMarks.concat(saved);
    let node = null, tool = null, stroke = null, pointCount = saved.reduce((n, mark) => n + mark.p.length / 2, 0);
    let controlled = false, changed = false, activePointer = -1;
    const coords = (e) => {
      const r = canvas.getBoundingClientRect();
      return [clamp((e.clientX - r.left) / r.width), clamp((e.clientY - r.top) / r.height)];
    };
    const paintSegment = (mark, i) => {
      const p = mark.p;
      ctx.lineCap = ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(p[i - 2] * W, p[i - 1] * H); ctx.lineTo(p[i] * W, p[i + 1] * H);
      if (mark.t === "e") {
        ctx.lineWidth = 30; ctx.strokeStyle = "rgba(27,65,52,0.9)"; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p[i - 2] * W + 3, p[i - 1] * H + 2); ctx.lineTo(p[i] * W + 3, p[i + 1] * H + 2);
        ctx.lineWidth = 21; ctx.strokeStyle = "rgba(177,196,167,0.11)"; ctx.stroke();
      } else {
        ctx.lineWidth = 3.2; ctx.strokeStyle = "rgba(237,244,220,0.88)"; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p[i - 2] * W + 1.2, p[i - 1] * H + 1); ctx.lineTo(p[i] * W + 1.2, p[i + 1] * H + 1);
        ctx.lineWidth = 1.3; ctx.strokeStyle = "rgba(217,228,204,0.36)"; ctx.stroke();
      }
    };
    const paint = () => {
      ctx.fillStyle = "#1b4034"; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 900; i++) {
        const x = (i * 1973 % 797), y = (i * 839 % 499);
        ctx.fillStyle = i % 3 ? "#325549" : "#15392f";
        ctx.fillRect(x, y, 1 + i % 2, 1);
      }
      for (const mark of marks) for (let i = 2; i < mark.p.length; i += 2) paintSegment(mark, i);
    };
    const select = (next) => {
      tool = next;
      eraser.setAttribute("aria-pressed", String(tool === "e"));
      chalk.setAttribute("aria-pressed", String(tool === "c"));
      pointer.classList.toggle("eraser", tool === "e");
      frame.classList.toggle("has-tool", !!tool);
      hint.textContent = tool === "e" ? "Drag on the board to erase · Esc to leave" : "Drag on the board to write · Esc to leave";
    };
    const movePointer = (e) => {
      if (!tool || e.pointerType === "touch" && !controlled) { pointer.classList.remove("visible"); return; }
      const r = frame.getBoundingClientRect();
      pointer.style.left = `${e.clientX - r.left}px`;
      pointer.style.top = `${e.clientY - r.top}px`;
      pointer.classList.add("visible");
    };
    const addPoint = (e) => {
      if (!stroke || pointCount >= MAX_POINTS) return;
      const [x, y] = coords(e), p = stroke.p, last = p.length - 2;
      if (Math.hypot(x - p[last], y - p[last + 1]) < 0.003) return;
      p.push(Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000);
      pointCount++;
      paintSegment(stroke, p.length - 2);
      changed = true;
    };
    canvas.addEventListener("pointerdown", (e) => {
      if (stroke || !e.isPrimary || e.button !== 0 || !tool || marks.length >= MAX_STROKES || pointCount >= MAX_POINTS) return;
      e.preventDefault();
      const [x, y] = coords(e);
      stroke = { t: tool, p: [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000] };
      marks.push(stroke); pointCount++;
      activePointer = e.pointerId;
      canvas.setPointerCapture(e.pointerId);
      movePointer(e);
    }, { signal: listeners.signal });
    canvas.addEventListener("pointermove", (e) => { movePointer(e); if (e.pointerId === activePointer) addPoint(e); }, { signal: listeners.signal });
    const endStroke = (e) => {
      if (!stroke || e.pointerId !== activePointer) return;
      if (stroke.p.length === 2) {
        const x = Math.min(1, stroke.p[0] + 0.001), y = stroke.p[1];
        stroke.p.push(x, y); pointCount++; paintSegment(stroke, 2); changed = true;
      }
      stroke = null;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      activePointer = -1;
      if (e.pointerType === "touch") pointer.classList.remove("visible");
    };
    canvas.addEventListener("pointerup", endStroke, { signal: listeners.signal });
    canvas.addEventListener("pointercancel", endStroke, { signal: listeners.signal });
    canvas.addEventListener("pointerleave", () => { if (!stroke) pointer.classList.remove("visible"); }, { signal: listeners.signal });
    eraser.addEventListener("click", () => select("e"), { signal: listeners.signal });
    chalk.addEventListener("click", () => select("c"), { signal: listeners.signal });
    closeButton.addEventListener("click", () => dialog.close(), { signal: listeners.signal });
    dialog.addEventListener("close", () => {
      if (activePointer >= 0 && canvas.hasPointerCapture(activePointer)) canvas.releasePointerCapture(activePointer);
      activePointer = -1;
      if (stroke && stroke.p.length === 2) {
        stroke.p.push(Math.min(1, stroke.p[0] + 0.001), stroke.p[1]);
        changed = true;
      }
      stroke = null; pointer.classList.remove("visible");
      if (changed) {
        write(marks.slice(startingMarks.length));
        if (node) { const old = node.geometry; node.geometry = geometryFor(marks); renderer.releaseGeometry(old); }
        changed = false;
      }
      onClose();
    }, { signal: listeners.signal });
    return {
      attach(parent, x, y, z) {
        node = BL.scene.createNode({ position: { x, y, z }, geometry: geometryFor(marks), sightHidden: true });
        BL.scene.addChild(parent, node);
      },
      open(isControlled, skin, arm, focal) {
        if (dialog.open) return;
        controlled = !!isControlled;
        pointer.classList.toggle("controlled", controlled);
        pointer.style.setProperty("--chalk-skin", skin || "#b69a77");
        pointer.style.setProperty("--chalk-arm", arm || skin || "#92816b");
        select(null);
        paint();
        onOpen();
        if (document.pointerLockElement) document.exitPointerLock();
        if (focal) dialog.style.transformOrigin = `${Math.round(focal.x / innerWidth * 100)}% ${Math.round(focal.y / innerHeight * 100)}%`;
        dialog.showModal();
      },
      dispose() {
        listeners.abort();
        if (dialog.open) dialog.close();
        node = null;
      },
      get openNow() { return dialog.open; }
    };
  };
  BL.chalkboard = { create };
})();
