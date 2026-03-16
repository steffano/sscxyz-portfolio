import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const portfolioCollection = defineCollection({
  loader: glob({ pattern: "**/index.json", base: "./src/content/portfolio" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    coverImage: image().optional().or(z.string().optional()),
    videoUrl: z.string().url().optional().nullable(),
    category: z.enum(['motion-design', 'live-av', 'generative-art']),
    techStack: z.array(z.string()).default([]),
  }),
});

const experienceCollection = defineCollection({
  loader: glob({ pattern: "**/index.json", base: "./src/content/experience" }),
  schema: z.object({
    role: z.string(),
    company: z.string(),
    dateRange: z.string(),
    techStack: z.array(z.string()).default([]),
    achievements: z.string().optional(),
  }),
});

export const collections = {
  'portfolio': portfolioCollection,
  'experience': experienceCollection,
};
