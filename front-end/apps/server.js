// server.js - Version ESM
import express from 'express';
import { Issuer, generators } from 'openid-client';

const app = express();
let client;
let codeVerifier;

async function init() {
  const issuer = await Issuer.discover('http://kong-app-kong-proxy.ingress.svc.cluster.local:8000/logging/v1/realms/smap-platform/.well-known/openid-configuration');
  
  client = new issuer.Client({
    client_id: 'smap-client',
    redirect_uris: ['http://oauth2-client.ingress.svc.cluster.local/callback'],
    response_types: ['code'],
  });
}

app.get('/login', async (req, res) => {
  codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  
  const authUrl = client.authorizationUrl({
    scope: 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const params = client.callbackParams(req);
  const tokenSet = await client.callback(
    'http://oauth2-client.ingress.svc.cluster.local/callback',
    params,
    { code_verifier: codeVerifier }
  );
  
  res.json({
    access_token: tokenSet.access_token,
    id_token: tokenSet.id_token,
    claims: tokenSet.claims()
  });
});

init().then(() => app.listen(3000));