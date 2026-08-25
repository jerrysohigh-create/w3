# W3 authenticated data service

The Node service serves the static W3 site and the sanitized Season 2 API from the same origin. Production should run the Node service behind Nginx; GitHub Pages remains a snapshot fallback.

## Local verification

```powershell
$env:W3_ALLOW_EPHEMERAL_WALLET='true'
$env:PORT='4184'
pnpm start
```

Open `http://127.0.0.1:4184/season-2.html`.

The development wallet exists only in memory and has no assets. Restarting the process creates a new address.

## Production architecture

```text
Browser -> Cloudflare / DNS -> Nginx :443 -> W3 Node :4184
                                           |-> static W3 pages
                                           |-> /api/v1/season-2/*
                                           |-> Payment API challenge login
                                           `-> persistent data directory
```

Requirements:

- Linux server with Node.js 20 and pnpm 10.
- Nginx or an equivalent reverse proxy.
- A dedicated zero-asset EVM service wallet with no contract approvals.
- A persistent directory mounted at `/var/lib/w3` or another absolute path.
- The `w3.magne.ai` virtual host must point to this service, not the legacy DD site.

## Initial server setup

Clone the production branch and install dependencies:

```bash
sudo useradd --system --home /opt/w3 --shell /usr/sbin/nologin w3 2>/dev/null || true
sudo install -d -o w3 -g w3 /opt/w3 /var/lib/w3
sudo install -d -m 700 /etc/w3
sudo git clone --branch main --single-branch https://github.com/jerrysohigh-create/w3.git /opt/w3
sudo chown -R w3:w3 /opt/w3 /var/lib/w3
cd /opt/w3
sudo corepack enable
sudo -u w3 pnpm install --frozen-lockfile
sudo -u w3 pnpm check
sudo -u w3 pnpm test
```

If `/opt/w3` already contains the checkout, use `git pull --ff-only origin main` instead of cloning again.

## Secrets and environment

Copy `deploy/w3.env.example` to `/etc/w3/w3.env`, set file mode `600`, and inject the dedicated service-wallet private key through the server secret manager or protected environment file.

```bash
sudo install -m 600 deploy/w3.env.example /etc/w3/w3.env
sudo editor /etc/w3/w3.env
```

Production requirements:

- Set `W3_SERVICE_WALLET_PRIVATE_KEY` to the dedicated zero-asset wallet private key.
- Keep `W3_ALLOW_EPHEMERAL_WALLET=false`.
- Never expose the key in frontend JavaScript, logs, public JSON, screenshots, tickets or Git.
- Never fund this wallet or approve contracts from it. It is only a Payment API challenge signer.
- Keep `S2_HISTORY_USE_PORTAL=true` so BSC history can catch up from the finalized stream without using the service wallet.
- Keep `W3_CHAIN_SYNC_SECONDS=300` and mount `W3_DATA_DIR=/var/lib/w3` on persistent storage.

## Automatic Season 2 sync

The service runs both collectors immediately after every start:

- Payment API snapshot refresh every `W3_REFRESH_SECONDS` (default 60 seconds).
- BSC participation-history sync every `W3_CHAIN_SYNC_SECONDS` (default 300 seconds).

The BSC collector uses the public SQD finalized stream as its primary source and the configured JSON-RPC endpoints as fallback. It merges participation events by transaction hash and derives the unique payer count from the union of participant addresses. It never treats the verified historical baseline as zero and never replaces a larger persisted history with a partial rescan.

The repository evidence is only the deployment seed. Runtime updates are written to `W3_DATA_DIR`; therefore `/var/lib/w3` must survive service restarts and application upgrades.

## systemd

Install the provided unit after confirming the Node path with `command -v node`:

```bash
sudo install -m 644 deploy/w3.service.example /etc/systemd/system/w3.service
sudo systemctl daemon-reload
sudo systemctl enable --now w3
sudo systemctl status w3 --no-pager
```

Logs:

```bash
sudo journalctl -u w3 -f
```

## Nginx

Install the example virtual host, replace the existing `w3.magne.ai` DD mapping, and let the existing TLS or Cloudflare configuration terminate HTTPS.

```bash
sudo install -m 644 deploy/nginx-w3.conf.example /etc/nginx/sites-available/w3.conf
sudo ln -sfn /etc/nginx/sites-available/w3.conf /etc/nginx/sites-enabled/w3.conf
sudo nginx -t
sudo systemctl reload nginx
```

Do not configure `try_files ... /index.html` in front of the service. API and JSON paths must reach Node and must not fall back to an HTML page.

## Endpoints

- `GET /api/v1/season-2/dashboard` — sanitized public snapshot.
- `GET /api/v1/season-2/health` — freshness and collector state without credentials.
- `GET /api/v1/season-2/history` — sanitized cumulative history.

## Production acceptance

```bash
curl -fsS https://w3.magne.ai/api/v1/season-2/health | jq .
curl -fsSI https://w3.magne.ai/season-2.html
curl -fsSI https://w3.magne.ai/assets/data/season-2-snapshot.json
```

The health response must report:

- `status: "verified"` while the observation is fresh
- `authMode: "secret"`
- `collectorReady: true`
- `lastError: null`
- `chainHistory.caughtUp: true`
- `chainHistory.remainingBlocks: 0`
- `chainHistory.lastError: null`

The W3 interface translates a fresh same-origin collector response into the public `S2: LIVE` state.

The root page must be W3.MAGNE.AI, not `MAGNE.AI Due Diligence Data Room`. HTML pages must return `text/html`; JSON and API paths must return `application/json`.

## Updating the server

```bash
cd /opt/w3
sudo -u w3 git pull --ff-only origin main
sudo -u w3 pnpm install --frozen-lockfile
sudo -u w3 pnpm check
sudo -u w3 pnpm test
sudo systemctl restart w3
```

GitHub Pages may continue to publish the latest verified static snapshot as a fallback, but `w3.magne.ai` should resolve to the Node service when the public status is labelled `LIVE`.
