var APP_CONFIG = {
  SHEETS: { WATCHING: 'watching', COMPLETED: 'completed', PLAN: 'plan' },
  HEADERS: ['id', 'title', 'status', 'rating', 'notes', 'image', 'createdAt'],
  SHARED_SECRET: 'REPLACE_WITH_SHARED_SECRET'
};

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
    if (!isSecretValid_(data.secret)) {
      return jsonResponse_({ success: false, code: 'UNAUTHORIZED', message: 'Missing or invalid secret.' });
    }
    var action = String(data.action || 'add').toLowerCase();
    if (action === 'add')    return handleAdd_(data);
    if (action === 'update') return handleUpdate_(data);
    if (action === 'delete') return handleDelete_(data);
    return jsonResponse_({ success: false, code: 'INVALID_ACTION', message: 'Unknown action: ' + action });
  } catch (error) {
    return errorResponse_('INTERNAL_ERROR', error);
  }
}

function handleAdd_(data) {
  var title = String(data.title || '').trim();
  if (!title) return jsonResponse_({ success: false, code: 'VALIDATION_ERROR', message: 'title is required.' });
  var anime = {
    id: String(data.id || new Date().getTime()),
    title: title,
    status: normalizeStatus_(data.status) || 'watching',
    rating: String(data.rating || ''),
    notes: String(data.notes || ''),
    image: String(data.image || ''),
    createdAt: data.createdAt || new Date().toISOString()
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
  var updated = {
    id: found.item.id,
    title: data.title !== undefined ? String(data.title) : found.item.title,
    status: data.status !== undefined ? (normalizeStatus_(data.status) || found.item.status) : found.item.status,
    rating: data.rating !== undefined ? String(data.rating) : found.item.rating,
    notes: data.notes !== undefined ? String(data.notes) : found.item.notes,
    image: data.image !== undefined ? String(data.image) : found.item.image,
    createdAt: found.item.createdAt
  };
  var newSheet = getSheetForStatus_(updated.status);
  if (found.sheet.getName() === newSheet.getName()) {
    found.sheet.getRange(found.rowIndex, 1, 1, APP_CONFIG.HEADERS.length).setValues([objectToRow_(updated)]);
  } else {
    found.sheet.deleteRow(found.rowIndex);
    ensureHeaders_(newSheet);
    newSheet.appendRow(objectToRow_(updated));
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

function getAllAnime_() {
  var sheetNames = [APP_CONFIG.SHEETS.WATCHING, APP_CONFIG.SHEETS.COMPLETED, APP_CONFIG.SHEETS.PLAN];
  var results = [];
  for (var i = 0; i < sheetNames.length; i++) {
    var sheet = getOrCreateSheet_(sheetNames[i]);
    ensureHeaders_(sheet);
    results = results.concat(sheetRowsToObjects_(sheet));
  }
  return results;
}

function getSheetForStatus_(status) {
  if (status === 'completed') return getOrCreateSheet_(APP_CONFIG.SHEETS.COMPLETED);
  if (status === 'plan')      return getOrCreateSheet_(APP_CONFIG.SHEETS.PLAN);
  return getOrCreateSheet_(APP_CONFIG.SHEETS.WATCHING);
}

function findRowById_(id) {
  var sheetNames = [APP_CONFIG.SHEETS.WATCHING, APP_CONFIG.SHEETS.COMPLETED, APP_CONFIG.SHEETS.PLAN];
  for (var s = 0; s < sheetNames.length; s++) {
    var sheet = getOrCreateSheet_(sheetNames[s]);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) continue;
    var headerMap = headerIndexMap_(data[0]);
    var idCol = headerMap['id'];
    if (idCol === undefined) continue;
    for (var r = 1; r < data.length; r++) {
      if (String(data[r][idCol]) === String(id)) {
        return { sheet: sheet, rowIndex: r + 1, item: rowToObject_(data[r], headerMap) };
      }
    }
  }
  return null;
}

function parseRequestBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try { return JSON.parse(e.postData.contents); } catch (err) { throw new Error('Invalid JSON request body.'); }
}



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
  var item = {};
  for (var i = 0; i < APP_CONFIG.HEADERS.length; i++) {
    var field = APP_CONFIG.HEADERS[i];
    var colIdx = headerMap[field];
    var val = colIdx !== undefined ? row[colIdx] : '';
    item[field] = field === 'createdAt' ? normalizeCreatedAt_(val) : String(val === null || val === undefined ? '' : val);
  }
  return item;
}

function objectToRow_(item) {
  var row = [];
  for (var i = 0; i < APP_CONFIG.HEADERS.length; i++) {
    var field = APP_CONFIG.HEADERS[i];
    row.push(item[field] !== undefined && item[field] !== null ? item[field] : '');
  }
  return row;
}

function normalizeStatus_(status) {
  var value = String(status || '').toLowerCase().trim();
  if (!value) return '';
  if (['completed', 'complete', 'watched'].indexOf(value) !== -1) return 'completed';

  if (['watching', 'current', 'in-progress', 'in progress'].indexOf(value) !== -1) return 'watching';
  if (['plan', 'planned', 'plan to watch', 'unwatched'].indexOf(value) !== -1) return 'plan';
  return '';
}

function normalizeCreatedAt_(value) {
  if (!value) {
    return '';
  }

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return value.toISOString();
  }

  var parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    return String(value);
  }
  return parsed.toISOString();
}

function headerIndexMap_(headers) {
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i] || '').trim();
    if (key) {
      map[key] = i;
    }
  }
  return map;
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(APP_CONFIG.HEADERS);
    return;
  }

  var lastColumn = Math.max(sheet.getLastColumn(), APP_CONFIG.HEADERS.length);
  var existingHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  if (!headersMatch_(existingHeaders, APP_CONFIG.HEADERS)) {
    sheet.getRange(1, 1, 1, APP_CONFIG.HEADERS.length).setValues([APP_CONFIG.HEADERS]);
  }
}

function headersMatch_(existingHeaders, expectedHeaders) {
  for (var i = 0; i < expectedHeaders.length; i++) {
    if (String(existingHeaders[i] || '').trim() !== expectedHeaders[i]) {
      return false;
    }
  }
  return true;
}

function getOrCreateSheet_(name) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('No active spreadsheet. Bind this script to a spreadsheet.');
  }

  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }
  return sheet;
}

function isEmptyRow_(row) {
  for (var i = 0; i < row.length; i++) {
    if (String(row[i] || '').trim() !== '') {
      return false;
    }
  }
  return true;
}

function isSecretValid_(secret) {
  return !!secret && String(secret) === APP_CONFIG.SHARED_SECRET;
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse_(code, error) {
  return jsonResponse_({
    success: false,
    status: 'error',
    code: code,
    message: error && error.message ? error.message : 'Unknown error'
  });
}
