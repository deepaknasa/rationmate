export default async function handler(req, res) {
  return res.status(200).json({
    supabaseUrlExists: !!(process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL),
    anonKeyExists: !!(process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY)
  });
}
