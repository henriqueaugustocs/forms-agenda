import express from "express";
import cors from "cors";
import { google } from "googleapis";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/* ═══════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════ */

const PORT = process.env.PORT || 3001;
const SERVICE_ACCOUNT_PATH = resolve(__dirname, "../site-api-488321-824e623af78b.json");
const DIST_PATH = resolve(__dirname, "../dist");

// Load service account credentials
let credentials;
try {
  credentials = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
  console.log("✅ Service Account loaded:", credentials.client_email);
} catch (err) {
  console.error("❌ Failed to load service account JSON:", err.message);
  process.exit(1);
}

// Google Calendar ID — use "primary" for the main calendar of the account
// that shared with the service account, or the specific calendar ID.
// You can find it in Google Calendar → Settings → Calendar ID
const CALENDAR_ID = process.env.CALENDAR_ID || "c043606fb0317c7e97e34b16e4affca5656132120fe1482ad98775edea27eae6@group.calendar.google.com";

/* ═══════════════════════════════════════════════
   GOOGLE AUTH
   ═══════════════════════════════════════════════ */

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({ version: "v3", auth });

/* ═══════════════════════════════════════════════
   EXPRESS SERVER
   ═══════════════════════════════════════════════ */

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Get available time slots for a specific date
app.get("/api/slots", async (req, res) => {
  try {
    const { date } = req.query; // format: YYYY-MM-DD
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Parâmetro 'date' inválido. Use YYYY-MM-DD." });
    }

    const timeMin = `${date}T08:30:00-03:00`;
    const timeMax = `${date}T17:00:00-03:00`;

    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
    });

    const busySlots = (response.data.items || []).map((event) => ({
      start: event.start?.dateTime,
      end: event.end?.dateTime,
    }));

    // Generate all possible 30-min slots: 08:30–11:00 and 13:30–16:30
    const allSlots = [
      "08:30", "09:00", "09:30", "10:00", "10:30",
      "13:30", "14:00", "14:30", "15:00", "15:30", "16:00",
    ];

    // Filter out busy slots
    const availableSlots = allSlots.filter((slot) => {
      const slotStart = new Date(`${date}T${slot}:00-03:00`);
      const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

      return !busySlots.some((busy) => {
        if (!busy.start || !busy.end) return false;
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return slotStart < busyEnd && slotEnd > busyStart;
      });
    });

    res.json({ date, slots: availableSlots });
  } catch (err) {
    console.error("[GET /api/slots] Error:", err.message);
    res.status(500).json({ error: "Erro ao buscar horários disponíveis." });
  }
});

// Create a calendar event (schedule a meeting)
app.post("/api/schedule", async (req, res) => {
  try {
    const { nome, email, telefone, date, time, classificacao, score } = req.body;

    if (!date || !time || !nome) {
      return res.status(400).json({ error: "Campos obrigatórios: nome, date, time." });
    }

    const startDateTime = `${date}T${time}:00-03:00`;

    const event = {
      summary: `${nome.trim().toUpperCase()} | DIAGNÓSTICO`,
      description: [
        `Nome: ${nome}`,
        `Telefone: ${telefone || "N/A"}`,
        `Email: ${email || "N/A"}`,
        `Classificação: ${classificacao || "N/A"}`,
        `Score: ${score ?? "N/A"}`,
        `Origem: Landing Page Diagnóstico`,
      ].join("\n"),
      start: {
        dateTime: startDateTime,
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: `${date}T${endTime(time)}:00-03:00`,
        timeZone: "America/Sao_Paulo",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: event,
      sendUpdates: "all",
    });

    console.log(`✅ Event created: ${response.data.htmlLink}`);

    // Fire server-side CAPI event for Schedule
    sendFBEvent("Schedule", { email, phone: telefone, firstName: nome }, {
      content_name: "reuniao_diagnostico",
      classificacao,
      score,
    }).catch(() => {});

    res.json({
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
    });
  } catch (err) {
    console.error("[POST /api/schedule] Error:", err.message);
    res.status(500).json({ error: "Erro ao criar evento no calendário." });
  }
});

/* ═══════════════════════════════════════════════
   FACEBOOK CONVERSIONS API
   ═══════════════════════════════════════════════ */

const FB_PIXEL_ID = "3223715404468534";
const FB_ACCESS_TOKEN = "EAAPiNKsOHvcBQZC1rnO7YRRgVtQXo56GqIWVZCWEnbJpa1fRKWdO7aSOhQrt5t2ZCJCJ9xse7h63iXlCAcxFisV80iPOnd7FPdf56rojJKj8piS7BIH7vFc7XTPvc5CwS0jg1aRnZA9ab2ZBGVp3bYfbRv9imoL1IWI6i62rm75TIS45rRkhl23urqFUJlBS8VAZDZD";
const FB_API_VERSION = "v21.0";
const FB_API_URL = `https://graph.facebook.com/${FB_API_VERSION}/${FB_PIXEL_ID}/events?access_token=${FB_ACCESS_TOKEN}`;

async function sendFBEvent(eventName, userData = {}, customData = {}, eventSourceUrl = "") {
  const crypto = await import("crypto");
  const hash = (val) => val ? crypto.createHash("sha256").update(val.trim().toLowerCase()).digest("hex") : undefined;

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_source_url: eventSourceUrl || "https://synna.com.br/diagnosticoapi",
        user_data: {
          em: hash(userData.email) || undefined,
          ph: hash(userData.phone) || undefined,
          fn: hash(userData.firstName) || undefined,
          client_ip_address: userData.ip || undefined,
          client_user_agent: userData.userAgent || undefined,
          fbc: userData.fbc || undefined,
          fbp: userData.fbp || undefined,
        },
        custom_data: customData,
      },
    ],
  };

  try {
    const res = await fetch(FB_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log(`[FB CAPI] ${eventName}:`, JSON.stringify(data));
    return data;
  } catch (err) {
    console.error(`[FB CAPI] Error sending ${eventName}:`, err.message);
  }
}

// Endpoint for client to trigger server-side events
app.post("/api/fb-event", async (req, res) => {
  try {
    const { eventName, email, phone, firstName, customData, fbc, fbp, sourceUrl } = req.body;

    if (!eventName) {
      return res.status(400).json({ error: "eventName is required" });
    }

    const userData = {
      email,
      phone,
      firstName,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
      fbc,
      fbp,
    };

    await sendFBEvent(eventName, userData, customData || {}, sourceUrl);

    res.json({ success: true });
  } catch (err) {
    console.error("[POST /api/fb-event] Error:", err.message);
    res.status(500).json({ error: "Erro ao enviar evento." });
  }
});

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

function endTime(startTime) {
  const [h, m] = startTime.split(":").map(Number);
  const totalMin = h * 60 + m + 30;
  const endH = Math.floor(totalMin / 60);
  const endM = totalMin % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

/* ═══════════════════════════════════════════════
   STATIC FILES + SPA FALLBACK
   ═══════════════════════════════════════════════ */

// Serve frontend from /diagnosticoapi/
app.use("/diagnosticoapi", express.static(DIST_PATH));

// SPA fallback — any route under /diagnosticoapi/* returns index.html
app.get("/diagnosticoapi/*", (_req, res) => {
  res.sendFile(resolve(DIST_PATH, "index.html"));
});

/* ═══════════════════════════════════════════════
   START
   ═══════════════════════════════════════════════ */

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Frontend: http://localhost:${PORT}/diagnosticoapi/`);
  console.log(`   Calendar ID: ${CALENDAR_ID}`);
});
