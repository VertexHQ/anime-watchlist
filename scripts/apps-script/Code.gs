// --- CONFIG ------------------------------------------------------------------
// Values are read from Script Properties (File > Project settings > Script properties).
// This keeps credentials out of source code — equivalent to a .env file for GAS.
// To set them: run the setupProperties() function once from the Apps Script editor.
// FIELDS drives header creation; add a field here and headers auto-update.
var _props = PropertiesService.getScriptProperties().getProperties();
var APP_CONFIG = {
  SPREADSHEET_ID: _props.SPREADSHEET_ID || '1M5h2vyTr3eZmFxTLmW9XoJ-YOOaTexMfhVEaUH_G68M',
  SHEETS: {
    WATCHING:  _props.SHEET_WATCHING  || 'watching',
    COMPLETED: _props.SHEET_COMPLETED || 'completed',
    PLAN:      _props.SHEET_PLAN      || 'plan',
    COMING_SOON: _props.SHEET_COMING_SOON || 'coming-soon',
    DROPPED: _props.SHEET_DROPPED || 'dropped',
    LEGACY_UPCOMING: _props.SHEET_UPCOMING || 'upcoming'
  },
  BASE_FIELDS: ['id', 'title', 'status', 'rating', 'notes', 'image', 'createdAt'],
  ALL_FIELDS: ['id', 'title', 'status', 'rating', 'notes', 'image', 'droppedReason', 'releaseDate', 'releaseDateNotDeclared', 'createdAt']
};
var USER_DATA_CONFIG = {
  SPREADSHEET_ID: _props.USER_DATA_SPREADSHEET_ID || '1FUMUCFvqhWv8tMufN-q6zshe10DFB0qUaQMba2yrEQM',
  SHEET_NAME: _props.SHEET_USER_DATA || 'User Data',
  FIELDS: ['userId', 'username', 'password', 'sheetUrl', 'spreadsheetId', 'language', 'createdAt', 'updatedAt']
};

function getFieldsForSheet_(sheetOrName) {
  var sheetName = '';
  if (typeof sheetOrName === 'string') {
    sheetName = sheetOrName;
  } else if (sheetOrName && sheetOrName.getName) {
    sheetName = sheetOrName.getName();
  }

  if (sheetName === APP_CONFIG.SHEETS.COMING_SOON || sheetName === APP_CONFIG.SHEETS.LEGACY_UPCOMING) {
    return ['id', 'title', 'status', 'rating', 'notes', 'image', 'releaseDate', 'releaseDateNotDeclared', 'createdAt'];
  }

  if (sheetName === APP_CONFIG.SHEETS.DROPPED) {
    return ['id', 'title', 'status', 'rating', 'notes', 'image', 'droppedReason', 'createdAt'];
  }

  return APP_CONFIG.BASE_FIELDS;
}

// Run this function ONCE from the Apps Script editor to store your config
// in Script Properties (equivalent of writing to a .env file).
function setupProperties() {
  PropertiesService.getScriptProperties().setProperties({
    SPREADSHEET_ID: '1M5h2vyTr3eZmFxTLmW9XoJ-YOOaTexMfhVEaUH_G68M',
    USER_DATA_SPREADSHEET_ID: '1FUMUCFvqhWv8tMufN-q6zshe10DFB0qUaQMba2yrEQM',
    SHEET_WATCHING:  'watching',
    SHEET_COMPLETED: 'completed',
    SHEET_PLAN:      'plan',
    SHEET_COMING_SOON: 'coming-soon',
    SHEET_DROPPED: 'dropped',
    SHEET_UPCOMING:  'upcoming',
    SHEET_USER_DATA: 'User Data'
  });
  Logger.log('Script properties saved.');
}

// --- HTTP HANDLERS ------------------------------------------------------------
function doGet(e) {
  try {
    var queryParams = parseQueryParams_(e);
    var action = String(queryParams.action || '').toLowerCase();
    if (action === 'get_user' || action === 'get-user') return handleGetUser_(queryParams);
    if (action === 'check_sheet' || action === 'check-sheet') return handleCheckSheet_(queryParams);
    var anime = getAllAnime_(queryParams);
    return jsonResponse_({ success: true, status: 'ok', anime: anime });
  } catch (error) {
    return errorResponse_('INTERNAL_ERROR', error);
  }
}

