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

function normalizePrivateKey(raw) {
  let v = String(raw ?? "").trim();

  if (v.startsWith("{") && v.endsWith("}")) {
    try {
      const parsed = JSON.parse(v);
      v = String(parsed.private_key ?? "");
    } catch {
      // keep original
    }
  }

  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }

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

function assertAdmin(req) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    const err = new Error("ADMIN_TOKEN is not configured");
    err.code = "MISSING_ADMIN_TOKEN";
    throw err;
  }

  const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
  const token = String(authHeader).startsWith("Bearer ") ? String(authHeader).slice(7) : "";

  if (!token || token !== expected) {
    const err = new Error("Unauthorized");
    err.code = "UNAUTHORIZED";
    throw err;
  }
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

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    assertAdmin(req);

    const { date, time, reason } = req.body ?? {};
    const dateISO = parseDate(date);
    const timeHHmm = parseTime(time);

    if (!dateISO || !timeHHmm) {
      return res.status(400).json({ error: "Invalid or missing date/time" });
    }

    const endHHmm = addMinutesToTimeHHmm(timeHHmm, 30);
    if (!endHHmm) {
      return res.status(400).json({ error: "Invalid time" });
    }

    const calendarId = requireEnv("GOOGLE_CALENDAR_ID");
    const auth = getAuth();
    const calendar = google.calendar({ version: "v3", auth });

    const startDateTime = `${dateISO}T${timeHHmm}:00-03:00`;
    const endDateTime = `${dateISO}T${endHHmm}:00-03:00`;

    const slotKey = `${dateISO}T${timeHHmm}`;

    const event = {
      summary: `BLOQUEIO | ${timeHHmm}`,
      description: reason ? `Motivo: ${reason}` : undefined,
      visibility: "private",
      start: { dateTime: startDateTime, timeZone: "America/Sao_Paulo" },
      end: { dateTime: endDateTime, timeZone: "America/Sao_Paulo" },
      extendedProperties: {
        private: {
          synna_block: "1",
          slot: slotKey,
        },
      },
    };

    const resp = await calendar.events.insert({
      calendarId,
      requestBody: event,
      sendUpdates: "none",
    });

    return res.status(200).json({
      success: true,
      blocked: true,
      eventId: resp.data.id,
    });
  } catch (err) {
    console.error("[admin-block-slot]", err);
    const status = err?.code === "UNAUTHORIZED" ? 401 : 500;
    return res.status(status).json({
      error: "Failed to block slot",
      details: err?.message ?? String(err),
    });
  }
}
