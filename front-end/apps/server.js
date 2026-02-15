import express from "express";
import crypto from "crypto";

const app = express();
const PORT = 3000;

const BASE_URL = process.env.BASE_URL || "http://smap-dev.ingress.local";
const REDIRECT_URI = `${BASE_URL}/callback`;

const CLIENT_ID = process.env.CLIENT_ID || "smap-client";

// Tes endpoints Keycloak via Kong (HTTP OK)
const AUTHORIZATION_ENDPOINT =
  process.env.AUTHORIZATION_ENDPOINT ||
  "http://kong-app-kong-proxy.ingress.svc.cluster.local:8000/logging/v1/realms/smap-platform/protocol/openid-connect/auth";

const TOKEN_ENDPOINT =
  process.env.TOKEN_ENDPOINT ||
  "http://kong-app-kong-proxy.ingress.svc.cluster.local:8000/logging/v1/realms/smap-platform/protocol/openid-connect/token";

const pkceStore = new Map();

function base64url(buf) {
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function randomString(bytes = 32) {
  return base64url(crypto.randomBytes(bytes));
}
function sha256base64url(str) {
  return base64url(crypto.createHash("sha256").update(str).digest());
}

app.get("/", (_req, res) => res.send(`<a href="/login">Login</a>`));

app.get("/login", (_req, res) => {
  const state = randomString(16);
  const code_verifier = randomString(48);
  const code_challenge = sha256base64url(code_verifier);

  pkceStore.set(state, code_verifier);

  const url = new URL(AUTHORIZATION_ENDPOINT);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", code_challenge);
  url.searchParams.set("code_challenge_method", "S256");

  res.redirect(url.toString());
});

app.get("/callback", async (req, res) => {
  try {
    const code = req.query.code;
    const state = req.query.state;

    if (!code || !state) return res.status(400).json({ error: "Missing code/state" });

    const code_verifier = pkceStore.get(state);
    if (!code_verifier) return res.status(400).json({ error: "Invalid state" });
    pkceStore.delete(state);

    const body = new URLSearchParams();
    body.set("grant_type", "authorization_code");
    body.set("client_id", CLIENT_ID);
    body.set("redirect_uri", REDIRECT_URI);
    body.set("code", code);
    body.set("code_verifier", code_verifier);

    const resp = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const json = await resp.json();
    res.status(resp.status).json(json);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.listen(PORT, () => console.log(`Listening on ${PORT} redirect=${REDIRECT_URI}`));
