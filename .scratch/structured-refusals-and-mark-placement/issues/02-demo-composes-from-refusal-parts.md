# 02 — Demo shows refusals without the entry remedy it cannot honour

**What to build:** The demo's resolution status and per-field messages compose refusal text from the package's structured parts, omitting the enter-the-value remedy for the dimensions the demo derives instead of asking for — so the interface never instructs users to enter a value into an input that does not exist. The demo's message-surgery module (the one whose own docstring calls regex-stripping another module's prose "a poor way to build on an API") is deleted; the demo never concatenates refusal prose itself, it chooses which remedies survive and lets the package's composer speak.

**Blocked by:** 01 — Refusals carry explanation and remedies as parts.

**Status:** ready-for-agent

- [ ] A derivation refusal for a non-enterable dimension renders with its explanation intact and no "enter this one" / "Enter a value." ending, produced by the package composer over filtered parts — not by string surgery.
- [ ] Refusals whose remedies the demo can all honour render exactly the package's full composed message.
- [ ] The message-surgery module and its regexes are gone; no demo code pattern-matches the package's prose.
- [ ] Existing demo suites covering resolution-status wording adapt to the parts-based path and pass.

## Comments
