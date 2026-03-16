import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    work: collection({
      label: 'Work',
      slugField: 'title',
      path: 'src/content/work/*/',
      format: { data: 'json' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        coverImage: fields.image({
          label: 'Cover Image',
          directory: 'src/assets/work',
          publicPath: '../../assets/work',
        }),
        videoUrl: fields.url({
          label: 'Video URL',
          description: 'Link to a video related to the project (optional)',
        }),
        techStack: fields.array(
          fields.text({ label: 'Technology' }),
          { label: 'Tech Stack Tags', itemLabel: props => props.value }
        ),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Motion Design & Campaigns', value: 'motion-design' },
            { label: 'Live AV & Installations', value: 'live-av' },
            { label: 'Generative Art', value: 'generative-art' },
          ],
          defaultValue: 'motion-design',
        }),
        content: fields.mdx({ label: 'Content' }),
      },
    }),
    experience: collection({
      label: 'Experience',
      slugField: 'role',
      path: 'src/content/experience/*/',
      format: { data: 'json' },
      schema: {
        role: fields.slug({ name: { label: 'Job Role' } }),
        company: fields.text({ label: 'Company' }),
        dateRange: fields.text({ label: 'Date Range' }),
        techStack: fields.array(
          fields.text({ label: 'Technology' }),
          { label: 'Tech Stack Used', itemLabel: props => props.value }
        ),
        achievements: fields.mdx({ label: 'Achievements' }),
      },
    }),
  },
});
