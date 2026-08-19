# 05 — Fit measurement agrees with the engine

**What to build:** A label designer with a sideways design and unequal paddings is never refused a change the label has room for: the demo's fit refusals are judged via the engine's readback agreement check (shim gathers the rendered numbers, core judges), and the hand-written reassignment of paddings to screen edges in fit measurement is deleted.

**Blocked by:** 03 — The web conveniences ship.

**Status:** ready-for-agent

- [x] Fit measurement consumes the engine's readback judgement instead of its own computed-style reassignment
- [x] The demo carries no padding-to-screen-edge mapping of its own
- [ ] Overflow refusals behave as before for upright designs and correctly for sideways designs with unequal paddings (verified by running the demo)
- [ ] Demo typecheck and build green
