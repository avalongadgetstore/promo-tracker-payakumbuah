/* google-auth.js */

/*
  We implement Authorization Code Flow with PKCE (recommended).
  For simplicity here we open Google's OAuth endpoint to get a `code`,
  then call serverless function / .netlify/functions/google_oauth_exchange
  to exchange code for tokens securely (server holds client_secret).
*/

/* CONFIG - REPLACE with your Google OAuth client id and required scopes */
const GOOGLE_CLIENT_ID = "797719167639-ejge0tl7g7qo9uv5ng0d6eviqvu5i2qr.apps.googleusercontent.com"; /* REPLACE */
const GOOGLE_OAUTH_SCOPES = [
  "openid",
  "profile",
  "email",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets"
].join(" ");

let currentGoogleInfo = null;

/* helper to generate random string for PKCE */
function randString(len = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars.charAt(Math.floor(Math.random()*chars.length));
  return s;
}

/* base64 url safe */
function base64UrlEncode(str) {
  return btoa(String.fromCharCode(...new Uint8Array(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* create code verifier & challenge */
async function createPKCECodes() {
  const verifier = randString(128);
  const enc = new TextEncoder();
  const data = enc.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const challenge = base64UrlEncode(digest);
  return { verifier, challenge };
}

/* start OAuth flow (opens a window) */
async function connectGoogle() {
  const pkce = await createPKCECodes();
  // store verifier temporarily in sessionStorage
  sessionStorage.setItem('pkce_verifier', pkce.verifier);

  const redirectUri = `${window.location.origin}/.netlify/functions/google_oauth_callback`; // or your netlify function route
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(GOOGLE_OAUTH_SCOPES)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&code_challenge=${encodeURIComponent(pkce.challenge)}` +
    `&code_challenge_method=S256` +
    `&access_type=offline` + // request refresh token
    `&prompt=consent`;

  // open in new window (or you can redirect)
  window.open(authUrl, '_blank', 'width=600,height=700');
}

/*
  NOTE:
  The redirectUri must point to a serverless function (Netlify) that receives the 'code'
  and the serverless will exchange code + verifier for tokens with Google's token endpoint,
  then store tokens securely in Supabase (linked to captain user).
  See server-side function example in netlify/functions/google_oauth_exchange.js
*/

/* Utility to set UI when Google connected */
function setGoogleConnectedUI(name) {
  document.getElementById('googleConnectBtn').innerText = 'Google Connected';
  document.getElementById('googleConnectBtn').disabled = true;
  document.getElementById('usernameDisplay').innerText = name || '';
}

/* Called by other modules once token is available (after server-side exchange) */
window.onGoogleConnected = function(info) {
  currentGoogleInfo = info; // { access_token, refresh_token, email, name, sheetId? }
  setGoogleConnectedUI(info.name || info.email);
}
