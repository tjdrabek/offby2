# 04 — The demo preview draws from the engine

**What to build:** A label designer sees the preview hold content at the engine's boundary: the preview and designer consume `contentBoundary` and the web entry's CSS var map, and the guide lines — padding and cut-off at their own distances, crossing when they cross — render from the engine's per-line answers. The preview's local axis swap and scattered clamps are gone.

**Blocked by:** 02 — Edge cut-off becomes an engine line producer; 03 — The web conveniences ship.

**Status:** done

- [x] Preview content stop, padding guide, and cut-off guide all derive from one engine call
- [x] No orientation remap or half-extent clamp remains in demo preview code
- [x] Sideways and upright designs render identically to before across sheet presets (verified by running the demo)
- [x] Demo typecheck and build green

## Comments

Verified by running the demo. A throwaway Vite page rendered `LabelPreview`
for every sheet preset × upright/sideways × counted/uncounted edge cut-off —
28 previews — and Playwright screenshotted it at 2× against the pre-change
sources. Pixel diff: 0 of 7,500,800 differing pixels. The real application was
driven too: the boundary readout gives the same millimetres as before
(3.3 / 1.8 upright, 3.3 / 3.3 sideways on the default sheet), and the three
React console warnings it emits are present on the baseline as well —
`runAutoLayout` probing the DOM during render, untouched here.

Beyond the preview: the designer, the print panel and `preferredLayout` take
the same engine answer, so no orientation remap is left outside the engine.
`heldInset` still exists in `labelLayout` for the PDF path — ticket 06's
ground.

The designer's boundary sentence now takes its wording from `designAxes`
rather than swapping the axes back onto the label: a sideways design reads
"from the bottom and top", which is where those distances actually land.
