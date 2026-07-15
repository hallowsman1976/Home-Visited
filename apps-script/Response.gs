function successResponse_(data, requestId) {
  return jsonOutput_({
    ok: true,
    requestId: requestId || Utilities.getUuid(),
    data: data,
    error: null,
    meta: responseMeta_(),
  });
}

function errorResponse_(code, message, requestId, fieldErrors) {
  return jsonOutput_({
    ok: false,
    requestId: requestId || Utilities.getUuid(),
    data: null,
    error: { code: code, message: message, fieldErrors: fieldErrors || {} },
    meta: responseMeta_(),
  });
}

function jsonOutput_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function responseMeta_() {
  const config = getRuntimeConfig_();
  return {
    timestamp: Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    environment: config.environment,
    version: config.version,
  };
}

