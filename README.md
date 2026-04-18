# Anime Watchlist

A Vite + React app for tracking anime you are watching, completed, or planning to watch.  
The frontend reads/writes data through a Google Apps Script web app backed by Google Sheets.

## Architecture Summary

- **Frontend:** React + Vite + React Router + Tailwind (`src\`)
- **State/data flow:** `AnimeProvider` fetches list data and shares it via context (`src\context\AnimeContext.jsx`)
- **API layer:** `src\api\animeApi.js` calls Apps Script `GET/POST`
- **Backend integration:** Google Apps Script (`scripts\apps-script\Code.gs`) writes to `watched` / `unwatched` sheet tabs

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create local env file from the example and fill values:
   ```bash
   copy .env.example .env.local
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

## Required Environment Variables

Set these in `.env.local` for local dev and in your hosting provider for production:

- `VITE_APPS_SCRIPT_URL` - Deployed Google Apps Script web app URL
- `VITE_API_SECRET` - Shared secret sent with `POST` requests (must match `APP_CONFIG.SHARED_SECRET` in Apps Script)

## Google Apps Script Deployment

Use the existing integration files in `scripts\apps-script`:

- `scripts\apps-script\Code.gs` - Script source code to paste into Apps Script
- `scripts\apps-script\SETUP.txt` - Detailed setup checklist

Quick usage:

1. Open your Google Sheet and Apps Script editor.
2. Replace script contents with `Code.gs`.
3. Set `APP_CONFIG.SHARED_SECRET` in `Code.gs`.
4. Deploy as a **Web app** and copy the web app URL.
5. Set frontend env vars:
   - `VITE_APPS_SCRIPT_URL=<web-app-url>`
   - `VITE_API_SECRET=<same-shared-secret>`

## Deploying Frontend (Vercel / Netlify)

Both platforms can deploy this app as a static Vite site:

- Build command: `npm run build`
- Output directory: `dist`
- Required env vars on platform:
  - `VITE_APPS_SCRIPT_URL`
  - `VITE_API_SECRET`

After deploy, redeploy whenever env vars change so Vite can embed updated values.
