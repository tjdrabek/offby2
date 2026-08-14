# Define standalone application persistence

Type: grilling
Status: resolved

## Question

Which application records must survive browser sessions, where are they stored, and how can a user back up, restore, migrate, and delete them without requiring an account or server?

## Answer

The standalone web application is local-first and requires no account or server. It stores versioned records in IndexedDB for sheet layouts and product metadata, printing setups and environment metadata, loading procedures, print configurations, calibration observations and workflow drafts, printer profiles, label content and referenced assets, and relevant user preferences.

The first production release provides complete versioned export, import, and explicit deletion. Import reports migration or incompatibility failures instead of silently dropping records. Printing and recovery do not depend on network access. Optional account synchronization is deferred, as is any generic storage abstraction for a future package.

## Comments

- Reopened after the product strategy changed from package-first to standalone-app-first. Serializable domain values remain accepted, but production application storage, portability, backup, privacy, and recovery now need a concrete decision. A replaceable package storage adapter is deferred unless later extraction establishes that requirement.
- The production application is web-based and must remember printing-setup details, environment metadata, sheet-layout brands and configurations, printer profiles, label content, and relevant user preferences across sessions.
- Resolved as local-first IndexedDB storage with no required account, plus complete export, import, migration reporting, and deletion in the first production release.
