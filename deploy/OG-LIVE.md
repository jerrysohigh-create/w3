# OG conversion refresh

Deploy code and restart Node. Preserve the existing secret environment, service
wallet and W3_DATA_DIR, including all Season 2 and OG runtime files. Never copy
example environment files over production settings or remove persistent data.

GET /api/v1/public-sale-og/conversions returns the deduplicated Converted-event
wallet count, denominator 1,085, computed percentage, scanned block and timestamp.
It excludes the private address set. This does not use Payment wallet login.

The collector and visible page refresh every 15 seconds. A fresh installation
rebuilds its complete address set once; the dated public seed stays visible while
this completes. Existing complete state resumes from lastScannedBlock + 1.
Failures retain the last successful state. Frontend fallback is marked delayed.

Seed verified on 2026-09-24: 850 / 1,085 = 78.34%, through block 123693890.
The denominator is the user-confirmed OG wallet baseline, not a count of people.
Check HTTP 200, increasing scanned block and recent fetchedAt after startup.
An HTTP 404 indicates missing backend code/restart or incorrect proxy routing.
Allow outbound HTTPS to portal.sqd.dev and configured BSC RPC endpoints.
