# Define the label-content authoring model

Type: grilling
Status: resolved
Blocked by: 04

## Question

How can a personal web application let a user create flexible, responsive label content rendered through React while keeping label content serializable, previewable, printable, portable, and safe, and what authoring capabilities are intentionally deferred?

## Comments

- Each physical label position presents a bounded responsive content region with real-time preview.
- A user-selected content inset may keep content farther from the edge than the safe area requires.
- “Whatever I want” remains unresolved: it could mean composing supported elements, selecting application-provided React components, or executing arbitrary user-authored React code, which have materially different security and portability consequences.
- Label content will be a serializable component tree configured through the UI and rendered by application-owned React components. Arbitrary user-authored JavaScript is not executed.
- Initial component families are text, images, QR codes, basic shapes, and row, column, and stack layout. The internal registry may be extensible without becoming a public plugin contract.
- Responsiveness is based on the physical content region. Preview zoom scales an already-laid-out result and must not alter reflow or breakpoints; label preview, sheet preview, and printable output use the same content tree and constraints.
- Content inset is additive to alignment tolerance and stored with label content or a reusable content template, not with a sheet layout or printer profile.
- A reusable label content template can be instantiated with per-label data and optional overrides. Users may still assign unrelated content to each label position.
- Composition starts with responsive row, column, and stack layouts, alignment, gaps, and sizing. A separate overlay layer supports elements that genuinely require free positioning; absolute positioning is not the default model.
- Imported images are copied into local storage and exports. The application provides a documented bundled font set whose printable representation is embedded or outlined. External image URLs and unrecorded system fonts are not accepted as durable printable dependencies; custom font import is deferred.

## Answer

Label content is a versioned serializable component tree configured through the application and rendered by application-owned React components; arbitrary user-authored JavaScript and raw persisted CSS are excluded. Initial elements include text, locally retained images, QR codes, basic shapes, responsive row, column, and stack layouts, and a deliberate overlay layer for free positioning.

Reusable label content templates accept per-label data and optional overrides, while unrelated content may still be assigned independently to any position. Sizing supports physical lengths, percentages, flexible space, intrinsic sizing, constrained typography, alignment, and gaps. Layout responds to the physical content region, never preview zoom or viewport size.

The serializable tree is authoritative and is converted to a framework-neutral printable scene. React/SVG previews and deterministic PDF output render that same scene rather than capturing arbitrary DOM. Imported assets are included in local persistence and backups; bundled fonts are embedded or outlined for output determinism.

The application continuously displays the rounded label boundary and safe-area violations. Violations block printing by default; an explicit advanced override may proceed but is recorded with the printable output and does not establish safety.