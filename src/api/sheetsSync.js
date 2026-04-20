import { SHEETS_SCRIPT_URL } from '../utils/constants';
import { getSetupSyncContext, withSyncContext } from './syncContext';

/**
 * Fire-and-forget POST to the Apps Script web app.
 * Uses mode:'no-cors' because GAS issues a 302 redirect on POST
 * which normal CORS fetch cannot follow cross-origin.
 * We never read the response � localStorage is the source of truth.
 */
function post(payload) {
  if (!SHEETS_SCRIPT_URL) {
    console.warn('[SheetsSync] SHEETS_SCRIPT_URL is not set in constants.js — Google Sheets sync is disabled.');
    return;
  }

  const syncContext = getSetupSyncContext();
  if (!syncContext.isComplete) {
    console.warn(
      '[SheetsSync] Skipping remote sync because setup context is incomplete.',
      { hasSetup: syncContext.hasSetup, hasUserId: Boolean(syncContext.userId), hasSpreadsheetId: Boolean(syncContext.spreadsheetId), action: payload.action },
    );
    return;
  }

  const body = withSyncContext(payload, syncContext);
  console.log('[SheetsSync] Syncing:', body.action, body.title || body.id || '');
  fetch(SHEETS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(() => {
    console.log('[SheetsSync] Request sent (no-cors — response is opaque).');
  }).catch((err) => {
    console.error('[SheetsSync] Fetch failed:', err);
  });
}

/**
 * Called after a new anime is added via the form.
 * Sends the full anime object ? GAS appends it to the correct sheet tab.
 */
export function syncAdd(anime) {
  post({ action: 'add', ...anime });
}

/**
 * Called after any update (form edit OR drag-drop status change).
 * Sends the full anime object so GAS knows the new status and can
 * move the row between sheet tabs when the status changed.
 */
export function syncUpdate(anime) {
  post({ action: 'update', ...anime });
}

/**
 * Called after a delete (� button on a card).
 * GAS finds the row by id across all three sheet tabs and removes it.
 */
export function syncDelete(id) {
  post({ action: 'delete', id });
}
