# Browser printing constraints

Research completed 2026-08-14 for current desktop Chromium, Firefox, and Safari.

## Decision-relevant findings

### Browser-controlled surface

- CSS can select print media with `@media print`, describe page geometry with `@page`, and control fragmentation with the CSS break properties. These are layout instructions to the browser's print formatting process, not control over the downstream printer or driver.
- `window.print()` opens the browser's print dialog. The API accepts no printer or settings arguments.
- `beforeprint` and `afterprint` allow a page to adapt around the dialog, but do not report which printer or settings were selected or establish that physical output succeeded.
- Physical CSS units express intended dimensions. Their faithful realization on paper still depends on the browser, operating-system print path, driver, selected media, scaling, and hardware.

Primary references:

- [CSS Paged Media Module Level 3](https://www.w3.org/TR/css-page-3/)
- [CSS Fragmentation Module Level 3](https://www.w3.org/TR/css-break-3/)
- [Media Queries Level 5: media types](https://www.w3.org/TR/mediaqueries-5/#media-types)
- [HTML Living Standard: printing](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#printing)
- [MDN: `@page`](https://developer.mozilla.org/en-US/docs/Web/CSS/@page)
- [MDN: `Window.print()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/print)
- [MDN: printing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Printing)

### User-controlled surface

The standard web printing surface does not let ordinary page script:

- enumerate or select installed printers;
- query a printer's printable area, resolution, trays, loaded media, or other capabilities;
- set or read print-dialog paper size, scaling, margins, orientation, quality, or destination;
- suppress the ordinary dialog for general web content; or
- distinguish successful physical printing from cancellation or output to a file.

Those choices remain with the browser, operating system, driver, and human operator. Browser-specific or managed-environment facilities must not be treated as a portable library capability.

### Cross-browser qualification

`@page` and print CSS form the portable baseline, but individual descriptors and print-preview behavior must be tested rather than inferred from the existence of the at-rule. In particular, orientation, named/custom page sizes, margins, headers and footers, default scaling, and precedence between CSS and dialog choices can differ or be overridden. Compatibility data is a starting point, not evidence of physical placement.

References:

- [MDN: CSS paged media](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_paged_media)
- [WebKit blog: WebKit features in Safari 18.2](https://webkit.org/blog/16401/webkit-features-in-safari-18-2/)

## Responsibility boundary implied by the evidence

The package can own:

1. deterministic sheet and label geometry;
2. print-specific DOM/CSS generation;
3. page fragmentation and content containment;
4. a preview and calibration workflow;
5. serializable correction data; and
6. instructions and checks for required user choices where observable.

The host application and human operator must own:

1. naming and selecting the intended printing setup;
2. choosing the physical printer, paper, and required dialog settings;
3. measuring calibration output;
4. storing profiles through the package's persistence abstraction; and
5. confirming that the expected media and setup are in use.

The package must not promise printer discovery, silent printing, enforced dialog settings, or uncalibrated physical accuracy from standard browser APIs.

## Unknowns requiring prototypes

- How each target browser resolves exact physical units and `@page` declarations through the available operating-system print paths.
- Whether print-preview output is a useful predictor of physical placement.
- Which dialog settings survive between runs and how prominently each browser exposes them.
- Whether correction is stable across runs for each available printing setup.
