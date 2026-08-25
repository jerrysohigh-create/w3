const DEFAULT_STREAM_URL = "https://portal.sqd.dev/datasets/binance-mainnet/finalized-stream";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseNdjson(value) {
  return String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function retryDelay(response, attempt) {
  const retryAfter = Number(response?.headers?.get?.("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000;
  return Math.min(15_000, 750 * (2 ** attempt));
}

export class PortalClient {
  constructor({ streamUrl = DEFAULT_STREAM_URL, fetchImpl = fetch } = {}) {
    this.streamUrl = streamUrl.replace(/\/$/, "");
    this.headUrl = this.streamUrl.replace(/\/finalized-stream$/, "/finalized-head");
    this.fetch = fetchImpl;
  }

  async request(url, options = {}, attempts = 4) {
    let lastError;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await this.fetch(url, {
          ...options,
          signal: options.signal || AbortSignal.timeout(60_000),
        });
        if (!response.ok) {
          const error = new Error(`SQD Portal HTTP ${response.status}`);
          if (response.status !== 429 && response.status < 500) throw error;
          lastError = error;
          if (attempt + 1 < attempts) await wait(retryDelay(response, attempt));
          continue;
        }
        return response;
      } catch (error) {
        lastError = error;
        if (attempt + 1 < attempts) await wait(Math.min(8_000, 500 * (2 ** attempt)));
      }
    }
    throw lastError || new Error("SQD Portal request failed");
  }

  async getFinalizedHead() {
    const response = await this.request(this.headUrl, { headers: { accept: "application/json" } });
    const payload = await response.json();
    const value = Number(payload?.number ?? payload?.height ?? payload);
    if (!Number.isSafeInteger(value) || value < 0) throw new Error("SQD Portal returned an invalid finalized head");
    return value;
  }

  async queryLogs({ fromBlock, toBlock, address, topic0, onProgress }) {
    const logs = [];
    let cursor = fromBlock;
    let page = 0;
    while (cursor <= toBlock) {
      const response = await this.request(this.streamUrl, {
        method: "POST",
        headers: {
          accept: "application/x-ndjson",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          type: "evm",
          fromBlock: cursor,
          toBlock,
          fields: {
            block: { number: true, timestamp: true },
            log: {
              address: true,
              topics: true,
              data: true,
              transactionHash: true,
              logIndex: true,
            },
          },
          logs: [{ address: [address], topic0: [topic0] }],
        }),
      });
      const blocks = parseNdjson(await response.text());
      if (!blocks.length) throw new Error(`SQD Portal returned no progress from block ${cursor}`);

      let lastBlock = cursor - 1;
      for (const block of blocks) {
        const header = block?.header || block?.block || {};
        const blockNumber = Number(header.number);
        if (!Number.isSafeInteger(blockNumber)) continue;
        lastBlock = Math.max(lastBlock, blockNumber);
        for (const log of block.logs || []) {
          logs.push({ ...log, blockNumber, timestamp: Number(header.timestamp) });
        }
      }
      if (lastBlock < cursor) throw new Error(`SQD Portal did not advance beyond block ${cursor}`);
      cursor = lastBlock + 1;
      page += 1;
      onProgress?.({ page, scannedTo: lastBlock, toBlock, logCount: logs.length });
    }
    return logs;
  }
}

export { DEFAULT_STREAM_URL };
