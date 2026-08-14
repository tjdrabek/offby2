# Choose the standalone application architecture

Type: grilling
Status: resolved
Blocked by: 01, 04, 06

## Question

What private application boundaries should separate physical layout, browser print rendering, calibration, persistence, product catalogs, and UI so the standalone production build remains coherent and testable without prematurely designing an npm package API?

## Answer

Build a static, installable React and TypeScript PWA with Vite and no required application server. Organize private modules around sheet-layout geometry and validation, calibration and profile compatibility, label-content layout, printable-scene generation, PDF rendering, IndexedDB persistence and migration, and application/UI features.

Dependencies point inward toward versioned serializable domain values. Geometry, calibration, compatibility, content layout, and scene generation do not import React, DOM, browser-storage, or PDF-library APIs. React renders and dispatches transitions but does not own calibration or final-generation rules.

Calibration and printing use explicit pure state machines or reducers, including validation when restoring persisted drafts. Durable records live behind application repositories over IndexedDB, active editing sessions use feature-level state, and transient presentation details remain local UI state rather than sharing one global mutable store.

PDF rendering accepts only a validated printable scene and returns bytes plus structured diagnostics. PDF-library types, font embedding, and browser download/open behavior remain contained at infrastructure and application boundaries.
