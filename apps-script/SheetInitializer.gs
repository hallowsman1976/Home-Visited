function initializeSystem() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const config = getRuntimeConfig_();
    if (!config.spreadsheetId) throw new Error('กรุณากำหนด SPREADSHEET_ID ใน Script Properties');
    const spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
    const summary = [];
    Object.keys(SHEET_SCHEMAS).forEach(function (sheetName) {
      summary.push(ensureSheet_(spreadsheet, sheetName, getHeadersForSheet_(sheetName)));
    });
    seedSettings_(spreadsheet);
    seedLookups_(spreadsheet);
    console.log(JSON.stringify({ event: 'SYSTEM_INITIALIZED', spreadsheetId: config.spreadsheetId, sheets: summary.length }));
    return summary;
  } finally {
    lock.releaseLock();
  }
}

function ensureSheet_(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  const created = !sheet;
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);
  const existing = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0] : [];
  if (existing.filter(String).length && JSON.stringify(existing) !== JSON.stringify(headers)) {
    throw new Error('SCHEMA_CONFLICT ที่ Sheet ' + sheetName + ': ห้ามเขียนทับ header เดิม');
  }
  if (!existing.filter(String).length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
    sheet.autoResizeColumns(1, headers.length);
    sheet.getRange('A:ZZ').setNumberFormat('@');
  }
  return { sheetName: sheetName, created: created, columns: headers.length };
}

function seedSettings_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName('SETTINGS');
  if (sheet.getLastRow() > 1) return;
  const now = new Date().toISOString();
  const rows = [
    ['APP_NAME','INHOMESSS Home Visit','STRING','ALL','ชื่อระบบ',false],
    ['TIMEZONE','Asia/Bangkok','STRING','ALL','เขตเวลาระบบ',false],
    ['ASSESSMENT_DISPLAY_NAME','INHOMESSS','STRING','ALL','ชื่อแบบประเมินที่แสดง',false],
    ['MAX_UPLOAD_MB','8','NUMBER','ALL','ขนาดไฟล์สูงสุดต่อไฟล์',false]
  ].map(function (row) { return row.concat([now,'SYSTEM',now,'SYSTEM',1,true]); });
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function seedLookups_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName('LOOKUPS');
  if (sheet.getLastRow() > 1) return;
  const now = new Date().toISOString();
  const domains = [
    ['I','Immobility'],['N','Nutrition'],['H','Housing'],['O','Other people'],['M','Medication'],
    ['E','Examination'],['S1','Safety'],['S2','Spiritual health'],['S3','Services']
  ];
  const rows = domains.map(function (item, index) {
    return [Utilities.getUuid(),'INHOMESSS_DOMAIN',item[0],item[1],item[1],index + 1,'{}',now,'SYSTEM',now,'SYSTEM',1,true];
  });
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function validateSystemSchema() {
  const config = getRuntimeConfig_();
  if (!config.spreadsheetId) throw new Error('SPREADSHEET_ID_NOT_CONFIGURED');
  const spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
  return Object.keys(SHEET_SCHEMAS).map(function (sheetName) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) return { sheetName: sheetName, ok: false, reason: 'MISSING' };
    const expected = getHeadersForSheet_(sheetName);
    const actual = sheet.getRange(1, 1, 1, expected.length).getDisplayValues()[0];
    return { sheetName: sheetName, ok: JSON.stringify(expected) === JSON.stringify(actual), columns: expected.length };
  });
}

