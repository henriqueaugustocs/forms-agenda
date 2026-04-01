import { google } from "googleapis";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    const err = new Error(`Missing env var: ${name}`);
    err.code = "MISSING_ENV";
    throw err;
  }
  return v;
}

function getWebhookUrls() {
  const raw = process.env.WEBHOOK_URLS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizePrivateKey(raw) {
  let v = String(raw ?? "").trim();

  // Some people paste the whole service account JSON into the env var
  if (v.startsWith("{") && v.endsWith("}")) {
    try {
      const parsed = JSON.parse(v);
      v = String(parsed.private_key ?? "");
    } catch {
      // keep original; validation below will fail with clearer message
    }
  }

  // Remove surrounding quotes if the value was pasted as a JSON string
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }

  // Support both literal \n and real newlines, and normalize CRLF
  v = v.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");

  if (!v.includes("-----BEGIN PRIVATE KEY-----")) {
    const err = new Error(
      "GOOGLE_PRIVATE_KEY is not a valid PEM. Paste only the 'private_key' field from the service account JSON (including BEGIN/END lines).",
    );
    err.code = "INVALID_PRIVATE_KEY";
    throw err;
  }

  return v;
}

function getAuth() {
  const clientEmail = requireEnv("GOOGLE_CLIENT_EMAIL");
  const privateKeyRaw = requireEnv("GOOGLE_PRIVATE_KEY");
  const privateKey = normalizePrivateKey(privateKeyRaw);

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

function parseDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

function parseTime(time) {
  return /^\d{2}:\d{2}$/.test(time) ? time : null;
}

function addMinutesToTimeHHmm(timeHHmm, minutesToAdd) {
  const [hStr, mStr] = timeHHmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;

  const total = h * 60 + m + minutesToAdd;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function formatDisplayName(rawName) {
  const parts = String(rawName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  return last ? `${first} ${last}` : first;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      nome,
      email,
      telefone,
      empresa,
      segmento,
      date,
      time,
      classificacao,
      score,
      trabalha_com_agendamento,
      quem_atende,
      canal_principal,
      volume_diario,
      tamanho_empresa,
      investimento,
    } = req.body ?? {};

    const dateISO = parseDate(date);
    const timeHHmm = parseTime(time);

    if (!nome || !email || !telefone || !dateISO || !timeHHmm) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const calendarId = requireEnv("GOOGLE_CALENDAR_ID");
    const auth = getAuth();
    const calendar = google.calendar({ version: "v3", auth });

    const startDateTime = `${dateISO}T${timeHHmm}:00-03:00`;
    const endHHmm = addMinutesToTimeHHmm(timeHHmm, 30);
    if (!endHHmm) {
      return res.status(400).json({ error: "Invalid time" });
    }
    const endDateTime = `${dateISO}T${endHHmm}:00-03:00`;

    const displayName = formatDisplayName(nome);
    const summaryName = displayName || String(nome ?? "").trim() || "Cliente";

    const event = {
      summary: `${summaryName} | Demonstração IA Agendamento`,
      description: [
        `Nome: ${nome}`,
        `Email: ${email}`,
        `Telefone: ${telefone}`,
        empresa ? `Empresa: ${empresa}` : null,
        segmento ? `Segmento: ${segmento}` : null,
        ``,
        `=== RESPOSTAS DO FORMULÁRIO ===`,
        trabalha_com_agendamento ? `Trabalha com agendamento: ${trabalha_com_agendamento}` : null,
        quem_atende ? `Quem atende: ${quem_atende}` : null,
        canal_principal ? `Canal principal: ${canal_principal}` : null,
        volume_diario ? `Volume diário: ${volume_diario}` : null,
        tamanho_empresa ? `Tamanho da empresa: ${tamanho_empresa}` : null,
        investimento ? `Investimento: ${investimento}` : null,
        ``,
        `=== QUALIFICAÇÃO ===`,
        classificacao ? `Classificação: ${classificacao}` : null,
        typeof score === "number" ? `Score: ${score}` : null,
        ``,
        `Demonstração: Sistema de Agendamento com IA`,
      ]
        .filter(Boolean)
        .join("\n"),
      start: {
        dateTime: startDateTime,
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: endDateTime,
        timeZone: "America/Sao_Paulo",
      },
    };

    const resp = await calendar.events.insert({
      calendarId,
      requestBody: event,
      sendUpdates: "none",
    });

    const webhookUrls = getWebhookUrls();
    const webhookPayload = {
      evento: "reuniao_agendada",
      timestamp: new Date().toISOString(),
      origem: "landing_diagnostico",
      nome,
      email,
      telefone,
      classificacao,
      score,
      data_reuniao: dateISO,
      hora_reuniao: timeHHmm,
      agendou_reuniao: true,
      google_calendar_link: resp.data.htmlLink || "",
      google_calendar_event_id: resp.data.id || "",
    };

    const webhookResults =
      webhookUrls.length > 0
        ? await Promise.allSettled(
            webhookUrls.map((url) =>
              fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(webhookPayload),
              }).then(async (r) => ({ ok: r.ok, status: r.status, body: await r.text() })),
            ),
          )
        : null;

    return res.status(200).json({
      success: true,
      eventId: resp.data.id,
      htmlLink: resp.data.htmlLink,
      webhook: webhookUrls.length === 0 ? { skipped: true } : { skipped: false, results: webhookResults },
    });
  } catch (err) {
    console.error("[create-event]", err);

    const googleStatus = err?.response?.status;
    const googleError = err?.response?.data?.error;
    const googleMessage = googleError?.message;
    const googleReasons = Array.isArray(googleError?.errors)
      ? googleError.errors.map((e) => ({ reason: e?.reason, message: e?.message }))
      : null;

    return res.status(500).json({
      error: "Failed to create calendar event",
      details: googleMessage ?? err?.message ?? String(err),
      google: {
        status: googleStatus ?? null,
        message: googleMessage ?? null,
        reasons: googleReasons,
      },
    });
  }
}
