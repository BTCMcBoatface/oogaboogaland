// The factory's scripted foreman. One visit owns the rig, pickable world signs and feed subscription.
// Dialogue is data for later speech. The tour observes events; it never drives the node or the visitor.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { models, contributors, factoryModels: FM } = BL;
  const { createNode, addChild, removeChild } = BL.scene;
  const DEMO = "obl.factory.demo.v1", HEIGHT = 1.05, BASE = HEIGHT * 5 / 16;
  const LINES = {
    greeting: "Welcome! Want a tour of the factory?",
    demo: "Welcome! This hall runs on a simulated demo node. Want a tour?",
    noOogaDemo: "This hall runs on a simulated demo node. A tour needs your Ooga: pick one on the island, then walk in with them.",
    noOoga: "A tour needs your Ooga. Head back to the island, pick one, then walk in with them.",
    follow: "Follow me. We will look at channels, the core and the switchboard.",
    channels: "Channels connect this node to its peers. A payment can pass through several nodes on its journey.",
    core: "The core represents this node. Forwarding passes a payment onward; it does not mine a Bitcoin block.",
    outcomes: "The switchboard shows reported activity. Settled means the forward succeeded. Failed tells us the outcome, not its cause.",
    privacy: "The public feed leaves routes and fees private. We cannot reconstruct a payment's journey from an outcome.",
    quiet: "No forward has arrived for this tour. We can still explain the machinery without making up an event.",
    settled: "A forward was reported settled. That report does not tell us its complete route or fee.",
    failed: "A forward was reported failed. The report does not tell us why it failed.",
    replaySettled: "A replayed forward was reported settled. This is earlier activity, not a new payment happening now.",
    replayFailed: "A replayed forward was reported failed. This is earlier activity; no failure reason is supplied.",
    demoSettled: "The simulated demo node reported a settled forward. Demo route details are illustrations, not public-feed disclosures.",
    demoFailed: "The simulated demo node reported a failed forward. That report does not give a failure reason.",
    demoReplaySettled: "A replayed demo forward settled. It is simulated earlier activity, not a new live payment.",
    demoReplayFailed: "A replayed demo forward failed. It is simulated earlier activity; no failure reason is supplied.",
    done: "That is forwarding. Explore at your own pace. I will be back at the entrance if you want another tour.",
    warning: "Still coming? I will wait here a moment.",
    abandoned: "Lost my visitor again! Back to my post. Ask me when you are ready to follow.",
    cancelled: "All right. Back to my post.",
    blocked: "This way is busy. We will end here; I will head back when the path clears."
  };
  // Explicit waypoints use the broad arrival stairs and the left pit-to-core stairs, not ladders.
  // y is the expected support at the waypoint; the actual step uses the hall's collision functions.
  const ROUTE = [
    [1.55, 5, 26], [0, 5, 25], [0, 5, 22], [0, 0, 13],
    [-4.8, 0, 9], [-6.5, 0, 8.5], [-4.8, 0, 9], [-4.8, 0, 7.5],
    [-4.8, 5, 1.3], [-4.8, 5, 0.1], [-4.8, 5, 1.3], [-4.8, 0, 7.5], [-7, 0, 8.5]
  ];
  const STOPS = { 5: ["channels"], 9: ["core", "privacy"], 12: ["outcomes", "observation", "done"] };
  const DRESS = {
    torso(k, v) {
      const leather = k.color("#52331f"), brass = k.color("#c9962e");
      v.fill(2, 6, 1, 7, 5, 5, leather);
      v.fill(2, 2, 5, 7, 1, 5, leather);
      v.fill(6, 6, 5, 7, 1, 5, leather);
      v.fill(3, 5, 3, 3, 5, 5, brass);
    },
    headgear(k) {
      addChild(k.parts.head, createNode({ position: { x: 0, y: 0.53 * k.h, z: 0 }, scale: { x: 0.75, y: 0.75, z: 0.75 }, geometry: FM.hardHat() }));
    }
  };
  const TRAITS = models.cached(() => ({ ...contributors.traitsFor("foreman/factory"), display: "Factory foreman", height: HEIGHT,
    belly: 1, skin: "#bf855d", hair: "#35251a", fur: "#795333", face: "beard", dress: DRESS }));

  const create = ({ parent, input, fx, feed, visitor, demoRunning, leaveCave }) => {
    const figure = models.caveman(TRAITS()), body = figure.root, parts = figure.parts;
    body.position.x = ROUTE[0][0]; body.position.y = ROUTE[0][1] + BASE; body.position.z = ROUTE[0][2];
    parts.club.visible = parts.snack.visible = parts.hat.visible = false;
    const signs = createNode(), picks = [];
    addChild(parent, body, signs);
    // Signs stay in the world, with no modal, camera takeover or shared HUD wiring.
    const buttons = {};
    const button = (id, title, y) => {
      const label = FM.label(title, "", { height: 0.24 });
      const node = createNode({ position: { x: 0.9, y, z: 0.2 }, visible: false });
      const face = createNode({ geometry: label.face });
      addChild(node, face, createNode({ geometry: label.back }));
      addChild(signs, node);
      input.add(face, { kind: "greeter-choice", choice: id }, { radius: label.width / 2 });
      picks.push(face); buttons[id] = node;
    };
    button("yes", "SHOW ME", 1.75); button("no", "EXPLORE", 1.35);
    button("payments", "PAYMENTS", 1.75); button("next", "CONTINUE", 1.75);
    button("island", "PICK AN OOGA", 1.75); button("stop", "END TOUR", 1.35);
    input.add(parts.torso, { kind: "greeter" }, { radius: 0.65 });
    picks.push(parts.torso);
    const state = { phase: "idle", waypoint: 0, line: 0, away: 0, blocked: 0, greeted: false, cooldown: 0,
      lastForward: null, replay: false, demo: false, observation: "quiet" };
    const position = body.position;
    const near = (range = 3.5) => {
      const actor = visitor();
      if (!actor) return false;
      const p = actor.root.position;
      return Math.hypot(p.x - position.x, p.z - position.z, p.y - actor.baseY - (position.y - BASE)) <= range;
    };
    const show = (phase) => {
      state.phase = phase;
      for (const id in buttons) buttons[id].visible = phase === "greeting" ? id === "yes" || id === "no"
        : phase === "menu" ? id === "payments" || id === "no"
        : phase === "no-ooga" ? id === "island" || id === "no"
        : phase === "talk" ? id === "next" || id === "stop" : false;
    };
    const say = (id) => fx.sayAt(position.x, position.y + 1.65, position.z, LINES[id], 8);
    const greet = () => {
      if (state.phase === "return" || state.phase === "walk") return;
      if (state.phase === "talk") { say(STOPS[state.waypoint][state.line] === "observation" ? state.observation : STOPS[state.waypoint][state.line]); return; }
      state.greeted = true;
      show(visitor() ? "greeting" : "no-ooga");
      say(visitor() ? demoRunning() ? "demo" : "greeting" : demoRunning() ? "noOogaDemo" : "noOoga");
    };
    const end = (line) => {
      show("return"); state.away = state.blocked = 0; if (line) say(line);
    };
    const observe = () => {
      if (!state.lastForward) return "quiet";
      if (state.demo) return state.lastForward === "forward.failed" ? state.replay ? "demoReplayFailed" : "demoFailed" : state.replay ? "demoReplaySettled" : "demoSettled";
      return state.lastForward === "forward.failed" ? state.replay ? "replayFailed" : "failed" : state.replay ? "replaySettled" : "settled";
    };
    const talk = () => {
      state.line = 0; state.observation = observe(); show("talk"); say(STOPS[state.waypoint][0]);
    };
    const choose = (id) => {
      if (id === "island" && state.phase === "no-ooga") { leaveCave(); return; }
      if (id === "no" && (state.phase === "greeting" || state.phase === "menu" || state.phase === "no-ooga")) { show("idle"); state.cooldown = 12; return; }
      if (!near()) { if (!visitor()) greet(); return; }
      if (id === "yes" && state.phase === "greeting") { show("menu"); return; }
      if (id === "payments" && state.phase === "menu") {
        state.waypoint = 0; state.away = state.blocked = 0; state.lastForward = null;
        show("walk"); say("follow"); return;
      }
      if (id === "stop" && state.phase === "talk") { end("cancelled"); return; }
      if (id !== "next" || state.phase !== "talk") return;
      const lines = STOPS[state.waypoint];
      if (++state.line < lines.length) {
        const line = lines[state.line]; say(line === "observation" ? state.observation : line);
      } else if (state.waypoint === ROUTE.length - 1) end();
      else show("walk");
    };
    const unsubscribe = feed.subscribe((e) => {
      if (state.phase !== "walk" && state.phase !== "talk") return;
      if (e.type !== "forward.settled" && e.type !== "forward.failed") return;
      state.lastForward = e.type; state.replay = e.stream === "replay"; state.demo = e.schema === DEMO;
    });
    const move = (dt, returning) => {
      const index = returning ? state.waypoint : state.waypoint + 1, to = ROUTE[index];
      const dx = to[0] - position.x, dz = to[2] - position.z, distance = Math.hypot(dx, dz);
      if (distance < 0.025) {
        if (returning) {
          if (index === 0) { show("idle"); state.greeted = false; state.cooldown = 12; }
          else state.waypoint--;
        } else {
          state.waypoint = index;
          if (STOPS[index]) talk();
        }
        return false;
      }
      const step = Math.min(distance, dt * (returning ? 3.6 : 1.65));
      let x = position.x + dx / distance * step, z = position.z + dz / distance * step;
      const feet = position.y - BASE, actor = visitor();
      if (actor && Math.abs(actor.root.position.y - actor.baseY - feet) < 1.5) {
        const p = actor.root.position, clearance = 0.45 + (actor.bodyRadius || 0.35);
        if (Math.hypot(p.x - x, p.z - z) < clearance) {
          // Give way sideways if the floor permits it; a narrow stair waits instead of stepping off it.
          const side = (position.x - p.x) * -dz + (position.z - p.z) * dx >= 0 ? 1 : -1;
          x = position.x - dz / distance * step * side;
          z = position.z + dx / distance * step * side;
          if (Math.hypot(p.x - x, p.z - z) <= Math.hypot(p.x - position.x, p.z - position.z)) return false;
        }
      }
      if (!FM.walkable(position.x, position.z, x, z, feet, 0.3, 1.8)) {
        state.blocked += dt;
        if (!returning && state.blocked > 5) end("blocked");
        return false;
      }
      const floor = FM.supportAt(x, z, feet);
      body.rotation.y = Math.atan2(x - position.x, z - position.z);
      position.x = x; position.z = z; position.y = floor + BASE; state.blocked = 0;
      return true;
    };
    const update = (dt, elapsed) => {
      state.cooldown = Math.max(0, state.cooldown - dt);
      const actor = visitor();
      if (state.phase === "idle" && !state.greeted && !state.cooldown && near(4)) greet();
      if (state.phase === "greeting" || state.phase === "menu") {
        if (!actor || !near(6)) show("idle");
      }
      const touring = state.phase === "walk" || state.phase === "talk";
      if (touring) {
        if (!actor) end("abandoned");
        else if (!near(6)) {
          const before = state.away; state.away += dt;
          if (before < 4 && state.away >= 4) say("warning");
          if (state.away >= 12) end("abandoned");
        } else state.away = 0;
      }
      let walking = false;
      if (state.phase === "return" || state.phase === "walk" && near(6)) {
        // Small steps let supportAt follow every stair tread even after a slow frame.
        let left = Math.min(dt, 0.5);
        while (left > 0 && (state.phase === "walk" || state.phase === "return")) {
          const step = Math.min(left, 0.04); left -= step;
          walking = move(step, state.phase === "return") || walking;
        }
      }
      const stride = walking ? Math.sin(elapsed * (state.phase === "return" ? 15 : 8)) * 0.5 : 0;
      parts.legL.rotation.x = stride; parts.legR.rotation.x = -stride;
      parts.armL.rotation.x = state.phase === "greeting" ? -2 + Math.sin(elapsed * 5) * 0.12 : -stride * 0.6;
      parts.armR.rotation.x = state.phase === "talk" ? -1.1 : stride * 0.6;
      if (!walking && actor) body.rotation.y = Math.atan2(actor.root.position.x - position.x, actor.root.position.z - position.z);
      signs.position.x = position.x; signs.position.y = position.y - BASE; signs.position.z = position.z;
      signs.rotation.y = body.rotation.y;
    };
    const act = () => {
      if (!near() || state.phase === "walk" || state.phase === "return") return false;
      if (state.phase === "talk") choose("next");
      else if (state.phase === "greeting") choose("yes");
      else if (state.phase === "menu") choose("payments");
      else greet();
      return true;
    };
    const onKey = (e) => {
      if (e.repeat) return false;
      if (e.key === "t" || e.key === "T") { if (visitor()) return act(); greet(); return true; }
      if (e.key === "Escape" && (state.phase === "walk" || state.phase === "talk")) { end("cancelled"); return true; }
      if (e.key === "Escape" && (state.phase === "greeting" || state.phase === "menu" || state.phase === "no-ooga")) { show("idle"); state.cooldown = 12; return true; }
      return false;
    };
    const dispose = () => {
      unsubscribe();
      for (const pick of picks) input.remove(pick);
      removeChild(parent, body); removeChild(parent, signs);
      state.lastForward = null;
    };
    return { root: body, state, update, greet, choose, act, onKey, dispose,
      liveGeometry(set) { set.add(figure.headOpen).add(figure.headClosed); } };
  };
  BL.factoryGreeter = { create, LINES, ROUTE };
})();
