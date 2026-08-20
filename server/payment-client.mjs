import { Wallet } from "ethers";

const CHAIN_ID = 56;

function assertApiSuccess(payload, label) {
  if (!payload || payload.code !== 200 || payload.data == null) {
    const error = new Error(`${label}: ${payload?.msg || "invalid response"}`);
    error.code = payload?.code;
    throw error;
  }
  return payload.data;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(15_000),
    headers: {
      accept: "application/json",
      ...options.headers
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return response.json();
}

export function createServiceWallet({ privateKey, allowEphemeral }) {
  if (privateKey) return { wallet: new Wallet(privateKey), mode: "secret" };
  if (allowEphemeral) return { wallet: Wallet.createRandom(), mode: "ephemeral" };
  return { wallet: null, mode: "disabled" };
}

export class PaymentClient {
  constructor({ baseUrl, wallet }) {
    this.baseUrl = baseUrl;
    this.wallet = wallet;
    this.token = "";
    this.authenticationInFlight = null;
  }

  async authenticate() {
    if (this.authenticationInFlight) return this.authenticationInFlight;
    this.authenticationInFlight = this.performAuthentication();
    try {
      return await this.authenticationInFlight;
    } finally {
      this.authenticationInFlight = null;
    }
  }

  async performAuthentication() {
    if (!this.wallet) throw new Error("Payment authentication is disabled");
    const address = await this.wallet.getAddress();
    const query = new URLSearchParams({ address, chainId: String(CHAIN_ID) });
    const challengePayload = await requestJson(`${this.baseUrl}/v1/auth/challenge?${query}`);
    const challenge = assertApiSuccess(challengePayload, "Payment challenge");
    if (!challenge.message || !challenge.uuid) throw new Error("Payment challenge omitted message or uuid");

    const signature = await this.wallet.signMessage(challenge.message);
    const loginPayload = await requestJson(`${this.baseUrl}/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        address,
        uuid: challenge.uuid,
        message: challenge.message,
        signature
      })
    });
    const login = assertApiSuccess(loginPayload, "Payment login");
    if (!login.token) throw new Error("Payment login omitted token");
    this.token = login.token;
    return true;
  }

  async authenticatedGet(path) {
    if (!this.wallet) throw new Error("Payment authentication is disabled");
    if (!this.token) await this.authenticate();

    let payload = await requestJson(`${this.baseUrl}${path}`, {
      headers: { token: this.token }
    });
    if (payload?.code === 900401) {
      this.token = "";
      await this.authenticate();
      payload = await requestJson(`${this.baseUrl}${path}`, {
        headers: { token: this.token }
      });
    }
    return assertApiSuccess(payload, `Payment ${path}`);
  }

  getDashboard() {
    return this.authenticatedGet("/v1/lottery2/dashboard");
  }

  async getStakingInfo() {
    if (!this.wallet) throw new Error("Payment authentication is disabled");
    const address = await this.wallet.getAddress();
    return this.authenticatedGet(`/v1/ms2-staking/info?address=${encodeURIComponent(address)}`);
  }

  async getWinners() {
    const payload = await requestJson(`${this.baseUrl}/v1/lottery2/winners`);
    const data = assertApiSuccess(payload, "Payment winners");
    return Array.isArray(data) ? data : [];
  }
}
