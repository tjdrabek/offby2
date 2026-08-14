# Separate domain workflow from host and physical printing

Status: superseded by ADR-0002

The package owns versioned serializable domain schemas, calibration semantics, profile-compatibility checks, pagination, deterministic PDF printable output, and replaceable persistence contracts. Optional headless React bindings expose those capabilities, while the host application owns presentation, durable storage policy, and opening printable output; the browser and human operator retain print-dialog and physical responsibilities. This boundary keeps calibration reusable across hosts and future framework adapters without pretending browser code can inspect or enforce a physical printing setup.
