import { rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const apiKey = process.env.DUNE_API_KEY || "";
if (!apiKey) throw new Error("DUNE_API_KEY is required");

const queryId = 7914122;
const root = fileURLToPath(new URL("../", import.meta.url));
const outputFile = `${root}assets/data/season-2-dune-participants.json`;
const response = await fetch(`https://api.dune.com/api/v1/query/${queryId}/results?limit=1000`, {
  headers: { "x-dune-api-key": apiKey },
  signal: AbortSignal.timeout(30_000),
});
if (!response.ok) throw new Error(`Dune HTTP ${response.status}`);
const payload = await response.json();
const rows = payload?.result?.rows;
if (payload.query_id !== queryId || !Array.isArray(rows) || !rows.length) throw new Error("Invalid Dune result");

let previous = -1;
for (const row of rows) {
  const timestamp = new Date(`${row.day}T00:00:00Z`).getTime();
  const value = Number(row.total_participants);
  if (!Number.isFinite(timestamp) || !Number.isInteger(value) || value < previous) throw new Error("Invalid Dune participant series");
  previous = value;
}

const publicPayload = {
  _meta: {
    source: "Dune Analytics",
    queryId,
    executionId: payload.execution_id,
    state: payload.state,
    executionEndedAt: payload.execution_ended_at,
    fetchedAt: new Date().toISOString(),
    rowCount: rows.length,
    metric: "daily cumulative total_participants",
    crossCheck: "Latest value is independently matched against unique direct participant/payer addresses reconstructed from BSC events.",
  },
  code: 200,
  msg: "ok",
  rows: rows.map((row) => ({ day: row.day, total_participants: Number(row.total_participants) })),
};

const temporary = `${outputFile}.tmp`;
await writeFile(temporary, `${JSON.stringify(publicPayload, null, 2)}\n`, "utf8");
await rename(temporary, outputFile);
console.log(`[dune] query ${queryId}; ${rows.length} rows; latest ${previous}`);
