# Lightning Factory greeter

Status: design discussion; implementation awaits the maintainer's sketch.

## Purpose

Offer visitors an optional introduction to the Lightning Factory through a greeter in the world. The tour should explain what visitors are seeing while they remain in the hall, drawing on the spirit of Heimdall at ₿IFRÖST and Zuzu in DSB Land.

## Starting constraints

- The greeter offers learning at the entrance; visitors can decline and continue exploring.
- Explanations adapt to the fields the active feed actually supplies. Foundry's public schema omits routes and fees. `station`, `out` and `fee` belong to the OBL demo contract and must not be required for the tour to be useful.
- Demo-specific explanations must be identified as demonstrations. Missing data must not become an invented route, fee, balance or failure reason.
- The tour observes the node; it must not emit payment events or alter accounting.
- Placement, tour progression, interruption and return behaviour remain design decisions, to be settled before implementation.
- Implementation follows the existing scene lifecycle and allocation constraints and works with both renderers and phone controls.

## Awaiting the maintainer's sketch

1. Where the greeter stands and how a visitor accepts or declines the invitation.
2. How the optional tour moves through the hall, including stopping or resuming it.
3. Which explanations and world cues remain available on the public feed, and which additional ones are appropriate for the demo.

## Reference material

[PR #112](https://github.com/OogaBoogaX/oogaboogaland/pull/112) preserves the earlier settled/failed-forward explanations. Its dialog walkthrough was rejected and is reference material only; this branch carries over none of its dialog, HUD wiring, styles, scene guide or checks.

The hotpixelgroup character landed separately in [PR #117](https://github.com/OogaBoogaX/oogaboogaland/pull/117).
