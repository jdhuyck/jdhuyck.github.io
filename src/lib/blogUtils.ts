import { BlogPost } from '../types/blog';

export const getAllBlogPosts = async (): Promise<BlogPost[]> => {
    // Import all MDX files here
    // Mock for now
    return [
        {
            id: '1',
            title: 'Getting Started with React and TypeScript',
            date: '2023-05-15',
            tags: ['React', 'TypeScript', 'Web Development'],
            content: null,  // This would be MDX content
            snippet: 'Learn how to set up a React project with TypeScript and avoid common pitfalls.'
          },
          {
            id: '2',
            title: 'Mastering Tailwind CSS',
            date: '2023-06-22',
            tags: ['CSS', 'Tailwind', 'Frontend'],
            content: null,
            snippet: 'Discover advanced techniques for using Tailwind CSS in your projects.'
          }
    ];
};

export const getBlogPostById = async (id: string): Promise<BlogPost | null> => {
    const posts = await getAllBlogPosts();
    return posts.find(post => post.id === id) || null;
};