import { createReadStream } from "node:fs";
import { execFile } from "node:child_process";
import { stat } from "node:fs/promises";
import { promisify } from "node:util";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { ChainClient } from "./chain-client.mjs";
import { config, projectRoot } from "./config.mjs";
import { createServiceWallet, PaymentClient } from "./payment-client.mjs";
import { readHistory } from "./history.mjs";
import { seedPersistentData } from "./seed-data.mjs";
import { buildSnapshot, readSnapshot, snapshotWithFreshness, writeSnapshot } from "./snapshot.mjs";

const MIME = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
});

const serviceWallet = createServiceWallet({
  privateKey: config.serviceWalletPrivateKey,
  allowEphemeral: config.allowEphemeralWallet
});
const payment = new PaymentClient({ baseUrl: config.paymentApiBase, wallet: serviceWallet.wallet });
const chain = new ChainClient(config.rpcUrls);
const execFileAsync = promisify(execFile);

const seededFiles = await seedPersistentData(config, projectRoot);
if (seededFiles.length) console.log(`[data] seeded ${seededFiles.length} persistent files`);

let snapshot = await readSnapshot(config.cacheFile);
let history = await readHistory(config.historyFile);
let refreshInFlight = null;
let chainSyncInFlight = null;
let lastError = "";
let lastChainError = "";

function securityHeaders(request) {
  const headers = {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "content-security-policy": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://payment.magne.ai; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.youtube-nocookie.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://payment.magne.ai https://api.dune.com https://jerrysohigh-create.github.io https://www.google-analytics.com https://region1.google-analytics.com https://*.bnbchain.org https://*.magne.ai; frame-src https://www.youtube-nocookie.com; media-src 'self' https:; upgrade-insecure-requests"
  };
  const forwardedProto = String(request.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  if (forwardedProto === "https") headers["strict-transport-security"] = "max-age=31536000; includeSubDomains";
  return headers;
}

async function refresh() {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const [dashboard, winners, stakingInfo, chainSnapshot] = await Promise.all([
        payment.getDashboard(),
        payment.getWinners(),
        payment.getStakingInfo(),
        chain.getSnapshot()
      ]);
      const next = buildSnapshot({
        dashboard,
        winners,
        stakingInfo,
        chain: chainSnapshot,
        authMode: serviceWallet.mode,
        staleAfterMs: config.staleAfterMs
      });
      await writeSnapshot(config.cacheFile, next);
      snapshot = next;
      lastError = "";
      console.log(`[collector] verified snapshot ${next._meta.fetchedAt}`);
      return next;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error(`[collector] refresh failed: ${lastError}`);
      return snapshot;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function syncChainHistory() {
  if (chainSyncInFlight) return chainSyncInFlight;
  chainSyncInFlight = (async () => {
    try {
      const scripts = [
        resolve(projectRoot, "scripts", "backfill-season-2-history.mjs"),
        resolve(projectRoot, "scripts", "materialize-season-2-history.mjs"),
        resolve(projectRoot, "scripts", "audit-season-2-usdt-flows.mjs"),
      ];
      for (const script of scripts) {
        const result = await execFileAsync(process.execPath, [script], {
          cwd: projectRoot,
          windowsHide: true,
          timeout: Math.max(120_000, config.chainSyncMs - 1_000),
          maxBuffer: 1024 * 1024,
        });
        if (result.stdout.trim()) console.log(result.stdout.trim());
      }
      history = await readHistory(config.historyFile);
      lastChainError = "";
      return history;
    } catch (error) {
      lastChainError = error instanceof Error ? error.message : String(error);
      console.error(`[chain-sync] failed: ${lastChainError}`);
      return history;
    } finally {
      chainSyncInFlight = null;
    }
  })();
  return chainSyncInFlight;
}

function sendJson(request, response, status, payload) {
  response.writeHead(status, {
    ...securityHeaders(request),
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(`${JSON.stringify(payload)}\n`);
}

async function sendStatic(request, response, pathname) {
  let relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  let file = resolve(projectRoot, relative);
  const rootPrefix = projectRoot.endsWith(sep) ? projectRoot : `${projectRoot}${sep}`;
  if (file !== projectRoot && !file.startsWith(rootPrefix)) {
    sendJson(request, response, 403, { code: 403, msg: "Forbidden" });
    return;
  }

  try {
    let fileStat = await stat(file);
    if (fileStat.isDirectory()) {
      file = resolve(file, "index.html");
      fileStat = await stat(file);
    }
    if (!fileStat.isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      ...securityHeaders(request),
      "content-type": MIME[extname(file).toLowerCase()] || "application/octet-stream",
      "cache-control": extname(file) === ".html" ? "no-cache" : "public, max-age=300"
    });
    if (request.method === "HEAD") return response.end();
    createReadStream(file).pipe(response);
  } catch {
    const notFoundFile = resolve(projectRoot, "404.html");
    try {
      await stat(notFoundFile);
      response.writeHead(404, {
        ...securityHeaders(request),
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-cache"
      });
      if (request.method === "HEAD") return response.end();
      createReadStream(notFoundFile).pipe(response);
    } catch {
      sendJson(request, response, 404, { code: 404, msg: "Not found" });
    }
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "GET" && url.pathname === "/api/v1/season-2/dashboard") {
    if (!snapshot) return sendJson(request, response, 503, { code: 503, msg: "Snapshot unavailable", data: null });
    return sendJson(request, response, 200, snapshotWithFreshness(snapshot, config.staleAfterMs));
  }

  if (request.method === "GET" && url.pathname === "/api/v1/season-2/health") {
    const current = snapshotWithFreshness(snapshot, config.staleAfterMs);
    return sendJson(request, response, snapshot ? 200 : 503, {
      code: snapshot ? 200 : 503,
      data: {
        status: current?._meta?.status || "unavailable",
        fetchedAt: current?._meta?.fetchedAt || null,
        ageSeconds: current?._meta?.ageSeconds ?? null,
        authMode: serviceWallet.mode,
        collectorReady: Boolean(serviceWallet.wallet),
        lastError: lastError || null,
        chainHistory: {
          lastCheckedAt: history?._meta?.lastCheckedAt || null,
          finalizedBlock: history?._meta?.chainBackfill?.toBlock || null,
          firstEventBlock: history?._meta?.chainBackfill?.firstEventBlock || null,
          eventCount: history?._meta?.chainBackfill?.eventCount || null,
          lastError: lastChainError || null
        }
      }
    });
  }

  if (request.method === "GET" && url.pathname === "/api/v1/season-2/history") {
    if (!history) return sendJson(request, response, 503, { code: 503, msg: "History unavailable", points: [] });
    return sendJson(request, response, 200, history);
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return sendJson(request, response, 405, { code: 405, msg: "Method not allowed" });
  }

  return sendStatic(request, response, decodeURIComponent(url.pathname));
});

server.listen(config.port, config.host, () => {
  console.log(`[w3] http://${config.host}:${config.port}/`);
  console.log(`[collector] auth mode: ${serviceWallet.mode}`);
  void refresh();
  void syncChainHistory();
});

const timer = setInterval(() => void refresh(), config.refreshMs);
timer.unref();
const chainTimer = setInterval(() => void syncChainHistory(), config.chainSyncMs);
chainTimer.unref();

function shutdown() {
  clearInterval(timer);
  clearInterval(chainTimer);
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
