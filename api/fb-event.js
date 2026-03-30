export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const pixelId = process.env.FB_PIXEL_ID;
    const accessToken = process.env.FB_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      // If not configured, we don't fail the app.
      return res.status(200).json({ success: true, skipped: true });
    }

    const { eventName, email, phone, firstName, customData, fbp, fbc, sourceUrl } = req.body ?? {};

    if (!eventName) {
      return res.status(400).json({ error: "Missing eventName" });
    }

    const eventData = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      event_source_url: sourceUrl,
      user_data: {
        em: email ? [email] : undefined,
        ph: phone ? [phone] : undefined,
        fn: firstName ? [firstName] : undefined,
        fbp,
        fbc,
      },
      custom_data: customData ?? {},
    };

    const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [eventData] }),
    });

    const json = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(r.status).json({ error: "Facebook CAPI request failed", details: json });
    }

    return res.status(200).json({ success: true, result: json });
  } catch (err) {
    console.error("[fb-event]", err);
    return res.status(500).json({ error: "Failed to send fb event", details: err?.message ?? String(err) });
  }
}
