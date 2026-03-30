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

function toSaoPauloDayRange(dateISO) {
  const timeMin = `${dateISO}T00:00:00-03:00`;
  const timeMax = `${dateISO}T23:59:59-03:00`;
  return { timeMin, timeMax };
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    assertAdmin(req);

    const date = parseDate(req.query?.date);
    if (!date) {
      return res.status(400).json({ error: "Invalid or missing date (expected YYYY-MM-DD)" });
    }

    const calendarId = requireEnv("GOOGLE_CALENDAR_ID");
    const auth = getAuth();
    const calendar = google.calendar({ version: "v3", auth });

    const { timeMin, timeMax } = toSaoPauloDayRange(date);

    const resp = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    const items = resp.data.items ?? [];

    const blocks = items
      .filter((e) => e?.extendedProperties?.private?.synna_block === "1")
      .map((e) => ({
        eventId: e.id,
        slot: e?.extendedProperties?.private?.slot ?? null,
        summary: e.summary ?? null,
        start: e.start?.dateTime ?? e.start?.date ?? null,
        end: e.end?.dateTime ?? e.end?.date ?? null,
      }));

    return res.status(200).json({ blocks });
  } catch (err) {
    console.error("[admin-list-blocks]", err);
    const status = err?.code === "UNAUTHORIZED" ? 401 : 500;
    return res.status(status).json({
      error: "Failed to list blocks",
      details: err?.message ?? String(err),
    });
  }
}
