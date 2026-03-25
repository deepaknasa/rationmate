module.exports = async function handler(req, res) {
    const API_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  try {
    const url = `${API_URL}/functions/v1/ration-mate-items?select=*`;

    console.log("Fetching data from Supabase with URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
    });

    console.log("Received response from Supabase with status:", response.status);

    const text = await response.text();

    console.log("Response text:", text);

    res.setHeader("Content-Type", "application/json");
    res.status(response.status).send(text);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