function doPost(e) {
  try {
    var data = parseRequestBody_(e);
    var action = String(data.action || 'add').toLowerCase();
    if (action === 'add')    return handleAdd_(data);
    if (action === 'update') return handleUpdate_(data);
    if (action === 'delete') return handleDelete_(data);
    if (action === 'setup_user' || action === 'setup-user') return handleSetupUser_(data);
    return jsonResponse_({ success: false, code: 'INVALID_ACTION', message: 'Unknown action: ' + action });
  } catch (error) {
    return errorResponse_('INTERNAL_ERROR', error);
  }
}

// --- ACTION HANDLERS ---------------------------------------------------------
function handleAdd_(data) {
  var title = String(data.title || '').trim();
  if (!title) return jsonResponse_({ success: false, code: 'VALIDATION_ERROR', message: 'title is required.' });
  var context = getRequestContext_(data);

  var status = normalizeStatus_(data.status) || 'watching';
  var releaseDateNotDeclared = normalizeBooleanFlag_(data.releaseDateNotDeclared);
  var releaseDate = String(data.releaseDate || '').trim();
  var droppedReason = String(data.droppedReason || '').trim();
  if (status !== 'coming-soon') {
    releaseDate = '';
    releaseDateNotDeclared = 'false';
  } else if (releaseDateNotDeclared === 'true') {
    releaseDate = '';
  }
  if (status !== 'dropped') {
    droppedReason = '';
  }
  var anime = {
    id:        String(data.id || Utilities.getUuid()),
    title:     title,
    status:    status,
    rating:    String(data.rating  || ''),
    notes:     String(data.notes   || ''),
    image:     String(data.image   || ''),
    droppedReason: droppedReason,
    releaseDate: releaseDate,
    releaseDateNotDeclared: releaseDateNotDeclared,
    createdAt: String(data.createdAt || new Date().toISOString())
  };

  var sheet = getSheetForStatus_(anime.status, context.spreadsheet);
  ensureHeaders_(sheet);
  sheet.appendRow(objectToRow_(anime, sheet));
  return jsonResponse_({ success: true, status: 'ok', anime: anime });
}

function handleUpdate_(data) {
  var id = String(data.id || '');
  if (!id) return jsonResponse_({ success: false, code: 'VALIDATION_ERROR', message: 'id is required.' });
  var context = getRequestContext_(data);

  var found = findRowById_(id, context.spreadsheet);
  if (!found) return jsonResponse_({ success: false, code: 'NOT_FOUND', message: 'Anime not found: ' + id });

  // Merge incoming fields onto existing row - every field is optional
  var currentStatus = normalizeStatus_(found.item.status) || 'watching';
  var nextStatus = data.status !== undefined
    ? (normalizeStatus_(data.status) || currentStatus)
    : currentStatus;
  var nextDroppedReason = data.droppedReason !== undefined
    ? String(data.droppedReason || '').trim()
    : String(found.item.droppedReason || '').trim();
  var nextReleaseDate = data.releaseDate !== undefined
    ? String(data.releaseDate || '').trim()
    : String(found.item.releaseDate || '').trim();
  var nextReleaseDateNotDeclared = data.releaseDateNotDeclared !== undefined
    ? normalizeBooleanFlag_(data.releaseDateNotDeclared)
    : normalizeBooleanFlag_(found.item.releaseDateNotDeclared);

  if (nextStatus !== 'dropped') {
    nextDroppedReason = '';
  }
  if (nextStatus !== 'coming-soon') {
    nextReleaseDate = '';
    nextReleaseDateNotDeclared = 'false';
  } else if (nextReleaseDateNotDeclared === 'true') {
    nextReleaseDate = '';
  }

  var updated = {
    id:        found.item.id,
    title:     data.title     !== undefined ? String(data.title)                                    : found.item.title,
    status:    nextStatus,
    rating:    data.rating    !== undefined ? String(data.rating)                                   : found.item.rating,
    notes:     data.notes     !== undefined ? String(data.notes)                                    : found.item.notes,
    image:     data.image     !== undefined ? String(data.image)                                    : found.item.image,
    droppedReason: nextDroppedReason,
    releaseDate: nextReleaseDate,
    releaseDateNotDeclared: nextReleaseDateNotDeclared,
    createdAt: found.item.createdAt
  };

  var targetSheet = getSheetForStatus_(updated.status, context.spreadsheet);

  if (found.sheet.getName() === targetSheet.getName()) {
    // Same sheet - update in place
    var currentFields = getFieldsForSheet_(found.sheet);
    found.sheet.getRange(found.rowIndex, 1, 1, currentFields.length)
      .setValues([objectToRow_(updated, found.sheet)]);
  } else {
    // Status changed (drag-drop) - move row to the correct sheet
    found.sheet.deleteRow(found.rowIndex);
    ensureHeaders_(targetSheet);
    targetSheet.appendRow(objectToRow_(updated, targetSheet));
  }

  return jsonResponse_({ success: true, status: 'ok', anime: updated });
}

