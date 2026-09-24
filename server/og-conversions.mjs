import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { formatUnits } from "ethers";
import { DEFAULT_STREAM_URL, PortalClient } from "./portal-client.mjs";

export const OG_CONVERSION_CONTRACT = "0x6bAa796a82dB3aBE94cb202c0A6796F0d046a4bC";
export const OG_CONVERTED_TOPIC = "0x80aaefaf59d70d6ed6ecae25018f99e73b43f7dc60af403d422b060c6c1df02c";
export const OG_CONVERSION_START_BLOCK = 120488000;

function addressFromTopic(topic) {
  return `0x${String(topic || "").slice(-40)}`.toLowerCase();
}

function validCount(value, fallback = 0) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : fallback;
}

export async function readOgConversions(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

export async function writeOgConversions(file, payload) {
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  await writeFile(temporary, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await rename(temporary, file);
}

export function publicOgConversions(payload) {
  if (!payload) return null;
  const { _state, ...safe } = payload;
  return safe;
}

export function mergeConvertedUsers(payload, logs, { finalizedBlock, chainHead, confirmations, totalAllocatedMs2, fetchedAt = new Date().toISOString() }) {
  const previousCount = validCount(payload?.data?.convertedWallets);
  const participatingWallets = validCount(payload?.data?.participatingWallets, 1085);
  const knownUsers = new Set(
    Array.isArray(payload?._state?.seenUsers)
      ? payload._state.seenUsers.map((value) => String(value).toLowerCase())
      : Array.isArray(payload?._state?.incrementalUsers)
        ? payload._state.incrementalUsers.map((value) => String(value).toLowerCase())
        : []
  );
  const newUsers = new Set();
  for (const log of logs || []) {
    const user = addressFromTopic(log?.topics?.[1]);
    if (user.length !== 42 || knownUsers.has(user)) continue;
    knownUsers.add(user);
    newUsers.add(user);
  }
  const convertedWallets = previousCount + newUsers.size;
  const previousEvents = validCount(payload?.data?.convertedEvents, previousCount);
  const baselineBlock = validCount(payload?._meta?.baselineBlock, validCount(payload?._meta?.lastScannedBlock));
  const baselineCount = validCount(payload?._meta?.baselineConvertedWallets, previousCount);
  return {
    code: 200,
    msg: "OK",
    data: {
      participatingWallets,
      convertedWallets,
      conversionRate: participatingWallets ? convertedWallets / participatingWallets * 100 : null,
      convertedEvents: previousEvents + newUsers.size,
      totalAllocatedMs2: totalAllocatedMs2 || payload?.data?.totalAllocatedMs2 || null
    },
    _meta: {
      status: "verified",
      source: "SQD Portal finalized BSC stream",
      contract: OG_CONVERSION_CONTRACT,
      eventTopic: OG_CONVERTED_TOPIC,
      baselineConvertedWallets: baselineCount,
      baselineBlock,
      lastScannedBlock: Math.max(validCount(payload?._meta?.lastScannedBlock), validCount(finalizedBlock)),
      chainHead: validCount(chainHead),
      confirmations: validCount(confirmations),
      newConvertedWallets: newUsers.size,
      fetchedAt
    },
    _state: {
      seenUsers: [...knownUsers].sort()
    }
  };
}

export class OgConversionCollector {
  constructor({ file, chain, confirmations = 15, streamUrl = DEFAULT_STREAM_URL, portal } = {}) {
    this.file = file;
    this.chain = chain;
    this.confirmations = Math.max(0, Number(confirmations) || 0);
    this.portal = portal || new PortalClient({ streamUrl });
  }

  async sync() {
    const previous = await readOgConversions(this.file);
    if (!previous) throw new Error("OG conversion baseline unavailable");
    const chainHead = await this.portal.getFinalizedHead();
    const finalizedBlock = Math.max(0, chainHead - this.confirmations);
    const lastScannedBlock = validCount(previous?._meta?.lastScannedBlock);
    const users = previous?._state?.seenUsers;
    const hasCompleteAddressState = Array.isArray(users) && users.every(value => /^0x[0-9a-f]{40}$/i.test(value)) && new Set(users.map(value => value.toLowerCase())).size === previous.data.convertedWallets;
    const fromBlock = hasCompleteAddressState ? lastScannedBlock + 1 : OG_CONVERSION_START_BLOCK;
    if (hasCompleteAddressState && fromBlock > finalizedBlock) return previous;
    const logs = fromBlock <= finalizedBlock
      ? await this.portal.queryLogs({
          fromBlock,
          toBlock: finalizedBlock,
          address: OG_CONVERSION_CONTRACT,
          topic0: OG_CONVERTED_TOPIC
        })
      : [];
    let totalAllocatedMs2 = previous?.data?.totalAllocatedMs2 || null;
    try {
      const raw = await this.chain.call(OG_CONVERSION_CONTRACT, "totalAllocated()", `0x${finalizedBlock.toString(16)}`);
      if (raw && raw !== "0x") totalAllocatedMs2 = formatUnits(BigInt(raw), 18);
    } catch {
      // Event count remains authoritative even if this optional contract read fails.
    }
    const mergeBase = hasCompleteAddressState ? previous : {
      ...previous,
      data: { ...previous.data, convertedWallets: 0, convertedEvents: 0 },
      _meta: {
        ...previous._meta,
        baselineConvertedWallets: 0,
        baselineBlock: Math.max(0, fromBlock - 1),
        lastScannedBlock: Math.max(0, fromBlock - 1),
      },
      _state: { seenUsers: [] },
    };
    const next = mergeConvertedUsers(mergeBase, logs, {
      finalizedBlock,
      chainHead,
      confirmations: this.confirmations,
      totalAllocatedMs2
    });
    if (!hasCompleteAddressState) {
      next._meta.baselineConvertedWallets = next.data.convertedWallets;
      next._meta.baselineBlock = finalizedBlock;
    }
    if (next.data.convertedWallets < previous.data.convertedWallets) {
      throw new Error("OG conversion sync attempted to regress the verified wallet count");
    }
    await writeOgConversions(this.file, next);
    return next;
  }
}
