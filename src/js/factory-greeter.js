// The factory's scripted foreman. One visit owns the rig, pickable world signs and feed subscription.
// Dialogue is data for later speech. The tour observes events; it never drives the node or the visitor.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { models, contributors, factoryModels: FM } = BL;
  const { createNode, addChild, removeChild } = BL.scene;
  const DEMO = "obl.factory.demo.v1", HEIGHT = 1.05, BASE = HEIGHT * 5 / 16;
  const LINES = {
    greeting: "Want a factory tour? Press Space.",
    greetingTouch: "Want a factory tour? Tap me.",
    demo: "Demo node. Want a tour? Press Space.",
    demoTouch: "Demo node. Want a tour? Tap me.",
    noOogaDemo: "Demo node. Pick an Ooga on the island.",
    noOoga: "Pick an Ooga on the island for a tour.",
    follow: "Follow me: channels, core, switchboard.",
    channels: "Channels connect this node to its peers. A payment can pass through several nodes on its journey.",
    core: "The core represents this node. Forwarding passes a payment onward; it does not mine a Bitcoin block.",
    outcomes: "The switchboard shows reported activity. Settled means the forward succeeded. Failed tells us the outcome, not its cause.",
    privacy: "The public feed leaves routes and fees private. We cannot reconstruct a payment's journey from an outcome.",
    quiet: "No forward has arrived for this tour. We can still explain the machinery without making up an event.",
    settled: "A forward was reported settled. That report does not tell us its complete route or fee.",
    failed: "A forward was reported failed. The report does not tell us why it failed.",
    demoReport: "This report comes from the simulated demo node, not a real node's activity.",
    replayReport: "This is replayed earlier activity. It is not a new event happening now.",
    menu: "Tap a tour. Arrows choose; T starts it.",
    followChannels: "Follow me to the forge and a channel.",
    followRebalancing: "Follow me to the rebalancer.",
    followHealth: "Follow me upstairs to the watchtower.",
    forge: "The forge represents the channel's connection to Bitcoin. Opening and closing channels involves on-chain transactions.",
    opening: "Opening commits funds to a channel. The carts represent that process; their number is a size category, not an exact amount.",
    closing: "Closing settles the channel back on-chain. The minted coin is the factory's illustration, not a coin we create for this tour.",
    channelStatus: "Each occupied station represents a channel. Its status can change as opening, active, closing and closed reports arrive.",
    slots: "Public channel slots are temporary labels for this day. They do not reveal a peer's lasting identity or a payment route.",
    fundsPrivate: "A channel's public capacity is not its spendable balance in either direction. We cannot infer private liquidity here.",
    channelQuiet: "No channel event has arrived during this tour. We can explain the station without guessing its next change.",
    channelOpeningReport: "A channel opening was reported. That alone does not mean the channel is already active.",
    channelActiveReport: "An active channel was reported. This report does not disclose its private balances.",
    channelClosingReport: "A channel closing was reported. We should not call it closed before a closed report arrives.",
    channelClosedReport: "A closed channel was reported. That tells us its reported state, not a payment route or a private balance.",
    channelDone: "That is how the forge and channels fit together. I will return to the entrance for your next tour.",
    liquidity: "Channels need usable liquidity to keep forwarding. Public capacity alone does not tell us how much can move each way.",
    rebalancer: "The rebalancer represents shifting liquidity so channels can keep working. Its rings respond to reported activity.",
    rebalanceHour: "Rebalance reports are grouped by the hour. The animation is an illustration, not an exact timestamp for the movement.",
    rebalancePrivate: "These reports deliberately do not name a channel or reveal its balance. A failed rebalance does not give us a cause.",
    rebalanceQuiet: "No rebalance report has arrived during this tour. We do not need to trigger one to explain this machine.",
    rebalanceSucceededReport: "A successful rebalance was reported. It does not tell us which channels were involved or their balances.",
    rebalanceFailedReport: "A failed rebalance was reported. No failure reason or channel balance is supplied.",
    rebalanceDone: "That is rebalancing. The machine shows reported activity; the channels' private balances stay private.",
    healthCore: "The core represents the node's reported state. It lights as the node starts or becomes ready, and darkens on a stopped report.",
    unknownNode: "We have no reported node state. Missing information is not evidence that the node has stopped.",
    startingNode: "The last reported node state is starting. That is a report, not a guarantee about every function of the node.",
    readyNode: "The last reported node state is ready. It is not a fresh health check or a guarantee that every forward will succeed.",
    stoppedNode: "The last reported node state is stopped. This is different from merely losing the feed's signal.",
    watchtower: "Look up at the watchtower. Its beam follows incoming feed activity, not a complete health diagnosis of the node.",
    waitingSignal: "The feed has not received an event yet. We are waiting for information; the node's health is unknown.",
    silentSignal: "The feed is quiet. The beam can go dark even if the node is fine. Silence is not a stopped report.",
    liveSignal: "Events are arriving. That shows an active feed, not proof that every part of the node is healthy.",
    replaySignal: "Earlier events are being replayed. The beam shows incoming signal, not fresh evidence of the node's health now.",
    summary: "Activity summaries are derived reports. They describe activity, not a diagnosis or private channel balances.",
    noSummary: "No activity summary has been supplied. We will not fill in counts or a success rate ourselves.",
    healthDone: "A reported state and a feed signal answer different questions. That is our node health tour; I will head back to my post.",
    done: "That is forwarding. Explore at your own pace. I will be back at the entrance if you want another tour.",
    warning: "Still coming? I will wait here a moment.",
    abandoned: "Lost my visitor! Back to my post.",
    cancelled: "All right. Back to my post.",
    blocked: "Path blocked. Back to my post."
  };
  // The shared bubble is single-line. Bake short speech beats once, preserving full voice-ready lines.
  const SPEECH = {};
  for (const id in LINES) {
    const beats = [], words = LINES[id].split(" ");
    let beat = "";
    for (const word of words) {
      if (beat && beat.length + word.length + 1 > 44) { beats.push(beat); beat = ""; }
      beat += (beat ? " " : "") + word;
    }
    if (beat) beats.push(beat);
    SPEECH[id] = beats;
  }
  // Explicit waypoints use the broad arrival stairs and the left pit-to-core stairs, not ladders.
  // y is the expected support at the waypoint; the actual step uses the hall's collision functions.
  const ROUTE = [
    [-1.55, 5, 26], [0, 5, 25], [0, 5, 22], [0, 0, 13],
    [-4.8, 0, 9], [-6.5, 0, 8.5], [-4.8, 0, 9], [-4.8, 0, 7.5],
    [-4.8, 5, 1.3], [-4.8, 5, 0.1], [-4.8, 5, 1.3], [-4.8, 0, 7.5], [-7, 0, 8.5]
  ];
  const STOPS = { 5: ["channels"], 9: ["core", "privacy"], 12: ["outcomes", "observation", "source", "history", "done"] };
  // Tours share fixed approach points but own their stops. No runtime route building or event history.
  const CHANNEL_ROUTE = [
    ...ROUTE.slice(0, 4), [-4.8, 0, 9], [-4.8, 0, 5.8], [-4.8, 0, 7.5],
    [-4.8, 5, 1.3], [-4.8, 5, 0.1], [-5.6, 5, -1.6], [-6.1, 5, -3.9],
    [-6.4, 5, -4], [-8.5, 5, -2.5]
  ];
  const TOURS = {
    payments: { title: "PAYMENTS", follow: "follow", route: ROUTE,
      events: ["forward.settled", "forward.failed"], quiet: "quiet", stops: STOPS,
      look: { 5: [-12.4, 7, -2], 9: [0, 8, -4], 12: [-12, 4, 6] } },
    channels: { title: "CHANNELS", follow: "followChannels", route: CHANNEL_ROUTE,
      events: ["channel.opening", "channel.active", "channel.closing", "channel.closed"], quiet: "channelQuiet",
      stops: { 5: ["forge", "opening", "closing", "observation", "source", "history"],
        12: ["channelStatus", "slots", "fundsPrivate", "observation", "source", "history", "channelDone"] },
      look: { 5: [0, 3, 0.7], 12: [-12.4, 7, -2] } },
    rebalancing: { title: "REBALANCING", follow: "followRebalancing",
      route: [...ROUTE.slice(0, 4), [4.8, 0, 10], [8.5, 0, 9.5]],
      events: ["rebalance.succeeded", "rebalance.failed"], quiet: "rebalanceQuiet",
      stops: { 4: ["liquidity"], 5: ["rebalancer", "rebalanceHour", "rebalancePrivate", "observation", "source", "history", "rebalanceDone"] },
      look: { 4: [12.4, 7, -2], 5: [14, 4.5, 4.2] } },
    health: { title: "NODE HEALTH", follow: "followHealth",
      route: [...CHANNEL_ROUTE, [-8.9, 5, -3.5], [-9.2, 5, -4.4], [-9.2, 10, -9.6], [-9.2, 10, -10.1]],
      events: [], quiet: "unknownNode",
      stops: { 8: ["healthCore", "observation", "source", "history"],
        16: ["watchtower", "signal", "summary", "healthDone"] },
      look: { 8: [0, 8, -4], 16: [-16, 21, -14] } }
  };
  const TOUR_ORDER = ["payments", "channels", "rebalancing", "health"];
  const OBSERVATIONS = {
    "forward.settled": "settled", "forward.failed": "failed",
    "channel.opening": "channelOpeningReport", "channel.active": "channelActiveReport",
    "channel.closing": "channelClosingReport", "channel.closed": "channelClosedReport",
    "rebalance.succeeded": "rebalanceSucceededReport", "rebalance.failed": "rebalanceFailedReport"
  };
  const NODE_LINES = { unknown: "unknownNode", starting: "startingNode", ready: "readyNode", stopped: "stoppedNode" };
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

  const create = ({ parent, input, fx, feed, visitor, demoRunning, leaveCave, coarse }) => {
    const figure = models.caveman(TRAITS()), body = figure.root, parts = figure.parts;
    body.position.x = ROUTE[0][0]; body.position.y = ROUTE[0][1] + BASE; body.position.z = ROUTE[0][2];
    parts.club.visible = parts.snack.visible = parts.hat.visible = false;
    const signs = createNode(), picks = [];
    addChild(parent, body, signs);
    // Signs stay in the world, with no modal, camera takeover or shared HUD wiring.
    const buttons = {};
    const button = (id, title, y) => {
      const label = FM.label(title, "", { height: 0.45 });
      const node = createNode({ position: { x: 0.9, y, z: 0.2 }, visible: false });
      const face = createNode({ geometry: label.face });
      addChild(node, face, createNode({ geometry: label.back }));
      addChild(signs, node);
      // Refine the sphere to the actual sign: adjacent tour cards must not steal each other's taps.
      const inverse = BL.math.mat4.create(), halfW = label.width / 2 + 0.07, halfH = label.height / 2 + 0.07;
      const pickRay = (ray) => {
        const m = BL.math.mat4.invert(inverse, face.world);
        const ox = m[0] * ray.ox + m[4] * ray.oy + m[8] * ray.oz + m[12];
        const oy = m[1] * ray.ox + m[5] * ray.oy + m[9] * ray.oz + m[13];
        const oz = m[2] * ray.ox + m[6] * ray.oy + m[10] * ray.oz + m[14];
        const dx = m[0] * ray.dx + m[4] * ray.dy + m[8] * ray.dz;
        const dy = m[1] * ray.dx + m[5] * ray.dy + m[9] * ray.dz;
        const dz = m[2] * ray.dx + m[6] * ray.dy + m[10] * ray.dz;
        if (dz >= -1e-8) return Infinity;
        const t = (0.03 - oz) / dz;
        return t >= 0 && Math.abs(ox + dx * t) <= halfW && Math.abs(oy + dy * t) <= halfH ? t : Infinity;
      };
      input.add(face, { kind: "greeter-choice", choice: id, priority: 3, pickRay }, { radius: Math.hypot(halfW, halfH) });
      picks.push(face); buttons[id] = node;
    };
    for (let i = 0; i < TOUR_ORDER.length; i++) button(TOUR_ORDER[i], TOURS[TOUR_ORDER[i]].title, 2.35 - i * 0.5);
    button("next", "CONTINUE", 1.75);
    button("island", "PICK AN OOGA", 1.75); button("stop", "END TOUR", 1.35);
    input.add(parts.torso, { kind: "greeter" }, { radius: 0.65 });
    picks.push(parts.torso);
    let tour = TOURS.payments;
    const state = { tour: null, selection: 0, phase: "idle", waypoint: 0, line: 0, away: 0, blocked: 0, greeted: false, cooldown: 0,
      spoken: null, utterance: 0, lastEvent: null, replay: false, demo: false, observation: "quiet", snapshotDemo: false, snapshotReplay: false,
      node: feed.reading.node, nodeDemo: false, nodeReplay: false, nodeReported: false };
    const position = body.position;
    const near = (range = 3.5) => {
      const actor = visitor();
      if (!actor) return false;
      const p = actor.root.position;
      return Math.hypot(p.x - position.x, p.z - position.z, p.y - actor.baseY - (position.y - BASE)) <= range;
    };
    const show = (phase) => {
      state.phase = phase;
      for (const id in buttons) buttons[id].visible = phase === "menu" ? TOUR_ORDER.includes(id)
        : phase === "no-ooga" ? id === "island"
        : phase === "talk" ? id === "next" || id === "stop" : false;
    };
    const select = (index) => {
      state.selection = (index + TOUR_ORDER.length) % TOUR_ORDER.length;
      for (let i = 0; i < TOUR_ORDER.length; i++) {
        const node = buttons[TOUR_ORDER[i]], scale = i === state.selection ? 1.12 : 1;
        node.scale.x = node.scale.y = node.scale.z = scale;
      }
    };
    // One anchored bubble replaces the previous line and follows the foreman, including his return.
    const say = (id, repeat = false) => {
      if (!repeat || state.spoken !== id) state.utterance = 0;
      state.spoken = id;
      fx.say(figure, SPEECH[id][state.utterance], 8);
    };
    const greet = (interacting = true) => {
      if (state.phase === "return" || state.phase === "walk") return;
      if (state.phase === "talk") { say(state.spoken, true); return; }
      if (interacting && visitor() && !near()) return;
      state.greeted = true;
      if (interacting) {
        if (visitor()) { select(0); show("menu"); say("menu"); }
        else { show("no-ooga"); say(demoRunning() ? "noOogaDemo" : "noOoga"); }
      } else {
        show("greeting");
        say(demoRunning() ? coarse ? "demoTouch" : "demo" : coarse ? "greetingTouch" : "greeting");
      }
    };
    const end = (line) => {
      show("return"); state.away = state.blocked = 0; if (line) say(line);
    };
    const resolveLine = (id) => {
      if (id === "observation") return state.observation;
      if (id === "source") return state.snapshotDemo ? "demoReport" : null;
      if (id === "history") return state.snapshotReplay ? "replayReport" : null;
      if (id === "signal") return feed.signal === "waiting" ? "waitingSignal" : feed.signal === "silent" ? "silentSignal"
        : feed.reading.stream === "replay" ? "replaySignal" : "liveSignal";
      if (id === "summary") return feed.reading.summary ? "summary" : "noSummary";
      return id;
    };
    const talk = () => {
      state.line = 0;
      const nodeMetadata = state.nodeReported && state.node === feed.reading.node;
      state.observation = state.tour === "health" ? NODE_LINES[feed.reading.node] : OBSERVATIONS[state.lastEvent] || tour.quiet;
      state.snapshotDemo = state.tour === "health" ? nodeMetadata && state.nodeDemo : !!state.lastEvent && state.demo;
      state.snapshotReplay = state.tour === "health" ? nodeMetadata && state.nodeReplay : !!state.lastEvent && state.replay;
      show("talk"); say(tour.stops[state.waypoint][0]);
    };
    const choose = (id) => {
      if (id === "island" && state.phase === "no-ooga") { leaveCave(); return; }
      if (!near()) { if (!visitor()) greet(); return; }
      if (Object.hasOwn(TOURS, id) && state.phase === "menu") {
        tour = TOURS[id]; state.tour = id;
        state.waypoint = 0; state.away = state.blocked = 0; state.lastEvent = null;
        show("walk"); say(tour.follow); return;
      }
      if (id === "stop" && state.phase === "talk") { end("cancelled"); return; }
      if (id !== "next" || state.phase !== "talk") return;
      if (state.utterance + 1 < SPEECH[state.spoken].length) {
        state.utterance++; say(state.spoken, true); return;
      }
      const lines = tour.stops[state.waypoint];
      while (++state.line < lines.length) {
        const line = resolveLine(lines[state.line]);
        if (line) { say(line); return; }
      }
      if (state.waypoint === tour.route.length - 1) end();
      else show("walk");
    };
    const unsubscribe = feed.subscribe((e) => {
      if (e.type === "node.started" || e.type === "node.ready" || e.type === "node.stopped") {
        state.node = e.type === "node.started" ? "starting" : e.type === "node.ready" ? "ready" : "stopped";
        state.nodeReplay = e.stream === "replay"; state.nodeDemo = e.schema === DEMO; state.nodeReported = true;
      }
      if (state.phase !== "walk" && state.phase !== "talk") return;
      if (!tour.events.includes(e.type)) return;
      state.lastEvent = e.type; state.replay = e.stream === "replay"; state.demo = e.schema === DEMO;
    });
    const move = (dt, returning) => {
      const index = returning ? state.waypoint : state.waypoint + 1, to = tour.route[index];
      const dx = to[0] - position.x, dz = to[2] - position.z, distance = Math.hypot(dx, dz);
      if (distance < 0.025) {
        if (returning) {
          if (index === 0) { show("idle"); state.tour = null; state.greeted = false; state.cooldown = 12; }
          else state.waypoint--;
        } else {
          state.waypoint = index;
          if (tour.stops[index]) talk();
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
      if (state.phase === "idle" && !state.greeted && !state.cooldown && near(4)) greet(false);
      if (state.phase === "greeting" || state.phase === "menu") {
        if (actor && !near() || !actor && state.phase === "menu") show("idle");
      }
      const touring = state.phase === "walk" || state.phase === "talk";
      if (touring) {
        if (!actor) end("abandoned");
        else if (!near(6)) {
          const before = state.away; state.away += dt;
          if (before < 4 && state.away >= 4) fx.say(figure, LINES.warning, 8);
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
      const look = state.phase === "talk" ? tour.look[state.waypoint] : null;
      if (!walking && look) {
        body.rotation.y = Math.atan2(look[0] - position.x, look[2] - position.z);
        parts.head.rotation.x = -Math.min(0.6, Math.max(-0.4, Math.atan2(look[1] - position.y - 1.1, Math.hypot(look[0] - position.x, look[2] - position.z))));
      } else {
        parts.head.rotation.x = 0;
        if (!walking && actor) body.rotation.y = Math.atan2(actor.root.position.x - position.x, actor.root.position.z - position.z);
      }
      signs.position.x = position.x; signs.position.y = position.y - BASE; signs.position.z = position.z;
      signs.rotation.y = actor ? Math.atan2(actor.root.position.x - position.x, actor.root.position.z - position.z) : body.rotation.y;
    };
    const act = () => {
      if (!near() || state.phase === "walk" || state.phase === "return") return false;
      if (state.phase === "talk") choose("next");
      else if (state.phase === "menu") choose(TOUR_ORDER[state.selection]);
      else greet();
      return true;
    };
    const menuKey = (e) => {
      if (state.phase !== "menu" || e.metaKey || e.ctrlKey || e.altKey) return false;
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown" && e.key !== "Enter") return false;
      e.preventDefault(); e.stopImmediatePropagation();
      if (!e.repeat && near()) {
        if (e.key === "Enter") choose(TOUR_ORDER[state.selection]);
        else select(state.selection + (e.key === "ArrowDown" ? 1 : -1));
      }
      return true;
    };
    // Capture repeats too: the director ignores repeated keydowns, but movement controls still read them.
    const captureMenuKey = (e) => {
      const target = e.target;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable
        || target.closest && target.closest("dialog"))) return;
      menuKey(e);
    };
    window.addEventListener("keydown", captureMenuKey, true);
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return false;
      if (menuKey(e)) return true;
      if (e.repeat) return false;
      if (e.key === "t" || e.key === "T") { if (visitor()) return act(); greet(); return true; }
      return false;
    };
    const dispose = () => {
      window.removeEventListener("keydown", captureMenuKey, true);
      unsubscribe();
      for (const pick of picks) input.remove(pick);
      removeChild(parent, body); removeChild(parent, signs);
      state.lastEvent = null;
    };
    return { root: body, state, update, greet, choose, act, onKey, dispose,
      liveGeometry(set) { set.add(figure.headOpen).add(figure.headClosed); } };
  };
  BL.factoryGreeter = { create, LINES, TOURS };
})();
