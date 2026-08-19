/**
 * Composes a refusal or validation message from its parts.
 *
 * Every place the sheet-layout entry says no with prose carries the same two
 * parts: an explanation of what happened and why, and a (possibly empty) list
 * of remedies, each naming the action it asks for alongside the prose
 * fragment for that action. A host that wants one line calls
 * composeRefusalMessage over the whole list; a host that can't honour every
 * remedy (for example, one that derives a value instead of asking for it)
 * filters the remedies list by action code and composes what's left. Either
 * way, the sentence is assembled here, once — no caller hand-builds prose by
 * concatenating or regex-stripping another module's text.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

/**
 * What a remedy asks the reader to do. New codes are added as new kinds of
 * correction appear; a host that doesn't recognize one can still show its
 * text, just not filter on it specifically.
 */
export type RemedyActionCode =
  | "enter-value"
  | "check-other-axis-values"
  | "change-unit";

export interface RefusalRemedy {
  action: RemedyActionCode;
  /** How this remedy reads when it is the only one being composed: a full sentence, capitalized, ending in a period. */
  text: string;
}

export interface RefusalMessage {
  /** What happened and why. Empty when a remedy is the whole message. */
  explanation: string;
  /** Empty when the explanation stands with nothing left to correct. */
  remedies: readonly RefusalRemedy[];
}

/** The remedy named by every plain "the value is missing" issue. */
export const ENTER_VALUE_REMEDY: RefusalRemedy = {
  action: "enter-value",
  text: "Enter a value.",
};

function lowerFirst(text: string): string {
  return text.length === 0
    ? text
    : text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * Joins remedy sentences into a single clause: "Check the other values." and
 * "Enter this one." become "Check the other values, or enter this one." —
 * each remedy still reads correctly on its own if a host drops the rest.
 */
export function composeRemedies(remedies: readonly RefusalRemedy[]): string {
  return remedies.reduce((joined, remedy, index) => {
    if (index === 0) {
      return remedy.text;
    }
    const withoutPeriod = joined.endsWith(".") ? joined.slice(0, -1) : joined;
    return `${withoutPeriod}, or ${lowerFirst(remedy.text)}`;
  }, "");
}

/** The full sentence a host shows when it isn't filtering remedies. */
export function composeRefusalMessage(parts: RefusalMessage): string {
  return [parts.explanation, composeRemedies(parts.remedies)]
    .filter((part) => part.length > 0)
    .join(" ");
}
