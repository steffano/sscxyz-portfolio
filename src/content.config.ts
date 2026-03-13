import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const workCollection = defineCollection({
  loader: glob({ pattern: "**/index.json", base: "./src/content/work" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    coverImage: image().optional().or(z.string().optional()),
    videoUrl: z.string().url().optional().nullable(),
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
  }),
});

export const collections = {
  'work': workCollection,
  'experience': experienceCollection,
};
