import { createReadStream } from "node:fs";
import { execFile } from "node:child_process";
import { stat } from "node:fs/promises";
import { promisify } from "node:util";
import { createServer } from "node:http";
import { readMhaMarket } from "./mha-market.mjs";
import { readMhaTickers } from "./mha-tickers.mjs";
import { extname, resolve, sep } from "node:path";
import { ChainClient } from "./chain-client.mjs";
import { config, projectRoot } from "./config.mjs";
import { createServiceWallet, PaymentClient } from "./payment-client.mjs";
import { readHistory } from "./history.mjs";
import { collectMhaSupply, mhaSupplyWithFreshness, readMhaSupply, writeMhaSupply } from "./mha-supply.mjs";
import { OgConversionCollector, publicOgConversions, readOgConversions } from "./og-conversions.mjs";
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
const ogCollector = new OgConversionCollector({
  file: config.ogConversionsFile,
  chain,
  confirmations: config.ogConfirmations,
  streamUrl: config.ogPortalUrl
});
const execFileAsync = promisify(execFile);

const seededFiles = await seedPersistentData(config, projectRoot);
if (seededFiles.length) console.log(`[data] seeded ${seededFiles.length} persistent files`);

let snapshot = await readSnapshot(config.cacheFile);
let history = await readHistory(config.historyFile);
let ogConversions = await readOgConversions(config.ogConversionsFile);
let mhaSupply = await readMhaSupply(config.mhaSupplyFile);
let refreshInFlight = null;
let chainSyncInFlight = null;
let lastError = "";
let lastChainError = "";
let ogSyncInFlight = null;
let lastOgError = "";
let mhaSupplySyncInFlight = null;
let lastMhaSupplyError = "";

async function syncMhaSupply() {
  if (mhaSupplySyncInFlight) return mhaSupplySyncInFlight;
  mhaSupplySyncInFlight = (async () => {
    try {
      const next = await collectMhaSupply({ chain, platformReady: config.mhaPlatformReady });
      await writeMhaSupply(config.mhaSupplyFile, next);
      mhaSupply = next;
      lastMhaSupplyError = "";
      console.log(`[mha-supply] block ${next._meta.blockNumber}; released ${next.data.metrics.releasedFromPrimaryWallets} MHA`);
      return next;
    } catch (error) {
      lastMhaSupplyError = error instanceof Error ? error.message : String(error);
      console.error(`[mha-supply] failed: ${lastMhaSupplyError}`);
      return mhaSupply;
    } finally {
      mhaSupplySyncInFlight = null;
    }
  })();
  return mhaSupplySyncInFlight;
}

async function syncOgConversions() {
  if (ogSyncInFlight) return ogSyncInFlight;
  ogSyncInFlight = (async () => {
    try {
      ogConversions = await ogCollector.sync();
      lastOgError = "";
      console.log(`[og-sync] ${ogConversions.data.convertedWallets} converted wallets through block ${ogConversions._meta.lastScannedBlock}`);
      return ogConversions;
    } catch (error) {
      lastOgError = error instanceof Error ? error.message : String(error);
      console.error(`[og-sync] failed: ${lastOgError}`);
      return ogConversions;
    } finally {
      ogSyncInFlight = null;
    }
  })();
  return ogSyncInFlight;
}

function securityHeaders(request) {
  const headers = {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "content-security-policy": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://payment.magne.ai; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.youtube-nocookie.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://payment.magne.ai https://api.dune.com https://jerrysohigh-create.github.io https://www.google-analytics.com https://region1.google-analytics.com https://*.bnbchain.org https://*.magne.ai; frame-src https://www.youtube-nocookie.com https://dexscreener.com; media-src 'self' https:; upgrade-insecure-requests"
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
          env: {
            ...process.env,
            // Scheduled collection must always extend the last verified BSC
            // baseline. A full rebuild is a manual maintenance operation.
            S2_HISTORY_FULL: "false",
          },
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
    "cache-control": "no-store",
    "access-control-allow-origin": "*"
  });
  response.end(`${JSON.stringify(payload)}\n`);
}

function sendText(request, response, status, payload) {
  response.writeHead(status, {
    ...securityHeaders(request),
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*"
  });
  response.end(`${payload}\n`);
}

