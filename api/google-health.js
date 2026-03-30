import crypto from "node:crypto";
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

  try {
    crypto.createPrivateKey({ key: v, format: "pem" });
  } catch (e) {
    const err = new Error(
      "GOOGLE_PRIVATE_KEY PEM could not be decoded. This usually means the key was truncated or pasted with missing lines. Recreate a new JSON key in Google Cloud and paste the full 'private_key' value (BEGIN..END) into Vercel.",
    );
    err.code = "INVALID_PRIVATE_KEY";
    err.cause = e;
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

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const calendarId = requireEnv("GOOGLE_CALENDAR_ID");
    const auth = getAuth();
    const calendar = google.calendar({ version: "v3", auth });

    const list = await calendar.calendarList.list({ maxResults: 250 });
    const items = list.data.items ?? [];

    const calendars = items.map((c) => ({
      id: c.id,
      summary: c.summary,
      accessRole: c.accessRole,
      primary: c.primary ?? false,
    }));

    const hasConfiguredCalendar = calendars.some((c) => c.id === calendarId);

    let canAccessConfiguredCalendar = false;
    let configuredCalendarSummary = null;
    let configuredCalendarAccessError = null;

    try {
      const cal = await calendar.calendars.get({ calendarId });
      configuredCalendarSummary = cal.data?.summary ?? null;

      // A minimal call that requires real access and often provides clearer errors
      await calendar.events.list({
        calendarId,
        maxResults: 1,
        singleEvents: true,
        orderBy: "startTime",
        timeMin: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      });

      canAccessConfiguredCalendar = true;
    } catch (e) {
      configuredCalendarAccessError = e?.message ?? String(e);
    }

    return res.status(200).json({
      ok: true,
      configuredCalendarId: calendarId,
      serviceAccount: process.env.GOOGLE_CLIENT_EMAIL,
      hasConfiguredCalendar,
      canAccessConfiguredCalendar,
      configuredCalendarSummary,
      configuredCalendarAccessError,
      calendars,
    });
  } catch (err) {
    console.error("[google-health]", err);
    return res.status(500).json({
      ok: false,
      error: "Google Calendar health check failed",
      details: err?.message ?? String(err),
    });
  }
}
