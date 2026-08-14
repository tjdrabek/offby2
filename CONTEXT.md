# Label Printing

This context describes placing user-controlled content onto physical adhesive labels using ordinary consumer printing workflows.

## Language

**Label sheet**:
A physical sheet of adhesive labels intended to pass through a printer as one unit.
_Avoid_: Sticker paper, label paper

**Sheet layout**:
The physical geometry of a label sheet, including its sheet dimensions and the position and size of every label.
_Avoid_: Grid format, template

**Printer profile**:
Calibration data that accounts for repeatable placement differences introduced by a particular printing setup.
_Avoid_: Printer settings, printer model

**Printing setup**:
The real-world combination of printer, operating system, driver, browser, print settings, and media-feed conditions for which calibration is valid.
_Avoid_: Printer, printer model

**Alignment tolerance**:
The maximum acceptable difference between the intended and observed placement of content on a physical label.
_Avoid_: Perfect alignment, exact printing

**Label content**:
User-controlled material intended to appear on one physical label.
_Avoid_: Design, artwork

**Safe area**:
The region inside a label boundary within which label content must remain after accounting for the alignment tolerance.
_Avoid_: Margin, padding

**Printable output**:
A representation of label content positioned at intended physical locations on a label sheet and ready for a user to send through their printing setup.
_Avoid_: Print job, document

**Sheet layout catalog**:
A collection of predefined sheet layouts identified by the label products they describe.
_Avoid_: Template library, label database

**Label content package**:
Label content bundled with the styles and assets needed to reproduce its intended appearance independently of the surrounding application.
_Avoid_: Live DOM, HTML snippet

**Calibration sheet**:
Printable output containing measurement marks used to observe placement differences for a printing setup.
_Avoid_: Test page, alignment page

**Used position**:
A label position on a label sheet whose adhesive label has already been removed or made unavailable for later printing.
_Avoid_: Empty label, skipped cell

**Partially used sheet**:
A label sheet containing one or more used positions.
_Avoid_: Used sheet, partial sheet

**Leading edge**:
The edge of a label sheet that enters the printer first.
_Avoid_: Top, front

**Printable face**:
The side of a label sheet whose labels receive the printed content.
_Avoid_: Front, top

**Loading procedure**:
Instructions for placing a label sheet into a printing setup, including the feed source, leading edge, and printable-face direction.
_Avoid_: Feed instructions, loading orientation

**Print configuration**:
User-selectable print-dialog and driver values that affect physical output, including paper size, scale, orientation, media type, feed source, duplex mode, and optional page decoration.
_Avoid_: Printer settings, print options

**Placement bias**:
A repeatable difference between intended and observed placement that a printer profile can correct.
_Avoid_: Printer error, misalignment

**Placement variation**:
The difference in observed placement among repeated prints made with the same printing setup.
_Avoid_: Random error, feed error

**Suitable printing setup**:
A printing setup whose placement variation permits the required alignment tolerance for a particular sheet layout.
_Avoid_: Supported printer, compatible printer

**Physical verification**:
Confirmation that a sheet layout describes measured label stock rather than relying only on published dimensions.
_Avoid_: Validated template, trusted layout
