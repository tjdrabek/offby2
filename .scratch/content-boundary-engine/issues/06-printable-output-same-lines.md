# 06 — The printable output holds the same lines

**What to build:** What the designer sees is what prints: the print options and PDF placement take one boundary answer from the engine instead of two separate calls and a re-clamp, so the preview and the printable output provably consult the same content boundary.

**Blocked by:** 01 — The content boundary answers in the engine's main entry; 02 — Edge cut-off becomes an engine line producer.

**Status:** done

- [x] Print options build their PDF inputs from a single engine boundary call
- [x] The PDF path applies no clamp of its own — the engine's held answer is used as-is
- [x] A printed sheet places content identically to before for upright and sideways designs (verified against a downloaded PDF)
- [x] Demo typecheck and build green
