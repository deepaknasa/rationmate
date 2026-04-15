import {
  mapRationItemWritePayload,
  normalizeRationItemsResponse,
} from './ration-item-mapping.js';

export default async function handler(req, res) {
  const API_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!API_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({
      error: 'Supabase environment variables are missing. Set SUPABASE_URL and SUPABASE_ANON_KEY.',
    });
  }

  try {
    const isCreateRequest = req.method === 'POST';
    const url = isCreateRequest
      ? `${API_URL}/rest/v1/RationItems`
      : `${API_URL}/rest/v1/RationItems?select=*`;
    const requestPayload = isCreateRequest ? mapRationItemWritePayload(req.body ?? {}) : null;

    const response = await fetch(url, {
      method: req.method,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
        ...(isCreateRequest
          ? {
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            }
          : {}),
      },
      ...(isCreateRequest ? { body: JSON.stringify(requestPayload) } : {}),
    });

    const text = await response.text();

    try {
      const normalizedPayload = normalizeRationItemsResponse(JSON.parse(text));
      return res.status(response.status).json(normalizedPayload);
    } catch {
      res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
      return res.status(response.status).send(text);
    }
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
