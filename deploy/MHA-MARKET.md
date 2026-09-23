# CoinGecko market quotes

Restart the Node service after deploying the market module. The frontend calls
`GET /api/v1/mha/market`; the server requests CoinGecko's `magic-hash` quote
with a 60-second shared cache and an 8-second timeout. Requests are deduplicated.

Set `COINGECKO_DEMO_API_KEY` in the existing server secret environment when
using CoinGecko Demo API authentication. Never put the key in browser code.
The host needs outbound HTTPS access to api.coingecko.com.

Quotes older than five minutes are marked stale. If no valid quote exists,
the endpoint returns 503 and the page offers a direct CoinGecko link.
Prices, volume and changes are separate from the official BSC supply collector.
This module does not write to Season 2 data, OG data, or the supply snapshot.

Verify with: `curl -fsS http://127.0.0.1:4184/api/v1/mha/market`
Adjust the port to the deployed service. Confirm source timestamp and status.

## Exchange markets

`GET /api/v1/mha/markets` supplies CoinGecko ticker data with a shared
60-second cache. The visible page polls every 60 seconds and on returning to
the foreground. Source timestamps are displayed; this is not tick-by-tick data.
Anomalous/stale pairs are filtered; the list covers at most the first 100 pairs.
Failures preserve the last successful response and mark it stale.

Deploy code only: preserve the existing secret environment, service wallet,
W3_DATA_DIR and every existing Season 2 / OG runtime file. Do not replace the
server environment with an example file or delete its persistent directory.
Restart Node for the new routes. GitHub Pages alone cannot serve these APIs.
The local Windows proxy is a preview-only setting, not a production requirement.
