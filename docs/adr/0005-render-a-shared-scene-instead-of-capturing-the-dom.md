# Render a shared scene instead of capturing the DOM

Treat the serializable label-content tree as authoritative and convert it into one framework-neutral scene rendered by both React/SVG previews and deterministic PDF output. Do not use arbitrary rendered DOM as the printable source: this adds a constrained rendering model, but prevents browser layout, preview scaling, external assets, and screenshot behavior from silently changing physical output.
