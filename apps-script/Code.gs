/** Retirement-only deployment. Preserve the Sheet, disable the legacy Web App.
 * No API key, GET/POST data access or compatibility fallback remains.
 * Existing published versions must also be archived in Google Apps Script.
 */
function doGet() { return retired(); }
function doPost() { return retired(); }
function retired() {
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Dienst ingetrokken.' }))
    .setMimeType(ContentService.MimeType.JSON);
}
