# Lightning Factory greeter

Draft implementation of the first complete tour, following drneski's design direction. The foreman, route and lines are proposals for review. Payments is the first tour; Channels, Rebalancing and Node health will extend this same menu after the first interaction is reviewed.

## Visitor experience

A factory foreman in a leather apron and yellow hardhat stands beside the entrance, leaving the central arrival path clear. He waves and offers a tour with pickable signs beside him, not a modal. His greeting identifies the simulated demo node while it is running.

The visitor says yes, chooses Payments, and follows with their own Ooga and camera. Space, the act button or T talks to the nearby foreman and advances choices; the signs can also be tapped. During walking, Space remains available for the visitor's usual action. Tapping the foreman at a stop repeats the current line. Continue advances only on request.

Arriving without an Ooga opens directions to pick one on the island. Pick an Ooga returns to the island; the visitor must pick one there and walk into the factory. The greeter never assigns an Ooga.

## Payments itinerary

1. Entrance post at x 1.55, y 5, z 26; descend the broad central staircase.
2. Pit viewing spot at x -6.5, y 0, z 8.5: explain channels connecting peers and payments passing through several nodes.
3. Existing left pit-to-core stairs, then the landing near x -4.8, y 5, z 0.1: explain the core and forwarding, then the public feed's privacy boundary.
4. Retrace the stairs to a floor viewing spot near x -7, y 0, z 8.5 facing the switchboard: explain settled and failed outcomes, describe a report received during this tour if one exists, then finish.
5. Run back along the same waypoints to the entrance post.

The tour doesn't require station, out or fee. No incoming event is required to continue; a quiet tour uses conceptual dialogue. Observations distinguish public versus demo and live versus replay. A failed outcome never implies a cause, and a missing fee never means zero. This first slice deliberately does not reconstruct routes or animate additional payment events.

## Ending and giving way

One tour runs at a time. Beyond six metres from the visitor the foreman waits. After four seconds he calls back; after twelve seconds he gives up with “Lost my visitor again!” and runs back. There is no pause/resume tour state. End Tour or Escape also returns him to his post; leaving the cave disposes the tour. Escape after cancellation retains the factory's normal exit behaviour.

The foreman steps through the existing support and collision functions, in small increments, and gives way sideways when the floor permits it, waiting on a narrow passage when the visitor occupies his next step. A blocked outward route ends after five seconds; the return waits for a clear path rather than walking through obstacles. Navigation around other occupants and the proposed observation sightlines need maintainer play-test.

## Implementation boundary

factory-greeter.js owns a visit's rig, fixed waypoints, world-choice signs, bounded state and one feed subscription. Lines are separately named data for future speech. It never fetches, emits node events, changes accounting, assigns player control or takes over the camera. The visit removes all its picks and unsubscribes on exit. Both renderers use the same existing rig and sign geometry.

## Validation and next review

Build and JavaScript syntax checks are the repository's default validation for this draft. No browser or unit checks are claimed. Please play-test:

- Arrival with an Ooga versus a direct /lightning arrival without one.
- Show me → Payments → all stops → return; decline, cancellation and repeat visits.
- Stop following, wait for the warning and frustrated return; leave during a tour.
- Public forward reports with no station, out or fee, demo reports, replay and no events.
- Space, T and tapped world signs; phone readability, sightlines and Canvas 2D.
- Route clearance, stair support, returning past the visitor and the scene leave contract.

After the first slice is reviewed, add separate Channels (forge and channel), Rebalancing (ring machine) and Node health (watchtower) tours. The health explanation must distinguish an explicit node.stopped report from a silent feed. Their exact walking routes and lines remain to be proposed.

[PR #112](https://github.com/OogaBoogaX/oogaboogaland/pull/112) preserves the earlier explanations as reference material only. None of its rejected walkthrough implementation is carried over. The hotpixelgroup character landed independently in [PR #117](https://github.com/OogaBoogaX/oogaboogaland/pull/117).