function handleDelete_(data) {
  var id = String(data.id || '');
  if (!id) return jsonResponse_({ success: false, code: 'VALIDATION_ERROR', message: 'id is required.' });
  var context = getRequestContext_(data);

  var found = findRowById_(id, context.spreadsheet);
  if (!found) return jsonResponse_({ success: false, code: 'NOT_FOUND', message: 'Anime not found: ' + id });

  found.sheet.deleteRow(found.rowIndex);
  return jsonResponse_({ success: true, status: 'ok' });
}

function handleSetupUser_(data) {
  var userId = String(data.userId || '').trim();
  var username = String(data.username || '').trim();
  var password = String(data.password || '').trim();
  var providedSpreadsheetId = String(data.spreadsheetId || '').trim();
  var providedSheetUrl = String(data.sheetUrl || '').trim();

  if (!userId || !username || !password || (!providedSpreadsheetId && !providedSheetUrl)) {
    return jsonResponse_({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'userId, username, password, and sheetUrl or spreadsheetId are required.'
    });
  }

  var spreadsheetId = parseSpreadsheetId_(providedSpreadsheetId) || parseSpreadsheetId_(providedSheetUrl);
  if (!spreadsheetId) {
    return jsonResponse_({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid sheetUrl/spreadsheetId.' });
  }

  // Save the user to User Data FIRST so registration always succeeds,
  // even if the user's spreadsheet isn't shared/accessible yet.
  var userConfig = {
    userId: userId,
    username: username,
    password: password,
    sheetUrl: normalizeSheetUrl_(providedSheetUrl, spreadsheetId),
    spreadsheetId: spreadsheetId,
    language: String(data.language || 'en').trim() || 'en'
  };
  var saved = upsertUserData_(userConfig);

  // Best-effort: set up the status tabs in the user's sheet.
  // Failure here does NOT block the user registration.
  try {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    ensureStatusSheets_(spreadsheet);
  } catch (err) {
    Logger.log('Could not access spreadsheet ' + spreadsheetId + ': ' + err.message);
  }

  return jsonResponse_({ success: true, status: 'ok', user: saved });
}

function handleGetUser_(data) {
  var username = String(data.username || '').trim();
  var password = String(data.password || '').trim();
  if (!username || !password) {
    return jsonResponse_({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'username and password are required.'
    });
  }

  var user = findUserByCredentials_(username, password);
  if (!user) {
    return jsonResponse_({
      success: false,
      code: 'NOT_FOUND',
      message: 'User not found for provided credentials.',
      user: null
    });
  }

  if (!user.spreadsheetId) {
    user.spreadsheetId = parseSpreadsheetId_(user.sheetUrl) || '';
  }
  if (!user.sheetUrl && user.spreadsheetId) {
    user.sheetUrl = normalizeSheetUrl_('', user.spreadsheetId);
  }
  if (!user.language) {
    user.language = 'en';
  }

  return jsonResponse_({ success: true, status: 'ok', user: user });
}

function handleCheckSheet_(data) {
  var spreadsheetId = parseSpreadsheetId_(String(data.spreadsheetId || ''))
    || parseSpreadsheetId_(String(data.sheetUrl || ''));
  if (!spreadsheetId) {
    return jsonResponse_({ success: false, code: 'VALIDATION_ERROR', message: 'spreadsheetId or sheetUrl is required.' });
  }
  try {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    // Probe for editor access: setting the name to itself is a no-op write
    // that succeeds only when the script has editor permission on the sheet.
    spreadsheet.setName(spreadsheet.getName());
    return jsonResponse_({ success: true, status: 'ok', spreadsheetId: spreadsheetId });
  } catch (err) {
    return jsonResponse_({
      success: false,
      code: 'ACCESS_DENIED',
      message: 'Sheet is not accessible with edit access. Please share it as "Anyone with the link" with Editor access.'
    });
  }
}

// --- SHEET HELPERS ------------------------------------------------------------
function getAllAnime_(requestData) {
  var context = getRequestContext_(requestData);
  var sheetNames = [
    APP_CONFIG.SHEETS.WATCHING,
    APP_CONFIG.SHEETS.COMPLETED,
    APP_CONFIG.SHEETS.PLAN,
    APP_CONFIG.SHEETS.COMING_SOON,
    APP_CONFIG.SHEETS.DROPPED
  ];
  var results = [];
  for (var i = 0; i < sheetNames.length; i++) {
    var sheet = getOrCreateSheet_(sheetNames[i], context.spreadsheet);
    results = results.concat(sheetRowsToObjects_(sheet));
  }

  var legacyUpcomingName = APP_CONFIG.SHEETS.LEGACY_UPCOMING;
  if (legacyUpcomingName && sheetNames.indexOf(legacyUpcomingName) === -1) {
    var legacyUpcomingSheet = context.spreadsheet.getSheetByName(legacyUpcomingName);
    if (legacyUpcomingSheet) {
      results = results.concat(sheetRowsToObjects_(legacyUpcomingSheet));
    }
  }

  return results;
}

function getSheetForStatus_(status, spreadsheet) {
  if (status === 'completed') return getOrCreateSheet_(APP_CONFIG.SHEETS.COMPLETED, spreadsheet);
  if (status === 'plan')      return getOrCreateSheet_(APP_CONFIG.SHEETS.PLAN, spreadsheet);
  if (status === 'coming-soon' || status === 'upcoming') return getOrCreateSheet_(APP_CONFIG.SHEETS.COMING_SOON, spreadsheet);
  if (status === 'dropped')   return getOrCreateSheet_(APP_CONFIG.SHEETS.DROPPED, spreadsheet);
  return                             getOrCreateSheet_(APP_CONFIG.SHEETS.WATCHING, spreadsheet);
}

function findRowById_(id, spreadsheet) {
  var sheetNames = [
    APP_CONFIG.SHEETS.WATCHING,
    APP_CONFIG.SHEETS.COMPLETED,
    APP_CONFIG.SHEETS.PLAN,
    APP_CONFIG.SHEETS.COMING_SOON,
    APP_CONFIG.SHEETS.DROPPED
  ];
  var legacyUpcomingName = APP_CONFIG.SHEETS.LEGACY_UPCOMING;
  if (legacyUpcomingName && sheetNames.indexOf(legacyUpcomingName) === -1) {
    var legacyUpcomingSheet = spreadsheet.getSheetByName(legacyUpcomingName);
    if (legacyUpcomingSheet) {
      sheetNames.push(legacyUpcomingName);
    }
  }

  for (var s = 0; s < sheetNames.length; s++) {
    var sheet  = getOrCreateSheet_(sheetNames[s], spreadsheet);
    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) continue;
    var headerMap = headerIndexMap_(values[0]);
    var idCol = headerMap['id'];
    if (idCol === undefined) continue;
    for (var r = 1; r < values.length; r++) {
      if (String(values[r][idCol]) === String(id)) {
        return { sheet: sheet, rowIndex: r + 1, item: rowToObject_(values[r], headerMap) };
      }
    }
  }
  return null;
}

function getOrCreateSheet_(name, spreadsheet) {
  spreadsheet = spreadsheet || SpreadsheetApp.openById(APP_CONFIG.SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  return sheet;
}

function getRequestContext_(requestData) {
  var spreadsheetId = resolveSpreadsheetId_(requestData);
  if (!spreadsheetId) {
    throw new Error('spreadsheetId or sheetUrl is required.');
  }
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  ensureStatusSheets_(spreadsheet);
  return {
    spreadsheetId: spreadsheetId,
    spreadsheet: spreadsheet
  };
}

function ensureStatusSheets_(spreadsheet) {
  var statuses = [
    APP_CONFIG.SHEETS.WATCHING,
    APP_CONFIG.SHEETS.COMPLETED,
    APP_CONFIG.SHEETS.PLAN,
    APP_CONFIG.SHEETS.COMING_SOON,
    APP_CONFIG.SHEETS.DROPPED
  ];
  for (var i = 0; i < statuses.length; i++) {
    ensureHeaders_(getOrCreateSheet_(statuses[i], spreadsheet));
  }
}

// --- USER DATA HELPERS --------------------------------------------------------
function getUserDataSheet_() {
  var adminSpreadsheet = SpreadsheetApp.openById(USER_DATA_CONFIG.SPREADSHEET_ID);
  var sheet = adminSpreadsheet.getSheetByName(USER_DATA_CONFIG.SHEET_NAME);
  if (!sheet) sheet = adminSpreadsheet.insertSheet(USER_DATA_CONFIG.SHEET_NAME);
  ensureUserDataHeaders_(sheet);
  return sheet;
}

function ensureUserDataHeaders_(sheet) {
  var fields = USER_DATA_CONFIG.FIELDS;
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(fields);
    sheet.getRange(1, 1, 1, fields.length).setFontWeight('bold');
    return;
  }
  var lastCol = Math.max(sheet.getLastColumn(), fields.length);
  var existingRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (!headersMatch_(existingRow, fields)) {
    sheet.getRange(1, 1, 1, fields.length).setValues([fields]).setFontWeight('bold');
  }
}

function upsertUserData_(userConfig) {
  var sheet = getUserDataSheet_();
  var values = sheet.getDataRange().getValues();
  var nowIso = new Date().toISOString();
  var fields = USER_DATA_CONFIG.FIELDS;
  var rowData = {
    userId: userConfig.userId,
    username: userConfig.username,
    password: userConfig.password,
    sheetUrl: userConfig.sheetUrl,
    spreadsheetId: userConfig.spreadsheetId,
    language: userConfig.language || 'en',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  if (values.length > 1) {
    var headerMap = headerIndexMap_(values[0]);
    var userIdCol = headerMap.userId;
    var createdAtCol = headerMap.createdAt;
    if (userIdCol !== undefined) {
      for (var r = 1; r < values.length; r++) {
        if (String(values[r][userIdCol] || '') === String(userConfig.userId)) {
          rowData.createdAt = createdAtCol !== undefined && values[r][createdAtCol]
            ? normalizeCreatedAt_(values[r][createdAtCol])
            : nowIso;
          sheet.getRange(r + 1, 1, 1, fields.length).setValues([objectToNamedFieldsRow_(rowData, fields)]);
          return rowData;
        }
      }
    }
  }

  sheet.appendRow(objectToNamedFieldsRow_(rowData, fields));
  return rowData;
}

function findUserByCredentials_(username, password) {
  var sheet = getUserDataSheetForRead_();
  if (!sheet) return null;

  var values = sheet.getDataRange().getValues();
  if (!values || values.length <= 1) return null;

  var headerMap = headerIndexMap_(values[0]);
  var usernameCol = headerMap.username;
  var passwordCol = headerMap.password;
  if (usernameCol === undefined || passwordCol === undefined) return null;

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (isEmptyRow_(row)) continue;
    var storedUsername = String(row[usernameCol] || '').trim();
    var storedPassword = String(row[passwordCol] || '').trim();
    if (storedUsername === username && storedPassword === password) {
      var user = rowToNamedFieldsObject_(row, USER_DATA_CONFIG.FIELDS, headerMap);

      // Backward compatibility: recover spreadsheetId from old/shifted rows when possible.
      if (!user.spreadsheetId) {
        user.spreadsheetId = parseSpreadsheetId_(user.sheetUrl)
          || parseSpreadsheetId_(user.createdAt)
          || '';
      }
      if (!user.sheetUrl && user.spreadsheetId) {
        user.sheetUrl = normalizeSheetUrl_('', user.spreadsheetId);
      }
      if (!user.language) {
        user.language = 'en';
      }
      return user;
    }
  }

  return null;
}

function getUserDataSheetForRead_() {
  var adminSpreadsheet = SpreadsheetApp.openById(USER_DATA_CONFIG.SPREADSHEET_ID);
  return adminSpreadsheet.getSheetByName(USER_DATA_CONFIG.SHEET_NAME);
}

// --- HEADER MANAGEMENT -------------------------------------------------------
// Headers are derived per tab so only relevant fields appear in each sheet.
function ensureHeaders_(sheet) {
  var fields = getFieldsForSheet_(sheet);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(fields);
    sheet.getRange(1, 1, 1, fields.length).setFontWeight('bold');
    return;
  }
  var lastCol     = Math.max(sheet.getLastColumn(), fields.length);
  var existingRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (!headersMatch_(existingRow, fields)) {
    sheet.getRange(1, 1, 1, fields.length).setValues([fields]).setFontWeight('bold');
    if (lastCol > fields.length) {
      sheet.getRange(1, fields.length + 1, 1, lastCol - fields.length).clearContent();
    }
  }
}

