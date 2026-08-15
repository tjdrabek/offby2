/**
 * Turns an unknown thrown value into a message that can be shown to a person.
 * Host-layer failures (registration, activation, durable writes) must always
 * produce something actionable rather than "[object Object]".
 */
export function describeError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}