async function sendStatic(request, response, pathname) {
  let relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  let file = resolve(projectRoot, relative);
  if (file === resolve(config.ogConversionsFile)) {
    return sendJson(request, response, 403, { code: 403, msg: "Private collector state" });
  }
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
          scanToBlock: history?._meta?.chainBackfill?.toBlock || null,
          chainHead: history?._meta?.chainBackfill?.chainHead || null,
          caughtUp: history?._meta?.chainBackfill?.caughtUp ?? null,
          remainingBlocks: history?._meta?.chainBackfill?.remainingBlocks ?? null,
          firstEventBlock: history?._meta?.chainBackfill?.firstEventBlock || null,
          eventCount: history?._meta?.chainBackfill?.eventCount || null,
          uniqueDirectPayers: history?._meta?.chainBackfill?.uniqueDirectPayers || null,
          totalEntries: history?._meta?.chainBackfill?.totalEntries || null,
          lastError: lastChainError || null
        }
      }
    });
  }

  if (request.method === "GET" && url.pathname === "/api/v1/season-2/history") {
    if (!history) return sendJson(request, response, 503, { code: 503, msg: "History unavailable", points: [] });
    return sendJson(request, response, 200, history);
  }

  if (request.method === "GET" && url.pathname === "/api/v1/public-sale-og/conversions") {
    if (!ogConversions) return sendJson(request, response, 503, { code: 503, msg: "OG conversion snapshot unavailable", data: null });
    return sendJson(request, response, 200, {
      ...publicOgConversions(ogConversions),
      _meta: {
        ...publicOgConversions(ogConversions)._meta,
        lastError: lastOgError || null
      }
    });
  }

  if (request.method === "GET" && url.pathname === "/api/v1/mha/market") {
    const market = await readMhaMarket();
    return sendJson(request, response, market.data ? 200 : 503, market);
  }

  if (request.method === "GET" && url.pathname === "/api/v1/mha/markets") {
    const markets = await readMhaTickers();
    return sendJson(request, response, markets.data ? 200 : 503, markets);
  }

  if (request.method === "GET" && url.pathname === "/api/v1/mha/supply") {
    if (!mhaSupply) return sendJson(request, response, 503, { code: 503, msg: "MHA supply snapshot unavailable", data: null });
    const current = mhaSupplyWithFreshness(mhaSupply, config.mhaSupplySyncMs * 2);
    current._meta.lastError = lastMhaSupplyError || null;
    return sendJson(request, response, 200, current);
  }

  if (request.method === "GET" && url.pathname === "/api/v1/mha/supply/health") {
    const current = mhaSupplyWithFreshness(mhaSupply, config.mhaSupplySyncMs * 2);
    return sendJson(request, response, mhaSupply ? 200 : 503, {
      code: mhaSupply ? 200 : 503,
      data: {
        status: current?._meta?.status || "unavailable",
        platformReady: current?.data?.metrics?.platformReady || false,
        fetchedAt: current?._meta?.fetchedAt || null,
        blockNumber: current?._meta?.blockNumber || null,
        ageSeconds: current?._meta?.ageSeconds ?? null,
        lastError: lastMhaSupplyError || null
      }
    });
  }

  if (request.method === "GET" && url.pathname === "/api/v1/mha/supply/total") {
    const value = mhaSupply?.data?.metrics?.totalSupply;
    return value ? sendText(request, response, 200, value) : sendText(request, response, 503, "unavailable");
  }

  if (request.method === "GET" && url.pathname === "/api/v1/mha/supply/circulating") {
    const value = mhaSupply?.data?.metrics?.circulatingSupply;
    return value ? sendText(request, response, 200, value) : sendText(request, response, 503, "unavailable");
  }

  if (request.method === "GET" && url.pathname === "/api/v1/mha/supply/coingecko") {
    const metrics = mhaSupply?.data?.metrics;
    if (!metrics?.circulatingSupply) {
      return sendJson(request, response, 503, {
        status: "pending-classification",
        message: "Official circulating supply is withheld until wallet classifications are approved."
      });
    }
    return sendJson(request, response, 200, {
      circulating_supply: Number(metrics.circulatingSupply),
      total_supply: Number(metrics.totalSupply),
      max_supply: Number(metrics.maxSupply),
      updated_at: mhaSupply._meta.fetchedAt,
      block_number: mhaSupply._meta.blockNumber
    });
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
  void syncOgConversions();
  void syncMhaSupply();
});

const timer = setInterval(() => void refresh(), config.refreshMs);
timer.unref();
const chainTimer = setInterval(() => void syncChainHistory(), config.chainSyncMs);
chainTimer.unref();
const ogTimer = setInterval(() => void syncOgConversions(), config.ogSyncMs);
ogTimer.unref();
const mhaSupplyTimer = setInterval(() => void syncMhaSupply(), config.mhaSupplySyncMs);
mhaSupplyTimer.unref();

function shutdown() {
  clearInterval(timer);
  clearInterval(chainTimer);
  clearInterval(ogTimer);
  clearInterval(mhaSupplyTimer);
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
