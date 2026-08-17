/**
 * Store names and the request helper, separated from the connection itself.
 *
 * These are the only parts of the database module the migration needs, and the
 * migration is in turn needed by the connection. Keeping them here is what lets
 * both sides import what they need without an import cycle.
 */

export const PROJECTS_STORE = "projects";
export const PROJECT_DRAFTS_STORE = "projectDrafts";
export const SHEET_LAYOUTS_STORE = "sheetLayouts";
export const SHEET_LAYOUT_REVISIONS_STORE = "sheetLayoutRevisions";

export function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          `IndexedDB request failed: ${request.error?.message ?? "unknown error"}`,
        ),
      );
  });
}
