# Anime Watchlist

A drag-and-drop kanban anime tracker built with Vite + React + Tailwind CSS.  
Tracks anime across four columns — **Watching**, **Completed**, **Plan to Watch**, and **Upcoming** — with localStorage as the primary data store and Google Sheets sync via Apps Script.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router DOM v6 |
| Data | localStorage (primary) |
| Sync | Google Apps Script → Google Sheets |
| Hosting | Vercel |

---

## Project Structure

```
anime-watchlist/
├── public/                  # Static assets (background images)
├── scripts/
│   └── apps-script/
│       ├── Code.gs          # Google Apps Script backend
│       └── SETUP.txt        # GAS setup checklist
├── src/
│   ├── api/
│   │   ├── animeApi.js      # localStorage CRUD + triggers sync
│   │   └── sheetsSync.js    # Fire-and-forget Google Sheets sync
│   ├── components/          # KanbanBoard, KanbanColumn, AnimeCard, etc.
│   ├── context/             # AnimeContext (global state)
│   ├── hooks/               # useAnime hook
│   ├── pages/               # Page components
│   └── utils/
│       └── constants.js     # Statuses, routes, env vars
├── .env                     # Local secrets (gitignored)
├── .env.example             # Template — safe to commit
└── index.html
```

---

## Local Development

### 1. Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- npm v9 or higher

### 2. Clone and install

```bash
git clone https://github.com/salimuddin07/anime-watchlist.git
cd anime-watchlist
npm install
```

### 3. Set up environment variables

```bash
copy .env.example .env
```

