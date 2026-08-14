# Set the package responsibility boundary

Type: grilling
Status: resolved
Blocked by: 01

## Question

From selecting a sheet layout through rendering, previewing, calibrating, choosing a profile, invoking print, and handling user-controlled print-dialog settings, which responsibilities belong to the framework-neutral core, the React integration, the host application, the browser, and the human operator?

## Answer

The framework-neutral core validates domain values, governs calibration transitions, checks profile compatibility, paginates label content, and generates deterministic PDF printable output. Optional headless React bindings expose that workflow without owning presentation.

The host application owns styling, durable persistence policy, and the interaction used to download or open printable output. The browser owns its PDF viewer and print dialog. The human operator identifies the printing setup as completely as practical, selects the physical printer, loads the sheet, applies and reconfirms the loading procedure and print configuration, records calibration observations, and attests to physical results. Opening `window.print()` is not part of the package contract.

## Comments

- The later standalone-app-first decision removes the need to specify a public host/package boundary now. Preserve the accepted responsibility split internally: domain logic owns validation and calibration semantics, the application UI owns interaction and presentation, and the browser and operator retain dialog and physical control.
