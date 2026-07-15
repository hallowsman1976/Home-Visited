function getDataSheet_(sheetName) {
  const config = getRuntimeConfig_();
  if (!config.spreadsheetId) throw new Error('SPREADSHEET_ID_NOT_CONFIGURED');
  const sheet = SpreadsheetApp.openById(config.spreadsheetId).getSheetByName(sheetName);
  if (!sheet) throw new Error('SHEET_NOT_FOUND: ' + sheetName);
  return sheet;
}

function getHeaderMap_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  return headers.reduce(function (map, header, index) {
    if (header) map[header] = index;
    return map;
  }, {});
}

function rowToObject_(headers, row) {
  return headers.reduce(function (record, header, index) {
    if (header) record[header] = row[index];
    return record;
  }, {});
}

function findRecordByField_(sheetName, fieldName, normalizedValue) {
  const sheet = getDataSheet_(sheetName);
  if (sheet.getLastRow() < 2) return null;
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const index = headers.indexOf(fieldName);
  if (index === -1) throw new Error('COLUMN_NOT_FOUND: ' + fieldName);
  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (String(values[rowIndex][index]).trim().toLowerCase() === normalizedValue) {
      return { rowNumber: rowIndex + 1, record: rowToObject_(headers, values[rowIndex]), headers: headers };
    }
  }
  return null;
}

function appendRecord_(sheetName, record) {
  const sheet = getDataSheet_(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const row = headers.map(function (header) { return Object.prototype.hasOwnProperty.call(record, header) ? record[header] : ''; });
  sheet.appendRow(row);
  return record;
}

function updateRecordRow_(sheetName, rowNumber, changes) {
  const sheet = getDataSheet_(sheetName);
  const map = getHeaderMap_(sheet);
  Object.keys(changes).forEach(function (field) {
    if (map[field] === undefined) throw new Error('COLUMN_NOT_FOUND: ' + field);
    sheet.getRange(rowNumber, map[field] + 1).setValue(changes[field]);
  });
}

