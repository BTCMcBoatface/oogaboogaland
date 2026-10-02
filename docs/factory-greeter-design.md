# Lightning Factory greeter

Draft implementation of four optional world tours, following drneski's design direction. The foreman, routes and lines are proposals for review: Payments, Channels, Rebalancing and Node health.

## Visitor experience

A factory foreman in a leather apron and yellow hardhat stands on the left as visitors enter, leaving the central arrival path clear. He waves and offers a tour through speech only: Press Space on desktop, Tap me on phones. There are no initial SHOW ME or EXPLORE signs; walking past declines naturally. His greeting identifies the simulated demo node while it is running.

Space beside him, or a click or tap on him, opens the tour signs. They disappear when a tour is chosen or the visitor walks away. The visitor chooses a tour, and follows with their own Ooga and camera. Space, the act button or T talks to the nearby foreman and advances choices; the signs can also be tapped. During walking, Space remains available for the visitor's usual action. Tapping the foreman at a stop repeats the current line. Continue advances only on request. Full lines remain voice-ready data; their short speech beats fit the existing single-line bubbles. Arrow keys select a tour and Enter or T starts it; menu arrows do not move the visitor.

Interacting without an Ooga opens directions to pick one on the island. Pick an Ooga returns to the island; the visitor must pick one there and walk into the factory. The greeter never assigns an Ooga.

## Payments itinerary

1. Entrance post at x -1.55, y 5, z 26; descend the broad central staircase.
2. Pit viewing spot at x -6.5, y 0, z 8.5: explain channels connecting peers and payments passing through several nodes.
3. Existing left pit-to-core stairs, then the landing near x -4.8, y 5, z 0.1: explain the core and forwarding, then the public feed's privacy boundary.
4. Retrace the stairs to a floor viewing spot near x -7, y 0, z 8.5 facing the switchboard: explain settled and failed outcomes, describe a report received during this tour if one exists, then finish.
5. Run back along the same waypoints to the entrance post.

The tour doesn't require station, out or fee. No incoming event is required to continue; a quiet tour uses conceptual dialogue. Observations distinguish public versus demo and live versus replay. A failed outcome never implies a cause, and a missing fee never means zero. The tours do not reconstruct routes or animate additional node events.

## Other itineraries

- Channels: descend the arrival stairs to the forge viewing spot (-4.8, 0, 5.8), explaining opening and closing on-chain. Take the left core stairs and the existing bridge to the inner channel porch (-8.5, 5, -2.5). Explain reported states, daily public slots and capacity versus private directional balances. A channel report is not attributed to the particular station being viewed.
- Rebalancing: descend the arrival stairs, pause on the right pit floor (4.8, 0, 10) to explain liquidity, then face the ring machine from (8.5, 0, 9.5). Explain hourly reports, success and failure, without naming private channels or inventing failure causes.
- Node health: take the core landing, explaining the last reported node state. Continue across the channel porch and up the existing high stairs to an observation landing (-9.2, 10, -10.1), looking up at the watchtower. Distinguish an explicit stopped report from a waiting or silent feed; incoming replay is not a fresh health check, and activity summaries are not diagnoses.

Each tour returns along its own waypoints. Reports are optional, retained only as bounded scalar observation state and labelled as demo or replay when appropriate. No tour waits for an event before allowing the visitor to continue.

## Ending and giving way

One tour runs at a time. Beyond six metres from the visitor the foreman waits. After four seconds he calls back; after twelve seconds he gives up with “Lost my visitor!” and runs back. There is no pause/resume tour state. End Tour returns him to his post. Escape always exits the cave immediately; leaving disposes the tour, including the greeting and menu.

The foreman steps through the existing support and collision functions, in small increments, and gives way sideways when the floor permits it, waiting on a narrow passage when the visitor occupies his next step. A blocked outward route ends after five seconds; the return waits for a clear path rather than walking through obstacles. Navigation around other occupants and the proposed observation sightlines need maintainer play-test.

## Implementation boundary

factory-greeter.js owns a visit's rig, fixed waypoints, world-choice signs, bounded state and one feed subscription. Lines are separately named data for future speech. It never fetches, emits node events, changes accounting, assigns player control or takes over the camera. The visit removes all its picks and unsubscribes on exit. Both renderers use the same existing rig and sign geometry.

## Validation and next review

Build and JavaScript syntax checks are the repository's default validation for this draft. No browser or unit checks are claimed. Please play-test:

- Arrival with an Ooga versus a direct /lightning arrival without one.
- Space/click/tap foreman → each of the four tours → all stops → return; decline, cancellation and repeat visits.
- Stop following, wait for the warning and frustrated return; leave during a tour.
- Public reports without routes, fees or private balances; demo, replay and no events; node stopped versus feed silence.
- Space, T and tapped world signs; phone readability, sightlines and Canvas 2D.
- Route clearance, stair support, returning past the visitor and the scene leave contract.

All four routes and their speech are implemented as proposals. Stair and bridge clearance, observation sightlines, menu picking and mobile readability remain for maintainer play-test before the draft is ready to land.

[PR #112](https://github.com/OogaBoogaX/oogaboogaland/pull/112) preserves the earlier explanations as reference material only. None of its rejected walkthrough implementation is carried over. The hotpixelgroup character landed independently in [PR #117](https://github.com/OogaBoogaX/oogaboogaland/pull/117).
