# Demo data overlay

Route Handlers in this app are **stateless and seed-backed**. They read `lib/mock/*.json`, validate writes with zod, and return the resulting entity. They do not persist anything.

`localStorage` exists only in the browser, so persistence lives here:

1. `lib/services/*` call the API.
2. The service writes the returned entity into `localStorage` through this module.
3. Reads merge **seed + overlay by id**. The overlay wins. `tombstones` hide deleted ids.

Keys are namespaced and versioned: `noahfi:v1:<collection>`. A `schemaVersion` flag (`noahfi:v1:schemaVersion`) resets stale keys when the shape changes.

`resetDemoData()` clears the overlay and returns the demo to seed data. `exportDemoData()` downloads the overlay as JSON. React callers should read through `useSyncExternalStore` (`subscribe` / `getStoreVersion`) so server and client markup stay aligned.

When a real backend replaces the mock, change this module and the Route Handler internals. Pages and components keep calling `lib/services/*`.
