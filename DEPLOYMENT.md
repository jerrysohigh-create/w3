# W3 authenticated data service

The Node service serves the static W3 site and a sanitized Season 2 API from the same origin.

## Local verification

```powershell
$env:W3_ALLOW_EPHEMERAL_WALLET='true'
$env:PORT='4184'
pnpm start
```

Open `http://127.0.0.1:4184/season-2.html`.

The development wallet exists only in memory and has no assets. Restarting the process creates a new address.

## Production

1. Create a dedicated zero-asset wallet with no contract approvals.
2. Store its private key in the server secret manager.
3. Inject it as `W3_SERVICE_WALLET_PRIVATE_KEY` at runtime.
4. Keep `W3_ALLOW_EPHEMERAL_WALLET=false`.
5. Run `pnpm start` behind the W3 reverse proxy.
6. Route `w3.magne.ai` to this service so HTML and `/api/v1/season-2/dashboard` remain same-origin.
7. Mount a persistent volume and set `W3_DATA_DIR` to that absolute path. This preserves snapshots, chain history and flow audits across restarts and deployments.
8. Keep `HOST=127.0.0.1` behind a same-host reverse proxy; use `HOST=0.0.0.0` only when the container platform requires an exposed bind address.

Do not deploy the W3 frontend as static files alone if Season 2 is labelled live. Static hosting can only display the last verified fallback snapshot and must be presented as `SNAPSHOT` or `STALE`.

Never place the private key, Payment token, challenge signature or session data in Git, frontend JavaScript, logs or public JSON.

## Endpoints

- `GET /api/v1/season-2/dashboard` — sanitized public snapshot.
- `GET /api/v1/season-2/health` — freshness and collector state without credentials.
