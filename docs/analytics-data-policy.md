# Analytics MVP data policy

Adwa Lens collects only anonymous, aggregate-ready journey events: event name, time, rotating local session ID, optional exhibit ID, persona, coarse duration, stop index, and normalized service category. It never collects names, email addresses, recovery links/tokens, IP addresses, device identifiers, audio, transcripts, camera frames, image metadata, or free-form questions.

The hackathon MVP stores at most 10,000 events in the configured file-backed store. Delete the configured analytics file to clear all local analytics data. Production deployment requires a managed datastore, a documented retention window, and staff access controls. The dashboard is disabled unless `ANALYTICS_DASHBOARD_ENABLED=true`; an optional dashboard password is checked server-side.