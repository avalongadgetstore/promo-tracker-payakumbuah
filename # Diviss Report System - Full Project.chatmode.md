# Diviss Report System - Full Project

## Overview
Web app to manage promo transactions, upload photos, backup to Google Drive, and export reports to Google Sheets.
Backend: Supabase (Auth, DB, Storage)
Hosting: Netlify
Serverless: Netlify Functions for Google OAuth token exchange and export

## Required environment variables (Netlify)
- SUPABASE_URL=https://...supabase.co
- SUPABASE_SERVICE_ROLE_KEY=<service_role_key>  # keep secret (server side)
- GOOGLE_CLIENT_ID=...
- GOOGLE_CLIENT_SECRET=...
- GOOGLE_OAUTH_REDIRECT_URI=https://your-site.netlify.app/.netlify/functions/google_oauth_exchange
- ADMIN_DRIVE_FOLDER_ID=... (optional)

## Setup Supabase
1. Create tables: users, promos, transactions, google_tokens
2. Create storage bucket: promo_photos
3. Add RLS / policies as needed
4. Create anon public key for client (use in supabase.js)
5. Use service role key for Netlify functions (store env var)

## Google Cloud Console
1. Create OAuth client (Web application)
2. Add redirect URI (see env var above)
3. Enable APIs: Google Drive API, Google Sheets API
4. Save client id & client secret for Netlify env

## Deploy
1. Push project to Git (or zip) and deploy to Netlify
2. Configure Netlify environment variables
3. Deploy functions
4. Test flows:
   - Sign up/login via Supabase
   - As Captain: connect Google (this opens consent)
   - Submit promo as server, photo saved to Supabase & backed up to Drive
   - Export selected promos to Google Sheets

## Notes
- Refresh token handling & secure storage must be implemented server-side.
- Do not expose client_secret or service_role key in client-side code.
