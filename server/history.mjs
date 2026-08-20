import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const FIELDS = ["totalEntries", "totalMobile", "currRound", "nextDrawNeed"];

function finite(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`Invalid history ${field}`);
  return number;
}

export function historyPoint(snapshot) {
  if (!snapshot?._meta?.fetchedAt || !snapshot?.data) throw new Error("Snapshot cannot produce history point");
  const point = { observedAt: new Date(snapshot._meta.fetchedAt).toISOString() };
  for (const field of FIELDS) point[field] = finite(snapshot.data[field], field);
  return point;
}

function sameMetrics(left, right) {
  return Boolean(left && right) && FIELDS.every((field) => Number(left[field]) === Number(right[field]));
}

export function updateHistory(existing, snapshot, options = {}) {
  const point = historyPoint(snapshot);
  const maxPoints = Number.isInteger(options.maxPoints) && options.maxPoints > 1 ? options.maxPoints : 20000;
  const previousPoints = Array.isArray(existing?.points) ? existing.points : [];
  const points = previousPoints.slice();
  const last = points[points.length - 1];
  if (!sameMetrics(last, point)) points.push(point);
  if (points.length > maxPoints) points.splice(0, points.length - maxPoints);

  return {
    _meta: {
      ...existing?._meta,
      source: existing?._meta?.source || "W3 authenticated collector",
      grain: existing?._meta?.grain || "change-only verified observations",
      startedAt: existing?._meta?.startedAt || points[0]?.observedAt || point.observedAt,
      updatedAt: points[points.length - 1]?.observedAt || point.observedAt,
      lastCheckedAt: point.observedAt,
      refreshSeconds: 60,
      pointCount: points.length,
    },
    code: 200,
    msg: "ok",
    points,
  };
}

export async function writeHistory(file, history) {
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  await writeFile(temporary, `${JSON.stringify(history, null, 2)}\n`, "utf8");
  await rename(temporary, file);
}

export async function readHistory(file) {
  try {
    const payload = JSON.parse(await readFile(file, "utf8"));
    return payload && Array.isArray(payload.points) ? payload : null;
  } catch {
    return null;
  }
}
