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

/** Type-safe accessor for Vite env vars (avoids ImportMeta.env type issues in some TS configs). */
function getEnv(key: string): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (import.meta as any).env as Record<string, string | undefined> | undefined;
  return env?.[key];
}

/** Standaard placeholder – vervang na Apps Script setup in /#/usage instellingen */
export const PLACEHOLDER_URL = 'PLACEHOLDER';

/**
 * Geeft aan of de Apps Script URL ingebakken is in de build via env var.
 * Handig voor de admin UI om te tonen dat de koppeling al geconfigureerd is.
 */
export function isConfigFromEnv(): boolean {
  return !!getEnv('VITE_APPS_SCRIPT_URL');
}

/**
 * Prioriteit: localStorage (docent-override) > env var (build-default) > leeg.
 */
export function getScriptUrl(): string {
  return localStorage.getItem(SCRIPT_URL_KEY)
    || getEnv('VITE_APPS_SCRIPT_URL')
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
  const fromEnv = getEnv('VITE_API_KEY');
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

  return await response.json() as DriveRow[];
}
