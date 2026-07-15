const APP_CONFIG = Object.freeze({
  APP_NAME: 'INHOMESSS Home Visit API',
  VERSION: '1.0.0',
  TIMEZONE: 'Asia/Bangkok',
  DEFAULT_ENVIRONMENT: 'development',
});

function getRuntimeConfig_() {
  const properties = PropertiesService.getScriptProperties();
  return {
    appName: APP_CONFIG.APP_NAME,
    version: APP_CONFIG.VERSION,
    environment: properties.getProperty('APP_ENV') || APP_CONFIG.DEFAULT_ENVIRONMENT,
    spreadsheetId: properties.getProperty('SPREADSHEET_ID') || '',
    driveFolderId: properties.getProperty('DRIVE_FOLDER_ID') || '',
  };
}
