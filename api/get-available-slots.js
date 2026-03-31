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

function parseDateParam(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }
  return date;
}

function toSaoPauloDayRange(dateISO) {
  // Sao Paulo offset (-03:00). Brazil currently has no DST.
  const timeMin = `${dateISO}T00:00:00-03:00`;
  const timeMax = `${dateISO}T23:59:59-03:00`;
  return { timeMin, timeMax };
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const date = parseDateParam(req.query?.date);
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
    });

    const items = resp.data.items ?? [];
    const busy = items
      .map((e) => {
        const start = e.start?.dateTime ?? e.start?.date;
        const end = e.end?.dateTime ?? e.end?.date;
        if (!start || !end) return null;
        return { start: new Date(start), end: new Date(end) };
      })
      .filter(Boolean);

    const slots = [];
    const now = new Date();

    const windows = [
      { startMinutes: 9 * 60 + 30, endMinutes: 11 * 60 },
      { startMinutes: 13 * 60 + 30, endMinutes: 16 * 60 + 30 },
    ];

    for (const w of windows) {
      for (let t = w.startMinutes; t < w.endMinutes; t += 30) {
        const hour = Math.floor(t / 60);
        const minute = t % 60;

        const start = new Date(
          `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-03:00`,
        );
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);

        if (start <= now) continue;

        const isBusy = busy.some((b) => overlaps(start, end, b.start, b.end));
        if (isBusy) continue;

        slots.push({
          start: start.toISOString(),
          end: end.toISOString(),
          label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
        });
      }
    }

    return res.status(200).json({ slots });
  } catch (err) {
    console.error("[get-available-slots]", err);
    const status = err?.code === "MISSING_ENV" ? 500 : 500;
    return res.status(status).json({
      error: "Failed to fetch available slots",
      details: err?.message ?? String(err),
    });
  }
}
