import { BlogPost } from '../types/blog';

const blogPostModules = import.meta.glob('../content/blog/*.json', {
  eager: true,
});

export const getAllBlogPosts = async (): Promise<BlogPost[]> => {
  const posts: BlogPost[] = [];

  console.log('Loading blog posts from individual JSON files');
  console.log('Found JSON files:', Object.keys(blogPostModules));

  for (const path in blogPostModules) {
    try {
      const module = blogPostModules[path] as any;  // eslint-disable-line @typescript-eslint/no-explicit-any
      console.log('Processing JSON file:', path, module);

      if (module && module.default) {
        const postData = module.default;

        if (!postData.id || !postData.title || !postData.date) {
          console.warn(`Skipping invalid post from ${path}: Missing required fields`);
          continue;
        }

        const tags = Array.isArray(postData.tags) ? postData.tags : [];

        const content = postData.content || '';

        const snippet = postData.snippet || '';

        posts.push({
          id: postData.id,
          title: postData.title,
          date: postData.date,
          tags,
          snippet,
          content
        });

        console.log(`Successfully loaded post: ${postData.id}`);
      } else {
        console.warn(`No default export found in: ${path}`);
      }
    } catch (error) {
      console.error(`Error processing file ${path}:`, error);
    }
  }

  try {
    posts.sort((a, b) => {
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch (err) {
        console.error('Error sorting posts by date:', err);
        return 0;
      }
    });
  } catch (error) {
    console.error('Error during sorting:', error);
  }

  console.log('Final posts array:', posts);
  return posts;
};

export const getBlogPostById = async (id: string): Promise<BlogPost | null> => {
  try {
    console.log('Trying to load blog post with ID:', id);

    const module = await import(`../content/blog/${id}.json`);

    if (!module.default) {
      console.error(`No default export found for post: ${id}`);
      return null;
    }

    const postData = module.default;

    if (!postData.id || !postData.title || !postData.date) {
      console.error(`Missing required fields in post: ${id}`);
      return null;
    }

    const tags = Array.isArray(postData.tags) ? postData.tags : [];

    const content = postData.content || '';

    const snippet = postData.snippet || '';

    return {
      id: postData.id,
      title: postData.title,
      date: postData.date,
      tags,
      snippet,
      content
    };
  } catch (error) {
    console.error(`Error loading blog post ${id}:`, error);
    return null;
  }
};