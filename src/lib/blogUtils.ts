import { BlogPost } from '../types/blog';
import { loadPostsFromStorage, formatTags } from './adminUtils';

export const getAllBlogPosts = async (): Promise<BlogPost[]> => {
  try {
    const adminPosts = loadPostsFromStorage();

    const posts: BlogPost[] = adminPosts.map(post => ({
      id: post.id,
      title: post.title,
      date: post.date,
      tags: formatTags(post.tags),
      snippet: post.snippet,
      content: post.content
    }));

    // Sort by date descending
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return posts;
  } catch (error) {
    console.error('Error loading blog posts:', error);
    return [];
  }
};

export const getBlogPostById = async (id: string): Promise<BlogPost | null> => {
  try {
    const adminPosts = loadPostsFromStorage();
    const post = adminPosts.find(p => p.id === id);

    if (!post) {
      return null;
    }

    return {
      id: post.id,
      title: post.title,
      date: post.date,
      tags: formatTags(post.tags),
      snippet: post.snippet,
      content: post.content
    };
  } catch (error) {
    console.error(`Error loading blog post ${id}:`, error);
    return null;
  }
};