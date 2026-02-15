import express from "express";
import crypto from "crypto";
import { discovery } from "openid-client";

const app = express();
const PORT = 3000;

// URL du realm Keycloak (accessible depuis le POD)
const ISSUER_BASE =
  process.env.ISSUER_BASE ||
  "http://kong-app-kong-proxy.ingress.svc.cluster.local:8000/logging/v1/realms/smap-platform";

const CLIENT_ID = process.env.CLIENT_ID || "smap-client";

// URL publique (celle que TON navigateur utilise)
const BASE_URL = process.env.BASE_URL || "http://smap-dev.ingress.local";
const REDIRECT_URI = `${BASE_URL}/callback`;

// state -> code_verifier (store dev)
const pkceStore = new Map();

function base64url(input) {
  return input
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function randomString(bytes = 32) {
  return base64url(crypto.randomBytes(bytes));
}

function sha256base64url(str) {
  return base64url(crypto.createHash("sha256").update(str).digest());
}

let client;

async function init() {
  client = await discovery(new URL(ISSUER_BASE), CLIENT_ID);
  console.log("OIDC discovery OK:", ISSUER_BASE);
  console.log("Redirect URI:", REDIRECT_URI);
}

app.get("/", (_req, res) => {
  res.send(`
    <h3>SMAP OAuth2 Client</h3>
    <a href="/login">Login</a>
  `);
});

app.get("/login", (_req, res) => {
  const state = randomString(16);
  const code_verifier = randomString(48);
  const code_challenge = sha256base64url(code_verifier);

  pkceStore.set(state, code_verifier);

  const url = client.authorizationUrl({
    redirect_uri: REDIRECT_URI,
    scope: "openid profile email",
    response_type: "code",
    state,
    code_challenge,
    code_challenge_method: "S256",
  });

  res.redirect(url);
});

app.get("/callback", async (req, res) => {
  try {
    const params = client.callbackParams(req);
    const state = params.state;

    const code_verifier = pkceStore.get(state);
    if (!code_verifier) {
      return res.status(400).json({ error: "Invalid state" });
    }
    pkceStore.delete(state);

    const tokenSet = await client.callback(REDIRECT_URI, params, { code_verifier });

    res.json({
      access_token: tokenSet.access_token,
      id_token: tokenSet.id_token,
      claims: tokenSet.claims(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

init().then(() => app.listen(PORT, () => console.log(`Listening on ${PORT}`)));
