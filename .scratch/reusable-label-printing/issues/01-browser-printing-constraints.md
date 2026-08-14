# Establish browser printing constraints

Type: research
Status: resolved

## Question

Which aspects of physical page size, CSS print layout, margins, scaling, print-dialog defaults, printer selection, and printer capability detection can a browser library reliably control or observe in current desktop Chromium, Firefox, and Safari, and which must become explicit user or host-application responsibilities?

## Answer

The portable browser surface is CSS-centric: the package can describe page and label geometry, print styling, and fragmentation, then invoke the ordinary print dialog. Standard page script cannot enumerate or select printers, inspect hardware capabilities, set or read dialog choices, guarantee silent printing, or verify physical output. Page geometry and physical units remain subject to browser, operating-system, driver, dialog, and hardware behavior, so compatibility and physical accuracy require explicit validation.

The package may own preview, calibration guidance, and serializable corrections. The host application and human operator must identify the intended printing setup, choose the printer and dialog settings, measure output, and persist profiles through the package abstraction.

Detailed findings: [Browser printing constraints](../research/browser-printing-constraints.md)

Research context: branch `research/browser-printing-constraints` at `ae89770`.
