/* ═══════════════════════════════════════════════
   WEBHOOK — envia para produção + teste (n8n)
   ═══════════════════════════════════════════════ */

import { getUtms } from "./utm";

/* ── Lead ID: persisted per session so both form + scheduling webhooks share it ── */
const LEAD_ID_KEY = "lead_session_id";

export function setLeadId(telefone: string): string {
  const id = telefone.replace(/\D/g, "") || crypto.randomUUID();
  sessionStorage.setItem(LEAD_ID_KEY, id);
  return id;
}

export function getLeadId(): string {
  return sessionStorage.getItem(LEAD_ID_KEY) || "";
}

export async function sendWebhookEvent(
  evento: string,
  dados: Record<string, unknown> = {},
) {
  const utms = getUtms();
  const payload = {
    evento,
    lead_id: getLeadId(),
    timestamp: new Date().toISOString(),
    origem: "landing_diagnostico",
    ...dados,
    utm: Object.keys(utms).length > 0 ? utms : undefined,
    page_url: window.location.href,
  };

  await fetch("/api/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch((err) => {
    console.error(`[Webhook] Error sending:`, err);
  });
}
