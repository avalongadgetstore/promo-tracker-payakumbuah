// netlify/functions/google_oauth_exchange.js
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI; // must match redirect set when creating client

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const body = JSON.parse(event.body);
  const { code, state, user_id } = body; // state can include user id

  if (!code) return { statusCode: 400, body: JSON.stringify({ message: 'Missing code' }) };

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });

  const tokenJson = await tokenRes.json();
  if (tokenJson.error) {
    return { statusCode: 500, body: JSON.stringify(tokenJson) };
  }

  // tokenJson contains access_token, refresh_token, expires_in, scope, token_type, id_token
  // save to Supabase table google_tokens linked to user (user_id required)
  if (!user_id) {
    // optionally decode id_token to get email
  }

  const insert = await supabase
    .from('google_tokens')
    .insert([{ user_id, access_token: tokenJson.access_token, refresh_token: tokenJson.refresh_token, scope: tokenJson.scope, expiry: Date.now() + (tokenJson.expires_in * 1000) }]);

  if (insert.error) {
    return { statusCode: 500, body: JSON.stringify(insert.error) };
  }

  return { statusCode: 200, body: JSON.stringify({ success:true }) };
};