function headersMatch_(existing, expected) {
  for (var i = 0; i < expected.length; i++) {
    if (String(existing[i] || '').trim() !== expected[i]) return false;
  }
  return true;
}

// --- ROW / OBJECT CONVERSION -------------------------------------------------
function sheetRowsToObjects_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (!values || values.length <= 1) return [];
  var headerMap = headerIndexMap_(values[0]);
  var items = [];
  for (var i = 1; i < values.length; i++) {
    if (!isEmptyRow_(values[i])) items.push(rowToObject_(values[i], headerMap));
  }
  return items;
}

function rowToObject_(row, headerMap) {
  var item   = {};
  var fields = APP_CONFIG.ALL_FIELDS;
  for (var i = 0; i < fields.length; i++) {
    var field  = fields[i];
    var colIdx = headerMap[field];
    var val    = colIdx !== undefined ? row[colIdx] : '';
    item[field] = field === 'createdAt'
      ? normalizeCreatedAt_(val)
      : String(val === null || val === undefined ? '' : val);
  }
  return item;
}

function rowToNamedFieldsObject_(row, fields, headerMap) {
  var item = {};
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var colIdx = headerMap[field];
    var val = colIdx !== undefined ? row[colIdx] : '';
    item[field] = (field === 'createdAt' || field === 'updatedAt')
      ? normalizeCreatedAt_(val)
      : String(val === null || val === undefined ? '' : val);
  }
  return item;
}

