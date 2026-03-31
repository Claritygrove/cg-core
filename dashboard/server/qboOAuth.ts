import { Router } from "express";
import { saveTokens, clearTokens, getTokens } from "./tokenStore.js";

const router = Router();

const QBO_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QBO_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QBO_SCOPE = "com.intuit.quickbooks.accounting";
const REDIRECT_URI = "http://localhost:3001/api/integrations/quickbooks/oauth/callback";

router.get("/integrations/quickbooks/oauth/start", (req, res) => {
  const clientId = process.env["QBO_CLIENT_ID"];
  if (!clientId) {
    res.status(500).send("QBO_CLIENT_ID not set. Add it to dashboard/.env");
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: QBO_SCOPE,
    redirect_uri: REDIRECT_URI,
    state: Buffer.from(JSON.stringify({ ts: Date.now() })).toString("base64"),
  });

  res.redirect(`${QBO_AUTH_URL}?${params.toString()}`);
});

router.get("/integrations/quickbooks/oauth/callback", async (req, res) => {
  const { code, realmId, error } = req.query as Record<string, string>;

  if (error || !code || !realmId) {
    res.redirect(`http://localhost:3000/?qbo_error=${encodeURIComponent(error ?? "Missing code or realmId")}`);
    return;
  }

  const clientId = process.env["QBO_CLIENT_ID"];
  const clientSecret = process.env["QBO_CLIENT_SECRET"];
  if (!clientId || !clientSecret) {
    res.redirect("http://localhost:3000/?qbo_error=Server+credentials+not+configured");
    return;
  }

  try {
    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch(QBO_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${await tokenRes.text()}`);

    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      x_refresh_token_expires_in: number;
    };

    await saveTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      realmId,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      refreshExpiresAt: new Date(Date.now() + tokens.x_refresh_token_expires_in * 1000).toISOString(),
    });

    res.redirect("http://localhost:3000/?qbo_connected=true");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    res.redirect(`http://localhost:3000/?qbo_error=${encodeURIComponent(msg)}`);
  }
});

router.get("/integrations/quickbooks/status", async (_req, res) => {
  const tokens = await getTokens();
  res.json({ connected: !!tokens });
});

router.post("/integrations/quickbooks/disconnect", async (_req, res) => {
  await clearTokens();
  res.json({ ok: true });
});

export default router;
