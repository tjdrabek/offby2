# Use serializable label content instead of user code

Represent label content as versioned serializable component trees configured through the application and rendered by application-owned React components, rather than executing arbitrary user-authored React or JavaScript. This preserves deterministic preview, printing, persistence, migration, and backup while accepting that custom executable components and a public plugin system are deferred.