function objectToRow_(item, sheetOrName) {
  var fields = getFieldsForSheet_(sheetOrName);
  var row = [];
  for (var i = 0; i < fields.length; i++) {
    var v = item[fields[i]];
    row.push(v !== undefined && v !== null ? v : '');
  }
  return row;
}

function headerIndexMap_(headers) {
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i] || '').trim();
    if (key) map[key] = i;
  }
  return map;
}

// --- NORMALIZERS -------------------------------------------------------------
function normalizeStatus_(status) {
  var v = String(status || '').toLowerCase().trim();
  if (!v) return '';
  if (['completed', 'complete', 'watched'].indexOf(v) !== -1)                  return 'completed';
  if (['watching', 'current', 'in-progress', 'in progress'].indexOf(v) !== -1) return 'watching';
  if (['plan', 'planned', 'plan to watch', 'unwatched'].indexOf(v) !== -1)     return 'plan';
  if (['coming-soon', 'coming soon', 'upcoming', 'not yet aired', 'unreleased'].indexOf(v) !== -1) return 'coming-soon';
  if (['dropped', 'droped', 'on hold', 'on-hold'].indexOf(v) !== -1) return 'dropped';
  return v;
}

function normalizeBooleanFlag_(value) {
  if (value === true) return 'true';
  var normalized = String(value || '').trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
    ? 'true'
    : 'false';
}

