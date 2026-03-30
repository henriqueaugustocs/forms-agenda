function getWebhookUrls() {
  const raw = process.env.WEBHOOK_URLS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const urls = getWebhookUrls();
    if (urls.length === 0) {
      // Webhook disabled. Treat as success.
      return res.status(200).json({ success: true, skipped: true });
    }

    const payload = req.body ?? {};

    const results = await Promise.allSettled(
      urls.map((url) =>
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then(async (r) => ({ ok: r.ok, status: r.status, body: await r.text() })),
      ),
    );

    return res.status(200).json({ success: true, results });
  } catch (err) {
    console.error("[webhook]", err);
    return res.status(500).json({ error: "Failed to send webhook", details: err?.message ?? String(err) });
  }
}
