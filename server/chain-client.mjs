import { formatUnits, id } from "ethers";

const CONTRACTS = Object.freeze({
  ms2Token: "0xC46A54BBD2716C436Aaaed6Ed2f555a9b054ebD1",
  lotteryProxy: "0x6DE61D8438176741fc8150Aef53256830a6Dd635",
  stakingProxy: "0xB6Ed72808fb34a3Ac118D397f49332abBAA484D8"
});

const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

function selector(signature) {
  return id(signature).slice(0, 10);
}

function decodeUint(value) {
  if (!value || value === "0x") return null;
  return BigInt(value);
}

function decodeBool(value) {
  const number = decodeUint(value);
  return number == null ? null : number !== 0n;
}

function decodeAddress(value) {
  if (!value || value === "0x" || value.length < 42) return null;
  return `0x${value.slice(-40)}`;
}

export class ChainClient {
  constructor(rpcUrls) {
    this.rpcUrls = rpcUrls;
    this.requestId = 0;
  }

  async rpc(method, params) {
    let lastError;
    for (const rpcUrl of this.rpcUrls) {
      try {
        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: ++this.requestId, method, params }),
          signal: AbortSignal.timeout(12_000)
        });
        if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
        const payload = await response.json();
        if (payload.error) throw new Error(payload.error.message || "RPC error");
        return payload.result;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("No BSC RPC URL available");
  }

  call(address, signature) {
    return this.rpc("eth_call", [{ to: address, data: selector(signature) }, "latest"]);
  }

  async safeCall(address, signature, decoder) {
    try {
      return decoder(await this.call(address, signature));
    } catch {
      return null;
    }
  }

  async implementationOf(proxy) {
    const value = await this.rpc("eth_getStorageAt", [proxy, IMPLEMENTATION_SLOT, "latest"]);
    return decodeAddress(value);
  }

  async getSnapshot() {
    const [
      supplyRaw,
      stakedRaw,
      lotteryImplementation,
      stakingImplementation,
      costPerDrawRaw,
      ms2PerDrawRaw,
      maxDrawsRaw,
      lotteryActive,
      lotteryOwner,
      lotterySigner,
      stakeActive,
      unstakeActive,
      unstakeFeeBpsRaw
    ] = await Promise.all([
      this.safeCall(CONTRACTS.ms2Token, "totalSupply()", decodeUint),
      this.safeCall(CONTRACTS.stakingProxy, "totalStaked()", decodeUint),
      this.implementationOf(CONTRACTS.lotteryProxy).catch(() => null),
      this.implementationOf(CONTRACTS.stakingProxy).catch(() => null),
      this.safeCall(CONTRACTS.lotteryProxy, "costPerDraw()", decodeUint),
      this.safeCall(CONTRACTS.lotteryProxy, "ms2PerDraw()", decodeUint),
      this.safeCall(CONTRACTS.lotteryProxy, "MAX_DRAWS_PER_USER()", decodeUint),
      this.safeCall(CONTRACTS.lotteryProxy, "lotteryActive()", decodeBool),
      this.safeCall(CONTRACTS.lotteryProxy, "owner()", decodeAddress),
      this.safeCall(CONTRACTS.lotteryProxy, "signer()", decodeAddress),
      this.safeCall(CONTRACTS.stakingProxy, "stakeActive()", decodeBool),
      this.safeCall(CONTRACTS.stakingProxy, "unstakeActive()", decodeBool),
      this.safeCall(CONTRACTS.stakingProxy, "unstakeFeeBps()", decodeUint)
    ]);

    return {
      fetchedAt: new Date().toISOString(),
      contracts: CONTRACTS,
      ms2TotalSupply: supplyRaw == null ? null : formatUnits(supplyRaw, 18),
      totalStaked: stakedRaw == null ? null : formatUnits(stakedRaw, 18),
      lottery: {
        implementation: lotteryImplementation,
        costPerDraw: costPerDrawRaw == null ? null : formatUnits(costPerDrawRaw, 18),
        ms2PerDraw: ms2PerDrawRaw == null ? null : formatUnits(ms2PerDrawRaw, 18),
        maxDrawsPerUser: maxDrawsRaw == null ? null : maxDrawsRaw.toString(),
        active: lotteryActive,
        owner: lotteryOwner,
        signer: lotterySigner
      },
      staking: {
        implementation: stakingImplementation,
        stakeActive,
        unstakeActive,
        unstakeFeeBps: unstakeFeeBpsRaw == null ? null : unstakeFeeBpsRaw.toString()
      }
    };
  }
}