function normalizeCreatedAt_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return value.toISOString();
  }
  var parsed = new Date(value);
  return isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

// --- UTILITIES ----------------------------------------------------------------
function parseRequestBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    throw new Error('Invalid JSON request body.');
  }
}

function isEmptyRow_(row) {
  for (var i = 0; i < row.length; i++) {
    if (String(row[i] || '').trim() !== '') return false;
  }
  return true;
}

function parseQueryParams_(e) {
  return (e && e.parameter) ? e.parameter : {};
}

function resolveSpreadsheetId_(data) {
  data = data || {};
  var explicitId = parseSpreadsheetId_(data.spreadsheetId);
  if (explicitId) return explicitId;
  return parseSpreadsheetId_(data.sheetUrl) || '';
}

function parseSpreadsheetId_(value) {
  var input = String(value || '').trim();
  if (!input) return '';
  if (/^[a-zA-Z0-9-_]{20,}$/.test(input)) return input;
  var match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match && match[1] ? match[1] : '';
}

function normalizeSheetUrl_(sheetUrl, spreadsheetId) {
  var parsedId = parseSpreadsheetId_(sheetUrl);
  var finalId = parsedId || String(spreadsheetId || '').trim();
  return finalId ? ('https://docs.google.com/spreadsheets/d/' + finalId) : '';
}

function objectToNamedFieldsRow_(item, fields) {
  var row = [];
  for (var i = 0; i < fields.length; i++) {
    var v = item[fields[i]];
    row.push(v !== undefined && v !== null ? v : '');
  }
  return row;
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse_(code, error) {
  return jsonResponse_({
    success: false,
    status:  'error',
    code:    code,
    message: error && error.message ? error.message : 'Unknown error'
  });
}
