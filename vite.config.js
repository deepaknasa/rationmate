import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { API_ROUTES, SUPABASE_API_TARGETS } from './src/routes/apiRoutes';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY;

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': supabaseUrl == null ? 'undefined' : JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': supabaseAnonKey == null ? 'undefined' : JSON.stringify(supabaseAnonKey),
    },
    server: {
      proxy: supabaseUrl ? {
        [API_ROUTES.rationItems]: {
          target: supabaseUrl,
          changeOrigin: true,
          rewrite: () => SUPABASE_API_TARGETS.rationItems,
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            Accept: 'application/json',
          },
        },
        [API_ROUTES.updateRationItem]: {
          target: supabaseUrl,
          changeOrigin: true,
          rewrite: () => SUPABASE_API_TARGETS.updateRationItem,
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            Accept: 'application/json',
          },
        },
        '/functions': {
          target: supabaseUrl,
          changeOrigin: true,
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            Accept: 'application/json',
          },
        },
      } : undefined,
    },
  };
});

