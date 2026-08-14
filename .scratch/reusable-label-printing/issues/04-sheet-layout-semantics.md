# Define sheet layout semantics

Type: grilling
Status: resolved

## Question

What geometry, identity, units, validation rules, and versioning must a sheet layout represent in the first package specification, and where is the boundary between user-defined layouts, a separable product catalog, and unsupported media?

## Comments

- Represent rectangular layouts using rows, columns, gaps, margins, and sheet and label dimensions rather than making an explicit rectangle list the authoring model.
- Let users enter and view dimensions in fractional imperial, decimal imperial, or metric units according to their preference.
- Keep sheet layout and calibration separate: sheet layout describes physical stock geometry, while calibration observations and printer profiles describe a printing setup's behavior.
- Treat published sheet layouts as immutable revisions. Geometry changes create a new revision; independently edited copies receive a new identity. A printer profile binds to the exact identity and revision.
- Reopened because common label boundaries have rounded die-cut corners. The first specification must decide whether corner radius is sheet-layout geometry, how unknown or approximate radii are represented, and whether preview and validation use actual boundary clipping.
- Each label boundary is initially an axis-aligned rounded rectangle. Corner radius is part of the immutable sheet-layout revision; zero means square corners, while unknown remains distinct from zero.
- Catalog radius is claimed geometry until physically verified. Circular, oval, continuous, and arbitrary die-cut shapes remain deferred.

## Answer

A sheet layout is an immutable, identified revision of a uniform rectangular grid. It contains sheet and label dimensions, row and column counts, four independent outer margins, and uniform horizontal and vertical gaps. Domain geometry is normalized to millimetres; fractional-imperial, decimal-imperial, and metric input and display are user-interface choices preserved separately from geometry. PDF points are used only at rendering boundaries.

Users may provide all known dimensions. The package validates the resulting dimensional equations without silently adjusting contradictory values. When exactly one value is missing and has a unique solution, it may be derived, but the completed revision stores resolved geometry and records that derivation. Irregular grids are unsupported in the first specification rather than approximated.

Geometry changes create a new revision; an independently edited copy receives a new identity. Printer profiles bind to the exact identity and revision, protected by a canonical geometry fingerprint. Sheet layout remains independent of calibration observations and printer profiles.

Catalog and user-defined layouts share one schema. Product identifiers, source provenance, and physical-verification status are independent metadata; catalog inclusion claims known geometry, not physical verification. Rectangular unverified layouts remain usable with explicit status, while non-rectangular and continuous media remain outside scope.

Each label boundary is an axis-aligned rounded rectangle. Its corner radius is revisioned sheet-layout geometry: zero means square corners and unknown remains distinct from zero. Catalog radii are claimed geometry until physically verified. Circular, oval, continuous, and arbitrary die-cut shapes are deferred.

The safe area is the rounded label boundary reduced by alignment tolerance. Content inset reduces that safe area again. Unknown corner radius permits editing and printing but prevents a corner-safety claim; the application may accept a conservative estimate without treating it as physical verification.
