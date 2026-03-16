// @ts-check
import process from 'node:process';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import cloudflare from '@astrojs/cloudflare';
import { fileURLToPath } from 'node:url';

import mdx from '@astrojs/mdx';

const isDev = process.argv.includes('dev');

// https://astro.build/config
export default defineConfig({
  output: isDev ? 'static' : 'server', // Use 'server' (or 'hybrid') for Cloudflare SSR if needed, or keep 'static' if that's the intention.
  adapter: isDev ? undefined : cloudflare(),

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
    },
    resolve: {
      alias: {
        'virtual:keystatic-config': fileURLToPath(new URL('./keystatic.config.ts', import.meta.url)),
      },
    },
  },

  integrations: [react(), keystatic(), mdx()],
});