declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
  }
}

const API_BASE = import.meta.env.VITE_API_BASE || "";

/* ── Cookie helpers (fbp / fbc for dedup) ── */
function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : undefined;
}

function getFbp(): string | undefined {
  return getCookie("_fbp");
}

function getFbc(): string | undefined {
  return getCookie("_fbc") || undefined;
}

/* ── Client-side Pixel ── */
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params);
  }
}

export function trackCustomEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", eventName, params);
  }
}

/* ── Server-side CAPI ── */
interface CAPIUserData {
  email?: string;
  phone?: string;
  firstName?: string;
}

export async function sendServerEvent(
  eventName: string,
  userData: CAPIUserData = {},
  customData: Record<string, unknown> = {},
) {
  try {
    await fetch(`${API_BASE}/api/fb-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        email: userData.email,
        phone: userData.phone,
        firstName: userData.firstName,
        customData,
        fbp: getFbp(),
        fbc: getFbc(),
        sourceUrl: window.location.href,
      }),
    });
  } catch (err) {
    console.error(`[CAPI] Error sending ${eventName}:`, err);
  }
}

/* ── Unified: fires Pixel + CAPI together ── */
export function fireEvent(
  eventName: string,
  userData: CAPIUserData = {},
  customData: Record<string, unknown> = {},
  isStandard = false,
) {
  // Client pixel
  if (isStandard) {
    trackEvent(eventName, customData);
  } else {
    trackCustomEvent(eventName, customData);
  }
  // Server CAPI (fire-and-forget)
  sendServerEvent(eventName, userData, customData);
}
