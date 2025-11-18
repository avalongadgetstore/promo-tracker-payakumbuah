// netlify/functions/export_to_sheets.js
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function refreshTokenIfNeeded(tokenRow) {
  // if expired or near expiry: call token endpoint with refresh_token to get new access_token
  if (!tokenRow.refresh_token) throw new Error('No refresh token available');
  // call oauth2 token endpoint ...
  // update supabase tokens...
  return tokenRow.access_token; // placeholder
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode:405, body:'Method Not Allowed' };
  const body = JSON.parse(event.body);
  const { promoIds, dateFrom, dateTo } = body;

  // Authentication: determine user (captain) - you should verify a JWT or custom header
  // For demo assume header 'x-user-id' contains supabase user id
  const userId = event.headers['x-user-id'];
  if (!userId) return { statusCode:401, body: JSON.stringify({ message: 'Unauthorized' }) };

  // get tokens for this user
  const { data: tokens } = await supabase.from('google_tokens').select('*').eq('user_id', userId).single();
  if (!tokens) return { statusCode:400, body: JSON.stringify({ message: 'Google not connected' }) };

  // ensure access_token valid (refresh if needed)
  const accessToken = await refreshTokenIfNeeded(tokens);

  // query transactions
  let q = supabase.from('transactions').select('*');
  if (promoIds && promoIds.length) q = q.in('promo_id', promoIds);
  if (dateFrom) q = q.gte('date', dateFrom);
  if (dateTo) q = q.lte('date', dateTo + 'T23:59:59Z');
  const { data: transactions } = await q;

  // Build spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method:'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ properties: { title: `Diviss Report ${new Date().toLocaleString()}` } })
  });
  const sheetCreated = await createRes.json();
  const sheetId = sheetCreated.spreadsheetId;

  // prepare rows
  const values = [
    ['Tanggal','Nama Server','Nama Customer','No HP','Jenis Promo','Foto']
  ];
  transactions.forEach(t => {
    values.push([t.date, t.server_name, t.customer_name, t.customer_phone, t.promo_id, t.photo_url || '']);
  });

  // write values
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A1:append?valueInputOption=RAW`, {
    method:'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ values })
  });

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`;

  return { statusCode:200, body: JSON.stringify({ sheetUrl }) };
};