Open `.env` and fill in your values (see [Environment Variables](#environment-variables) below).

### 4. Start the dev server

```bash
npm run dev
```

App runs at `http://localhost:5173`.

### First-run onboarding (in app)

On first launch, the app starts onboarding before the kanban board:

1. Enter username + password (login-style form)  
2. Link your Google Sheet (URL or spreadsheet ID, when required)

Existing-user behavior during step 1 (credentials):
- App checks the central **User Data** tab via Apps Script
- If a matching user with stored sheet metadata is found, step 2 is skipped
- If not found (or lookup is unavailable), onboarding continues to step 2

Sheet setup notes shown in-app:
- Share as **Anyone with the link** with **edit** access
- Required tabs used/created by the app (auto-created if missing): **Watching, Completed, Plan, Upcoming**
- Example URL format: `https://docs.google.com/spreadsheets/d/<spreadsheet-id>/edit#gid=0`

Persistence behavior:
- Setup is saved in localStorage (`anime_watchlist_setup_v1`) with a stable local `userId`
- Username/password are stored locally and restored for returning users (with cookie fallback support)
- After setup is complete, users are not prompted again on refresh/revisit
- Account controls are now compact in the navbar: **username**, **Language selector**, **Update Sheet Link**, **Logout**
- Language can be changed anytime from the navbar selector (**English, Bangla, Hindi, Gujarati**)
- Navbar includes a **Light/Dark mode** option
- Theme preference is remembered locally and restored on refresh/revisit
- The old large top account panel has been removed
- Users can update the linked sheet later with **Update Sheet Link**
- Logout clears local setup and immediately shows onboarding again
- Apps Script upserts `userId` + sheet metadata (`sheetUrl` / `spreadsheetId`) to the central **User Data** tab

### 5. Build for production

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## Environment Variables

All variables must be prefixed with `VITE_` so Vite exposes them at build time via `import.meta.env`.

| Variable | Required | Description |
|---|---|---|
| `VITE_SHEETS_SCRIPT_URL` | Yes (for sync) | Deployed Google Apps Script web app URL |
| `VITE_SPREADSHEET_ID` | No | Your Google Spreadsheet ID (for reference) |
| `VITE_SHEET_WATCHING` | No | Sheet tab name for watching (default: `watching`) |
| `VITE_SHEET_COMPLETED` | No | Sheet tab name for completed (default: `completed`) |
| `VITE_SHEET_PLAN` | No | Sheet tab name for plan to watch (default: `plan`) |
| `VITE_SHEET_UPCOMING` | No | Sheet tab name for upcoming (default: `upcoming`) |

**Example `.env`:**
```env
VITE_SHEETS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_SPREADSHEET_ID=your_spreadsheet_id_here
VITE_SHEET_WATCHING=watching
VITE_SHEET_COMPLETED=completed
VITE_SHEET_PLAN=plan
VITE_SHEET_UPCOMING=upcoming
```

> `.env` is gitignored. Never commit it. Use `.env.example` as the template.

---

## Google Apps Script Setup

The app syncs data to Google Sheets via a deployed Apps Script web app. This is optional — the app works fully offline with localStorage.

### 1. Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Copy the **Spreadsheet ID** from the URL:  
   `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`

### 2. Open Apps Script

1. In the spreadsheet, click **Extensions → Apps Script**
2. Delete all existing code in `Code.gs`
3. Paste the full contents of [`scripts/apps-script/Code.gs`](scripts/apps-script/Code.gs)
4. Click **Save** (Ctrl+S)

### 3. Set Script Properties (your .env equivalent)

1. Select `setupProperties` from the function dropdown in the toolbar
2. Click **Run**
3. Approve any permission prompts
4. You should see `Script properties saved.` in the Execution Log

This stores the Spreadsheet ID and sheet tab names securely inside the GAS project.

### 4. Deploy as a Web App

1. Click **Deploy → New deployment**
2. Click the gear icon next to **Type** and select **Web app**
3. Set:
   - **Description:** `v1` (or any label)
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. Click **Deploy**
5. Copy the **Web app URL** — it looks like:  
   `https://script.google.com/macros/s/XXXXXX/exec`

### 5. Update your environment

Paste the URL into:
- `.env` → `VITE_SHEETS_SCRIPT_URL=<paste here>` (for local dev)
- Vercel dashboard → Environment Variables (for production)

### Redeploying after code changes

Any time you edit `Code.gs`, you must create a new version to make it live:

1. **Deploy → Manage deployments**
2. Click the **pencil (edit)** icon
3. Change **Version** to **New version**
4. Click **Deploy**

The URL stays the same — no frontend changes needed.

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "your message"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Framework preset will auto-detect as **Vite**
4. Click **Deploy**

### 3. Add Environment Variables

> This step is critical — Vercel never sees your `.env` file since it's gitignored.

1. Go to your Vercel project → **Settings → Environment Variables**
2. Add the following:

| Name | Value | Environment |
|---|---|---|
| `VITE_SHEETS_SCRIPT_URL` | Your Apps Script web app URL | Production, Preview, Development |

3. Click **Save**

### 4. Redeploy to apply variables

Vercel bakes `VITE_*` variables into the JavaScript bundle at build time. After adding variables you must trigger a new build:

1. Go to **Deployments**
2. Click the three-dot menu on the latest deployment
3. Click **Redeploy**

### Future deployments

After this, every `git push` to `main` triggers an automatic redeploy on Vercel. Environment variables are persisted — you only need to set them once.

---

## How Sync Works

```
User action (add/update/delete)
        ↓
animeApi.js  ←→  localStorage  (source of truth)
        ↓
sheetsSync.js
        ↓  (fetch POST, mode: no-cors, fire-and-forget)
Apps Script Web App
        ↓
Google Sheets (watching / completed / plan / upcoming tabs)
```

- Onboarding and sheet-link updates also sync setup metadata (`userId`, `sheetUrl`, `spreadsheetId`) to the central **User Data** tab via Apps Script.
- During onboarding credentials step, the app tries to resolve an existing user from **User Data**; on success, stored sheet metadata is reused and the sheet-link step is skipped.
- If existing-user lookup is missing/unavailable, onboarding falls back to the manual sheet-link step.
- Data is **always** saved to localStorage first — the app works even if Sheets sync fails
- `mode: 'no-cors'` is required because GAS redirects POST requests cross-origin
- Drag-drop between columns triggers an `update` sync which moves the row to the correct sheet tab

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `SHEETS_SCRIPT_URL is not set` in console | Add `VITE_SHEETS_SCRIPT_URL` to Vercel env vars and redeploy |
| Anime saved locally but not in Sheets | Redeploy Apps Script with a new version after code changes |
| Sheet tab not created | Drag or add an anime to that status — tabs are auto-created on first write |
| Existing user is still asked for a sheet URL | Verify Apps Script is reachable and **User Data** has matching credentials plus `sheetUrl`/`spreadsheetId`; otherwise onboarding intentionally falls back to manual sheet-link |
| Logout did not return setup flow | Logout clears local setup (`anime_watchlist_setup_v1`); refresh once if stale UI is cached |
| `Script properties saved` not showing | Re-run `setupProperties()` and approve all permission prompts |
| Vercel build failing | Check that all `VITE_*` variables are set in Vercel dashboard |
