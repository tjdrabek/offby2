# Printer alignment variables

Research completed 2026-08-14. The sources establish classes of variation and control points, but do not establish a universal consumer-printer tolerance. Numeric package claims must come from this effort's physical experiments.

## Evidence

### The web page is not the physical sheet

CSS Paged Media distinguishes the page box from the physical page sheet. It explicitly defines printer-dependent non-printable areas, notes that a user agent may not know their dimensions, and leaves transfer of page boxes to sheets to the user agent. When page and sheet sizes differ, rotation, scaling, slicing, or clipping may occur; when the page box is smaller, placement may be centered or moved to a corner.

CSS absolute units have fixed ratios, and the specification recommends anchoring print media to physical units. That provides a sound authoring coordinate system, but not a guarantee that downstream scaling, rounding, driver behavior, or mechanics will place marks at the intended coordinates.

Sources:

- [CSS Paged Media Level 3: page terminology](https://www.w3.org/TR/css-page-3/#page-terms)
- [CSS Paged Media Level 3: page size and transfer](https://www.w3.org/TR/css-page-3/#page-size)
- [CSS Paged Media Level 3: transfer possibilities](https://www.w3.org/TR/css-page-3/#transfer-possibilities)
- [CSS Values and Units Level 4: absolute lengths](https://www.w3.org/TR/css-values-4/#absolute-lengths)

### Systematic position can exist below the browser

Brother documents printer-driver controls that adjust horizontal and vertical printout position for supported devices. This is direct evidence that a repeatable translation bias can exist in a printing setup and can be compensated. Because ordinary browser code cannot inspect those driver settings, a browser-side correction must be associated with the whole printing setup, not merely a printer model.

Source:

- [Brother: How to adjust the printout position](https://support.brother.com/g/b/faqend.aspx?c=us_ot&lang=en&prod=lptj4120tneus&faqid=faqp00100459_000)

### Feed and media conditions create skew and instability

Brother attributes skew to media outside specification, incorrect loading, guide placement, paper-size mismatch, and dirty feed rollers or pads. Its manual-feed guidance requires a straight, centered sheet with correctly adjusted guides and says continued skew after those controls may require service. These are setup and mechanical variables, not document-layout variables.

Sources:

- [Brother: Skewed printed pages from the manual feed slot](https://help.brother-usa.com/app/answers/detail/a_id/153721/~/skewed-printed-pages-when-printing-from-the-manual-feed-slot)
- [Brother: The paper is skewed when printed](https://support.brother.com/g/b/faqend.aspx?c=us_ot&lang=en&prod=dcp7020_us&faqid=faq00002616_001)

## Classification for calibration

### Potentially correctable when measurements prove stability

- **Translation**: a consistent horizontal and vertical displacement of the whole sheet.
- **Axis scale**: a consistent difference between intended and observed distances along an axis, provided it is not caused by a changing dialog setting.
- **Rotation/skew**: theoretically correctable as a whole-sheet rotation, but only if repeated measurements show a stable bias rather than feed variation. It should not be assumed in the first model.
- **Browser/OS/driver-specific layout bias**: correctable only as part of the same named printing setup and only while its components and settings remain fixed.

### Not defensibly correctable by a saved browser profile

- run-to-run sheet-feed variation;
- a sheet loaded off-center or against guides differently;
- changing skew during a sheet's travel or non-affine deformation;
- dirty or worn rollers and faults requiring service;
- media outside the printer's supported weight, size, thickness, or condition;
- changing paper size, scaling, margins, orientation, browser, driver, or other dialog/setup choices;
- mismatch between the selected layout and the physical product; and
- marks requested inside the device's non-printable area.

## Consequences for the package specification

1. Treat a printer profile as empirical calibration for a named printing setup, never as a model-wide printer capability record.
2. Begin experiments with whole-sheet x/y translation. Add independent x/y scale or rotation only when repeated measurements demonstrate stable residual error that the simpler model cannot explain.
3. Measure repeated copies, positions across each sheet, and multiple load cycles. A single calibration page cannot separate systematic bias from feed noise.
4. Record the exact browser, operating system, printer/driver, media, feed path, orientation, paper size, and required dialog settings with each experiment.
5. Invalidate or warn on profile reuse when recorded setup assumptions change.
6. Define alignment tolerance empirically and report a distribution or worst observed error for the tested matrix. The reviewed sources do not justify a universal value such as ±2 mm.
7. Provide operator instructions for media compatibility, straight loading, guides, and 100%/actual-size settings where the selected browser exposes them.

## Open experimental questions

- Whether translation alone is stable across repeated load cycles for available consumer printers.
- Whether error changes systematically from the leading to trailing edge, indicating scale or transport effects.
- Whether skew is repeatable enough to calibrate or should remain part of the tolerance budget.
- Whether a profile remains valid after browser, driver, feed-path, or media-lot changes.
