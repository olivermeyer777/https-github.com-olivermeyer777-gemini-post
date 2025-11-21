import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' ensures we load all env variables (including those without VITE_ prefix)
  // This is critical for Vercel where the user might set 'API_KEY' directly.
  // Fix: Cast process to any to avoid TS error about cwd missing on Process type
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // By defining 'process.env.API_KEY', we instruct Vite to replace this string
      // in the client-side code with the actual string value from the environment.
      // This fixes the "API key problem" on Vercel.
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
  };
});