# Label Printing

This context describes placing user-controlled content onto physical adhesive labels using ordinary consumer printing workflows.

## Language

**Label sheet**:
A physical sheet of adhesive labels intended to pass through a printer as one unit.
_Avoid_: Sticker paper, label paper

**Sheet layout**:
The physical geometry of a label sheet, including its sheet dimensions and the position and size of every label.
_Avoid_: Grid format, template

**Label boundary**:
The physical die-cut perimeter of one label, represented initially as an axis-aligned rounded rectangle whose corner radius may be known or explicitly unknown.
_Avoid_: Label box, cell

**Sheet layout revision**:
An immutable version of a sheet layout. Any change to sheet dimensions, rows, columns, gaps, margins, or resulting label positions creates a new revision.
_Avoid_: Edited layout, layout version

**Printer profile**:
Calibration data that accounts for repeatable placement differences introduced by a particular printing setup.
_Avoid_: Printer settings, printer model

**Printing setup**:
The real-world combination of printer, operating system, driver, browser, print settings, and media-feed conditions for which calibration is valid.
_Avoid_: Printer, printer model

**Setup attestation**:
An operator's confirmation that the real-world printing setup still matches the one represented by a printer profile when some identifying details are unknown or cannot be inspected automatically.
_Avoid_: Setup detection, automatic matching

**Alignment tolerance**:
The maximum acceptable difference between the intended and observed placement of content on a physical label.
_Avoid_: Perfect alignment, exact printing

**Label content**:
User-controlled material intended to appear on one physical label.
_Avoid_: Design, artwork

**Label content template**:
A reusable composition of label content that can produce multiple labels from different data and optional per-label overrides.
_Avoid_: React component, label design

**Label project**:
A saved body of work that combines label content, a sheet-layout revision, content settings, and assignments to label positions for a particular labeling purpose.
_Avoid_: Document, workspace

**Content inset**:
A user-selected distance inside the safe area that keeps label content farther from the label boundary for composition, appearance, or rounded-corner clearance. It is independent of and additive to the alignment tolerance.
_Avoid_: Label margin, padding

**Safe area**:
The region inside a label boundary within which label content must remain after accounting for the alignment tolerance.
_Avoid_: Margin, padding

**Printable output**:
A representation of label content positioned at intended physical locations on a label sheet and ready for a user to send through their printing setup.
_Avoid_: Print job, document

**Print preparation**:
A record of how printable output was generated, including its project state, selected positions, compatibility result, assumptions, overrides, and diagnostics. It does not assert that physical printing occurred.
_Avoid_: Print history, print job

**Sheet layout catalog**:
A collection of predefined sheet layouts identified by the label products they describe.
_Avoid_: Template library, label database

**Label content package**:
Label content bundled with the styles and assets needed to reproduce its intended appearance independently of the surrounding application.
_Avoid_: Live DOM, HTML snippet

**Calibration sheet**:
Printable output containing measurement marks used to observe placement differences for a printing setup.
_Avoid_: Test page, alignment page

**Calibration observation**:
An operator-recorded physical measurement or loading observation gathered while calibrating a printing setup.
_Avoid_: Calibration data, test value

**Used position**:
A label position on a label sheet whose adhesive label has already been removed or made unavailable for later printing.
_Avoid_: Empty label, skipped cell

**Partially used sheet**:
A label sheet containing one or more used positions.
_Avoid_: Used sheet, partial sheet

**Sheet instance**:
A saved representation of one identifiable physical label sheet and its used positions. It does not establish that the physical sheet is safe to refeed.
_Avoid_: Saved sheet, sheet state

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

**Profile compatibility**:
The condition in which a printer profile's recorded sheet layout revision, printing setup, loading procedure, and print configuration match a proposed print.
_Avoid_: Matching profile, valid profile
