# 04 — The demo preview draws from the engine

**What to build:** A label designer sees the preview hold content at the engine's boundary: the preview and designer consume `contentBoundary` and the web entry's CSS var map, and the guide lines — padding and cut-off at their own distances, crossing when they cross — render from the engine's per-line answers. The preview's local axis swap and scattered clamps are gone.

**Blocked by:** 02 — Edge cut-off becomes an engine line producer; 03 — The web conveniences ship.

**Status:** ready-for-agent

- [ ] Preview content stop, padding guide, and cut-off guide all derive from one engine call
- [ ] No orientation remap or half-extent clamp remains in demo preview code
- [ ] Sideways and upright designs render identically to before across sheet presets (verified by running the demo)
- [ ] Demo typecheck and build green
