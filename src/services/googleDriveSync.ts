/**
 * Google Drive Sync: verstuurt leerlingresultaten naar een Google Apps Script Web App
 * die de data opslaat in een Google Sheet (eigendom van de docent/eigenaar).
 *
 * Architectuur: alle requests gaan via HTTP GET naar de Apps Script URL
 * (Google Apps Script ondersteunt CORS voor GET-requests zonder problemen).
 *
 * Zie apps-script/Code.gs voor de bijbehorende Apps Script code.
 * Zie docs/google-drive-koppeling.md voor setup-instructies.
 */

const SCRIPT_URL_KEY = 'zinsontleding_apps_script_url';
const API_KEY_KEY = 'zinsontleding_api_key';

/** Standaard placeholder – vervang na Apps Script setup in /#/usage instellingen */
export const PLACEHOLDER_URL = 'PLACEHOLDER';

/**
 * Geeft aan of de Apps Script URL ingebakken is in de build via env var.
 * Handig voor de admin UI om te tonen dat de koppeling al geconfigureerd is.
 */
export function isConfigFromEnv(): boolean {
  return !!import.meta.env.VITE_APPS_SCRIPT_URL;
}

/**
 * Prioriteit: localStorage (docent-override) > env var (build-default) > leeg.
 */
export function getScriptUrl(): string {
  return localStorage.getItem(SCRIPT_URL_KEY)
    || import.meta.env.VITE_APPS_SCRIPT_URL
    || '';
}

export function setScriptUrl(url: string): void {
  localStorage.setItem(SCRIPT_URL_KEY, url.trim());
}

/**
 * Prioriteit: localStorage > env var > gegenereerde random UUID (oude gedrag).
 * Als VITE_API_KEY is ingesteld, worden alle gebruikers (leerlingen én docent)
 * automatisch gekoppeld aan de juiste Apps Script sleutel.
 */
export function getApiKey(): string {
  const stored = localStorage.getItem(API_KEY_KEY);
  if (stored) return stored;
  const fromEnv = import.meta.env.VITE_API_KEY;
  if (fromEnv) return fromEnv;
  const key = crypto.randomUUID();
  localStorage.setItem(API_KEY_KEY, key);
  return key;
}

export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_KEY, key.trim());
}

export interface DriveRow {
  ts: string;
  naam: string;
  initiaal: string;
  klas: string;
  code: string;
}

export function shouldAutoSendReport(
  student: { name: string; initiaal: string; klas: string },
  scriptUrl: string,
): boolean {
  return Boolean(
    student.name.trim() &&
    student.initiaal.trim() &&
    student.klas.trim() &&
    scriptUrl &&
    scriptUrl !== PLACEHOLDER_URL,
  );
}

/**
 * Verstuurt een rapport naar de Google Sheet.
 * Gebruikt een GET-request (omzeilt CORS-problemen met Apps Script voor POST).
 * Gooit een Error als de URL niet geconfigureerd is of het verzoek mislukt.
 */
export async function postReport(
  naam: string,
  initiaal: string,
  klas: string,
  code: string,
): Promise<void> {
  const scriptUrl = getScriptUrl();
  if (!scriptUrl || scriptUrl === PLACEHOLDER_URL) {
    throw new Error('Apps Script URL is nog niet ingesteld. Vraag de eigenaar om de koppeling in te stellen via /#/usage.');
  }

  const url = new URL(scriptUrl);
  url.searchParams.set('action', 'submit');
  url.searchParams.set('naam', naam);
  url.searchParams.set('initiaal', initiaal.toUpperCase());
  url.searchParams.set('klas', klas.toLowerCase().trim());
  url.searchParams.set('code', code);
  url.searchParams.set('apiKey', getApiKey());

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json() as { ok?: boolean; error?: string };
  if (!data.ok) {
    throw new Error(data.error ?? 'Onbekende fout van de server');
  }
}

/**
 * Hernoemt een klas in de Google Sheet (alle rijen met oldKlas worden bijgewerkt naar newKlas).
 * Geeft het aantal bijgewerkte rijen terug.
 */
export async function renameKlasOnDrive(oldKlas: string, newKlas: string): Promise<number> {
  const scriptUrl = getScriptUrl();
  if (!scriptUrl || scriptUrl === PLACEHOLDER_URL) {
    throw new Error('Apps Script URL is nog niet ingesteld.');
  }

  const url = new URL(scriptUrl);
  url.searchParams.set('action', 'renameKlas');
  url.searchParams.set('oldKlas', oldKlas.trim().toLowerCase());
  url.searchParams.set('newKlas', newKlas.trim().toLowerCase());
  url.searchParams.set('apiKey', getApiKey());

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json() as { ok?: boolean; updated?: number; error?: string };
  if (!data.ok) throw new Error(data.error ?? 'Onbekende fout van de server');
  return data.updated ?? 0;
}

/**
 * Hernoemt een leerling in de Google Sheet (alle rijen met oldName worden bijgewerkt naar newName).
 * Geeft het aantal bijgewerkte rijen terug.
 */
export async function renameStudentOnDrive(oldName: string, newName: string): Promise<number> {
  const scriptUrl = getScriptUrl();
  if (!scriptUrl || scriptUrl === PLACEHOLDER_URL) {
    throw new Error('Apps Script URL is nog niet ingesteld.');
  }

  const url = new URL(scriptUrl);
  url.searchParams.set('action', 'renameStudent');
  url.searchParams.set('oldName', oldName.trim());
  url.searchParams.set('newName', newName.trim());
  url.searchParams.set('apiKey', getApiKey());

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json() as { ok?: boolean; updated?: number; error?: string };
  if (!data.ok) throw new Error(data.error ?? 'Onbekende fout van de server');
  return data.updated ?? 0;
}

/**
 * Haalt alle rapportrijen op uit de Google Sheet.
 * Gooit een Error als de URL niet geconfigureerd is of het verzoek mislukt.
 */
export async function fetchReports(): Promise<DriveRow[]> {
  const scriptUrl = getScriptUrl();
  if (!scriptUrl || scriptUrl === PLACEHOLDER_URL) {
    throw new Error('Apps Script URL is nog niet ingesteld.');
  }

  const url = new URL(scriptUrl);
  url.searchParams.set('action', 'read');
  url.searchParams.set('apiKey', getApiKey());

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json() as DriveRow[] | { ok: false; error?: string };
  if (!Array.isArray(data)) {
    throw new Error(data.error ?? 'Onverwacht antwoord van de server (geen array)');
  }
  return data;
}
