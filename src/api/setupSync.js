import { normalizeSetupPayload } from '../setup/setupContract';
import { SHEETS_SCRIPT_URL } from '../utils/constants';

export async function syncSetupUser(payload) {
  if (!SHEETS_SCRIPT_URL) {
    return { queued: false, reason: 'missing_script_url' };
  }

  const setup = normalizeSetupPayload(payload);
  if (!setup.userId || !setup.username || !setup.password || !setup.spreadsheetId) {
    return { queued: false, reason: 'incomplete_setup' };
  }

  await fetch(SHEETS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'setup_user',
      userId: setup.userId,
      username: setup.username,
      password: setup.password,
      language: setup.language,
      sheetUrl: setup.sheetUrl,
      spreadsheetId: setup.spreadsheetId,
    }),
  });

  return { queued: true };
}
