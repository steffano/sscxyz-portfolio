// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

import { fileURLToPath } from 'node:url';

// https://astro.build/config
export default defineConfig({
  // Only use the Cloudflare adapter in production.
  // In development, we use Astro's default server to avoid the Cloudflare
  // esbuild-based Worker proxy, which has issues resolving Keystatic virtual modules.
  adapter: process.env.NODE_ENV === 'development'
    ? undefined
    : cloudflare({
        prerenderEnvironment: 'node',
      }),

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        'virtual:keystatic-config': fileURLToPath(new URL('./keystatic.config.ts', import.meta.url)),
      },
    },
    ssr: {
      external: [
        '@keystatic/astro',
        '@keystatic/core',
      ],
    },
  },

  integrations: [react(), keystatic()],
});