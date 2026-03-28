import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY;

  return {
    plugins: [react()],
    server: {
      proxy: supabaseUrl ? {
        '/api/ration-items': {
          target: supabaseUrl,
          changeOrigin: true,
          rewrite: () => '/functions/v1/ration-mate-items?select=*',
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            Accept: 'application/json',
          },
        },
        '/api/update-ration-item': {
          target: supabaseUrl,
          changeOrigin: true,
          rewrite: () => '/functions/v1/update-ration-item',
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
