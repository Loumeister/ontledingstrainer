/**
 * Zinsontledingstrainer – Google Apps Script Web App
 *
 * Sla dit bestand op in een nieuw Google Apps Script project dat gekoppeld is
 * aan een Google Sheet. Zie docs/google-drive-koppeling.md voor stap-voor-stap
 * setup-instructies.
 *
 * Deploy als:
 *   Uitvoeren als: Ik (jouw Google-account)
 *   Wie heeft toegang: Iedereen
 *
 * Stel de API-sleutel in via:
 *   Projectinstellingen → Scripteigenschappen → API_KEY = <jouw sleutel>
 *
 * Endpoints (alles via GET):
 *   ?action=submit&naam=...&initiaal=...&klas=...&code=...&apiKey=...
 *   ?action=read&apiKey=...
 *   ?action=ping  (geen auth vereist, voor connectiviteitstest)
 */

/** Naam van het spreadsheet-tabblad waar data wordt opgeslagen */
var SHEET_NAME = 'Resultaten';

/** Kolomvolgorde in de sheet */
var COLUMNS = ['Tijdstip', 'Voornaam', 'Initiaal', 'Klas', 'Rapportcode'];

function doGet(e) {
  var params = e.parameter || {};
  var action = params.action || 'read';

  // Ping – geen authenticatie vereist
  if (action === 'ping') {
    return jsonResponse({ ok: true, msg: 'Zinsontledingstrainer API actief' });
  }

  // Verificeer API-sleutel voor alle andere acties
  var expectedKey = PropertiesService.getScriptProperties().getProperty('API_KEY') || '';
  if (expectedKey && params.apiKey !== expectedKey) {
    return jsonResponse({ ok: false, error: 'Ongeautoriseerd: ongeldige API-sleutel' });
  }

  if (action === 'submit') {
    return handleSubmit(params);
  }

  // Standaard: lees alle rijen
  return handleRead();
}

function handleSubmit(params) {
  var naam = (params.naam || '').trim();
  var initiaal = (params.initiaal || '').trim().toUpperCase().slice(0, 1);
  var klas = (params.klas || '').trim().toLowerCase();
  var code = (params.code || '').trim();

  if (!naam || !initiaal || !klas || !code) {
    return jsonResponse({ ok: false, error: 'Ontbrekende velden: naam, initiaal, klas en code zijn verplicht' });
  }

  if (!code.startsWith('v1:')) {
    return jsonResponse({ ok: false, error: 'Ongeldige rapportcode (moet beginnen met v1:)' });
  }

  var sheet = getOrCreateSheet();
  sheet.appendRow([
    new Date().toISOString(),
    naam,
    initiaal,
    klas,
    code
  ]);

  return jsonResponse({ ok: true });
}

function handleRead() {
  var sheet = getOrCreateSheet();
  var range = sheet.getDataRange();
  var values = range.getValues();

  // Sla de koptekstrij over (eerste rij)
  if (values.length <= 1) {
    return jsonResponse([]);
  }

  var rows = values.slice(1).map(function(row) {
    return {
      ts: row[0] instanceof Date ? row[0].toISOString() : String(row[0]),
      naam: String(row[1] || ''),
      initiaal: String(row[2] || ''),
      klas: String(row[3] || ''),
      code: String(row[4] || '')
    };
  }).filter(function(row) {
    return row.code.startsWith('v1:');
  });

  return jsonResponse(rows);
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS);
    sheet.setFrozenRows(1);
    // Maak de koptekstrij vet
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
  }
  return sheet;
}

function jsonResponse(data) {
  var json = JSON.stringify(data);
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
