module.exports = async function handler(req, res) {
  return res.status(200).json({
    supabaseUrlExists: !!process.env.SUPABASE_URL,
    anonKeyExists: !!process.env.SUPABASE_ANON_KEY
  });
};
