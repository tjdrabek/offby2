# 02 — Demo shows refusals without the entry remedy it cannot honour

**What to build:** The demo's resolution status and per-field messages compose refusal text from the package's structured parts, omitting the enter-the-value remedy for the dimensions the demo derives instead of asking for — so the interface never instructs users to enter a value into an input that does not exist. The demo's message-surgery module (the one whose own docstring calls regex-stripping another module's prose "a poor way to build on an API") is deleted; the demo never concatenates refusal prose itself, it chooses which remedies survive and lets the package's composer speak.

**Blocked by:** 01 — Refusals carry explanation and remedies as parts.

**Status:** done

- [x] A derivation refusal for a non-enterable dimension renders with its explanation intact and no "enter this one" / "Enter a value." ending, produced by the package composer over filtered parts — not by string surgery.
- [x] Refusals whose remedies the demo can all honour render exactly the package's full composed message.
- [x] The message-surgery module and its regexes are gone; no demo code pattern-matches the package's prose.
- [x] Existing demo suites covering resolution-status wording adapt to the parts-based path and pass.

## Comments

`lib/messages.ts` (the regex-based `withoutEntryRemedy`) is deleted. In its place, `lib/units.ts` gained `withoutEnterValueRemedy`, a thin wrapper that filters the package's own `remedies` list by `action !== "enter-value"` and hands what's left to the package's `composeRefusalMessage` — no string is ever parsed or rewritten. `App.tsx`'s `visibleIssues` and `derivedMessages`, and `ResolutionStatus.tsx`'s per-axis refusal paragraph, all call it now. Fields the demo doesn't offer (`isDerivedField`) never see the "enter a value" instruction; every other refusal still renders the package's full composed message unchanged. `composeRefusalMessage`/`composeRemedies`/`ENTER_VALUE_REMEDY`/the remedy types were published from the package's main entry (`src/index.ts`) so the demo reaches them the same way it reaches everything else. New `lib/units.test.ts` pins the filtering behaviour with plain data plus one end-to-end case through `resolveSheetLayout` (a too-narrow sheet drives label width negative on the horizontal axis) asserting the rendered message has no "enter this one" / "Enter a value." ending. Demo: typecheck, lint, 125/125 tests, production build all clean.
