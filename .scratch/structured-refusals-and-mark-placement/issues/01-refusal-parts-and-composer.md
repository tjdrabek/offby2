# 01 — Refusals carry explanation and remedies as parts

**What to build:** Everywhere the sheet-layout entry says no with prose — the required-value issue, count and measurement validation issues, and every derivation refusal — the value carries an explanation (what happened and why) and a list of remedies, each remedy naming the action it asks for (entering the field's value, or checking the other values on the axis) alongside that remedy's prose fragment. A single package composer produces the full `message` from those parts, so a host that wants one line gets exactly what it gets today, while a structured host can filter remedies by action code before composing. Explanation-only is a valid shape, not a special case. Existing consumers see byte-identical prose.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Every refusal and validation issue from the sheet-layout entry exposes an explanation and a (possibly empty) list of remedies, each remedy carrying an action code and its prose fragment.
- [ ] The composed `message` remains on the value and equals the package composer applied to the parts — the sentence a host shows and the parts it filters can never tell different stories.
- [ ] Message composition lives in the package once; the composer is public so a host that filters remedies can still let the package speak.
- [ ] The historical prose is pinned through the composed message in the existing resolution and derivation suites: every current wording survives the restructuring byte for byte.
- [ ] Tests exercise external behaviour only, through the package's public entry points, extending the existing pure-data example suites.

## Comments
