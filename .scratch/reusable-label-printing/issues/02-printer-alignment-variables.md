# Identify printer alignment variables

Type: research
Status: resolved

## Question

Which repeatable and non-repeatable variables in ordinary consumer printer, driver, browser, and sheet-feed behavior affect label placement, and which of those variables can a software calibration profile defensibly correct?

## Answer

A profile can defensibly correct only errors that repeated measurements show are stable for one named printing setup. Whole-sheet horizontal and vertical translation is the justified starting model; independent axis scale or rotation should be added only if experiments expose stable residual patterns. Browser/OS/driver biases belong to that same setup identity.

Run-to-run feed variation, inconsistent loading, changing skew, unsupported or changing media, worn or dirty mechanics, altered dialog settings, non-printable regions, and layout/product mismatch cannot be repaired by saved browser calibration. Experiments must separate systematic error from variation across repeated load cycles and sheet positions. No reviewed primary source supports a universal numeric consumer-printer tolerance, so this effort must derive any claim from its own test matrix.

Detailed findings: [Printer alignment variables](../research/printer-alignment-variables.md)
