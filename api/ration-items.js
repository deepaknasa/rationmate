module.exports = async function handler(req, res) {
  const API_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!API_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({
      error: 'Supabase environment variables are missing. Set SUPABASE_URL and SUPABASE_ANON_KEY.',
    });
  }

  try {
    const url = `${API_URL}/rest/v1/ration-mate-items?select=*`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    });

    const text = await response.text();

    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    return res.status(response.status).send(text);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
