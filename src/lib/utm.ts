/* ═══════════════════════════════════════════════
   UTM — captura e persiste parâmetros de campanha
   ═══════════════════════════════════════════════ */

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
] as const;

const STORAGE_KEY = "utm_params";

export type UtmData = Partial<Record<(typeof UTM_KEYS)[number], string>>;

/**
 * Reads UTM params from the current URL and saves them to sessionStorage.
 * Only overwrites if the URL actually contains at least one UTM param
 * (so navigating between internal pages doesn't erase the original UTMs).
 */
export function captureUtms(): void {
  const params = new URLSearchParams(window.location.search);
  const found: UtmData = {};
  let hasAny = false;

  for (const key of UTM_KEYS) {
    const val = params.get(key);
    if (val) {
      found[key] = val;
      hasAny = true;
    }
  }

  if (hasAny) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(found));
  }
}

/**
 * Returns the stored UTM data (or empty object if none).
 */
export function getUtms(): UtmData {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
