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
    UPCOMING:  _props.SHEET_UPCOMING  || 'upcoming'
  },
  FIELDS: ['id', 'title', 'status', 'rating', 'notes', 'image', 'createdAt']
};

// Run this function ONCE from the Apps Script editor to store your config
// in Script Properties (equivalent of writing to a .env file).
function setupProperties() {
  PropertiesService.getScriptProperties().setProperties({
    SPREADSHEET_ID: '1M5h2vyTr3eZmFxTLmW9XoJ-YOOaTexMfhVEaUH_G68M',
    SHEET_WATCHING:  'watching',
    SHEET_COMPLETED: 'completed',
    SHEET_PLAN:      'plan',
    SHEET_UPCOMING:  'upcoming'
  });
  Logger.log('Script properties saved.');
}

// --- HTTP HANDLERS ------------------------------------------------------------
function doGet(e) {
  try {
    var anime = getAllAnime_();
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
    return jsonResponse_({ success: false, code: 'INVALID_ACTION', message: 'Unknown action: ' + action });
  } catch (error) {
    return errorResponse_('INTERNAL_ERROR', error);
  }
}

// --- ACTION HANDLERS ---------------------------------------------------------
function handleAdd_(data) {
  var title = String(data.title || '').trim();
  if (!title) return jsonResponse_({ success: false, code: 'VALIDATION_ERROR', message: 'title is required.' });

  var status = normalizeStatus_(data.status) || 'watching';
  var anime = {
    id:        String(data.id || Utilities.getUuid()),
    title:     title,
    status:    status,
    rating:    String(data.rating  || ''),
    notes:     String(data.notes   || ''),
    image:     String(data.image   || ''),
    createdAt: String(data.createdAt || new Date().toISOString())
  };

  var sheet = getSheetForStatus_(anime.status);
  ensureHeaders_(sheet);
  sheet.appendRow(objectToRow_(anime));
  return jsonResponse_({ success: true, status: 'ok', anime: anime });
}

function handleUpdate_(data) {
  var id = String(data.id || '');
  if (!id) return jsonResponse_({ success: false, code: 'VALIDATION_ERROR', message: 'id is required.' });

  var found = findRowById_(id);
  if (!found) return jsonResponse_({ success: false, code: 'NOT_FOUND', message: 'Anime not found: ' + id });

  // Merge incoming fields onto existing row � every field is optional
  var updated = {
    id:        found.item.id,
    title:     data.title     !== undefined ? String(data.title)                                    : found.item.title,
    status:    data.status    !== undefined ? (normalizeStatus_(data.status) || found.item.status)  : found.item.status,
    rating:    data.rating    !== undefined ? String(data.rating)                                   : found.item.rating,
    notes:     data.notes     !== undefined ? String(data.notes)                                    : found.item.notes,
    image:     data.image     !== undefined ? String(data.image)                                    : found.item.image,
    createdAt: found.item.createdAt
  };

  var targetSheet = getSheetForStatus_(updated.status);

  if (found.sheet.getName() === targetSheet.getName()) {
    // Same sheet � update in place
    found.sheet.getRange(found.rowIndex, 1, 1, APP_CONFIG.FIELDS.length)
      .setValues([objectToRow_(updated)]);
  } else {
    // Status changed (drag-drop) � move row to the correct sheet
    found.sheet.deleteRow(found.rowIndex);
    ensureHeaders_(targetSheet);
    targetSheet.appendRow(objectToRow_(updated));
  }

  return jsonResponse_({ success: true, status: 'ok', anime: updated });
}

function handleDelete_(data) {
  var id = String(data.id || '');
  if (!id) return jsonResponse_({ success: false, code: 'VALIDATION_ERROR', message: 'id is required.' });

  var found = findRowById_(id);
  if (!found) return jsonResponse_({ success: false, code: 'NOT_FOUND', message: 'Anime not found: ' + id });

  found.sheet.deleteRow(found.rowIndex);
  return jsonResponse_({ success: true, status: 'ok' });
}

// --- SHEET HELPERS ------------------------------------------------------------
function getAllAnime_() {
  var sheetNames = [APP_CONFIG.SHEETS.WATCHING, APP_CONFIG.SHEETS.COMPLETED, APP_CONFIG.SHEETS.PLAN, APP_CONFIG.SHEETS.UPCOMING];
  var results = [];
  for (var i = 0; i < sheetNames.length; i++) {
    var sheet = getOrCreateSheet_(sheetNames[i]);
    results = results.concat(sheetRowsToObjects_(sheet));
  }
  return results;
}

function getSheetForStatus_(status) {
  if (status === 'completed') return getOrCreateSheet_(APP_CONFIG.SHEETS.COMPLETED);
  if (status === 'plan')      return getOrCreateSheet_(APP_CONFIG.SHEETS.PLAN);
  if (status === 'upcoming')  return getOrCreateSheet_(APP_CONFIG.SHEETS.UPCOMING);
  return                             getOrCreateSheet_(APP_CONFIG.SHEETS.WATCHING);
}

function findRowById_(id) {
  var sheetNames = [APP_CONFIG.SHEETS.WATCHING, APP_CONFIG.SHEETS.COMPLETED, APP_CONFIG.SHEETS.PLAN, APP_CONFIG.SHEETS.UPCOMING];
  for (var s = 0; s < sheetNames.length; s++) {
    var sheet  = getOrCreateSheet_(sheetNames[s]);
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

function getOrCreateSheet_(name) {
  var spreadsheet = SpreadsheetApp.openById(APP_CONFIG.SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  return sheet;
}

// --- HEADER MANAGEMENT -------------------------------------------------------
// Headers are derived dynamically from APP_CONFIG.FIELDS so adding a form
// field just requires updating the FIELDS array above.
function ensureHeaders_(sheet) {
  var fields = APP_CONFIG.FIELDS;
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(fields);
    sheet.getRange(1, 1, 1, fields.length).setFontWeight('bold');
    return;
  }
  var lastCol     = Math.max(sheet.getLastColumn(), fields.length);
  var existingRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (!headersMatch_(existingRow, fields)) {
    sheet.getRange(1, 1, 1, fields.length).setValues([fields]).setFontWeight('bold');
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
  var fields = APP_CONFIG.FIELDS;
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

function objectToRow_(item) {
  var fields = APP_CONFIG.FIELDS;
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
  if (['upcoming', 'coming soon', 'not yet aired', 'unreleased'].indexOf(v) !== -1) return 'upcoming';
  return v;
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
