export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pixelId, accessToken, eventName, eventData } = req.body;

    if (!pixelId || !accessToken || !eventName || !eventData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [eventData] }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Facebook CAPI Error:', result);
      return res.status(response.status).json({ 
        error: 'Facebook CAPI request failed',
        details: result 
      });
    }

    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('CAPI Error:', error);
    res.status(500).json({ 
      error: 'Failed to send Facebook CAPI event',
      details: error.message 
    });
  }
}
