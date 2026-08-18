# Build the standalone application before extracting a package

Status: amended by ADR-0007 — engine extraction has begun

Build and validate a production-quality standalone application before deciding whether to extract an npm package. Keep geometry, calibration, profile compatibility, pagination, and PDF generation behind sensible private boundaries for correctness and testing, but defer public APIs, framework neutrality, replaceable storage contracts, and package scope until production behavior and concrete consumers reveal what is genuinely reusable. This trades early reuse guarantees for faster learning and avoids freezing speculative abstractions around a workflow that still lacks physical validation.
