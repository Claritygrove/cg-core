import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const TOKENS_FILE = path.join(DATA_DIR, "tokens.json");

export interface QBOTokens {
  accessToken: string;
  refreshToken: string;
  realmId: string;
  expiresAt: string;
  refreshExpiresAt: string;
}

export async function getTokens(): Promise<QBOTokens | null> {
  try {
    const raw = await fs.readFile(TOKENS_FILE, "utf-8");
    return JSON.parse(raw) as QBOTokens;
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: QBOTokens): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

export async function clearTokens(): Promise<void> {
  try {
    await fs.unlink(TOKENS_FILE);
  } catch {
    // File doesn't exist — that's fine
  }
}

export async function refreshIfNeeded(tokens: QBOTokens): Promise<QBOTokens> {
  const expiresAt = new Date(tokens.expiresAt);
  const fiveMinutes = 5 * 60 * 1000;
  if (expiresAt.getTime() - Date.now() > fiveMinutes) return tokens;

  const clientId = process.env["QBO_CLIENT_ID"];
  const clientSecret = process.env["QBO_CLIENT_SECRET"];
  if (!clientId || !clientSecret) throw new Error("QBO credentials not configured in .env");

  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
    }),
  });

  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    x_refresh_token_expires_in: number;
  };

  const updated: QBOTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    realmId: tokens.realmId,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    refreshExpiresAt: new Date(Date.now() + data.x_refresh_token_expires_in * 1000).toISOString(),
  };

  await saveTokens(updated);
  return updated;
}
