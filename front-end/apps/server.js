import express from "express";
import crypto from "crypto";
import { discovery, generators } from "openid-client";

const app = express();
const PORT = 3000;

// URL "realm" (sans /.well-known), accessible depuis le POD
// Exemple via Kong: http://kong.../logging/v1/realms/smap-platform
const ISSUER_BASE =
  process.env.ISSUER_BASE ||
  "http://kong-app-kong-proxy.ingress.svc.cluster.local:8000/logging/v1/realms/smap-platform";

const CLIENT_ID = process.env.CLIENT_ID || "smap-client";

// URL publique (vue par TON navigateur) — ici ton Ingress host
const BASE_URL = process.env.BASE_URL || "http://smap-dev.ingress.local";
const REDIRECT_URI = `${BASE_URL}/callback`;

// store simple (dev)
const pkceStore = new Map();

function randomState() {
  return crypto.randomBytes(16).toString("hex");
}

let client;

async function init() {
  // discovery() prend l'issuer (base realm) et fait le fetch du well-known
  const config = await discovery(new URL(ISSUER_BASE), CLIENT_ID);

  // client "public" PKCE: pas de secret
  client = config;
  console.log("OIDC discovery OK for:", ISSUER_BASE);
  console.log("Redirect URI:", REDIRECT_URI);
}

app.get("/", (_req, res) => {
  res.send(`
    <h3>SMAP OAuth2 Client</h3>
    <ul>
      <li><a href="/login">Login</a></li>
      <li><a href="/me">Show claims (after login)</a></li>
    </ul>
  `);
});

app.get("/login", (req, res) => {
  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);
  const state = randomState();

  pkceStore.set(state, code_verifier);

  const authUrl = client.authorizationUrl({
    redirect_uri: REDIRECT_URI,
    scope: "openid profile email",
    code_challenge,
    code_challenge_method: "S256",
    state,
  });

  res.redirect(authUrl);
});

app.get("/callback", async (req, res) => {
  try {
    const params = client.callbackParams(req);
    const state = params.state;

    const code_verifier = pkceStore.get(state);
    if (!code_verifier) {
      return res.status(400).json({ error: "Missing/invalid state" });
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

app.get("/me", (_req, res) => {
  res.send("Login first: go to /login");
});

init().then(() => app.listen(PORT, () => console.log(`Listening on ${PORT}`)));
