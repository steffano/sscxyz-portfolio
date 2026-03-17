import { defineCollection, z } from 'astro:content';

const portfolioCollection = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    coverImage: image().optional().or(z.string().optional()),
    videoUrl: z.string().url().optional().nullable(),
    techStack: z.array(z.string()).default([]),
  }),
});

const experienceCollection = defineCollection({
  type: 'content',
  schema: z.object({
    role: z.string(),
    company: z.string(),
    dateRange: z.string(),
    techStack: z.array(z.string()).default([]),
  }),
});

export const collections = {
  'portfolio': portfolioCollection,
  'experience': experienceCollection,
};
