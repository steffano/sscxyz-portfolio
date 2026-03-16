import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { messages } = await request.json() as { messages: any[] };

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemMessage = {
      role: 'system',
      content: "You are the helpful virtual assistant for Steffano (sscxyz), a TouchDesigner artist. Answer politely and keep responses under 3 sentences. If the user asks about hiring, availability, or an event, politely instruct them to visit the /contact page.",
    };

    // Combine system message with history
    const payload = [systemMessage, ...messages];

    // Access Cloudflare Workers AI through env (Astro 6 / Cloudflare Adapter 13)
    const ai = (env as any).AI;

    if (!ai) {
      if (import.meta.env.DEV) {
        return new Response(JSON.stringify({ 
          response: "Hi! I'm in development mode. I'm a mock response because the Cloudflare AI binding is not correctly configured in your local environment. Please check your wrangler.jsonc." 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      console.error('Cloudflare AI not found in env');
      return new Response(JSON.stringify({ 
        error: 'AI service unavailable', 
        details: 'Cloudflare AI binding not found. Ensure wrangler.jsonc has the AI binding.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: payload,
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
