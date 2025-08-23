import { BlogPost, BlogFilters, PaginationState, BlogPageData } from '../types/blog';
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

export const getAllTags = (posts: BlogPost[]): string[] => {
  const allTags = posts.flatMap(post => post.tags);
  return Array.from(new Set(allTags)).sort();
};

export const filterPosts = (posts: BlogPost[], filters: BlogFilters): BlogPost[] => {
  let filteredPosts = [...posts];

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filteredPosts = filteredPosts.filter(post =>
      post.title.toLowerCase().includes(query) ||
      post.snippet.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  if (filters.selectedTags.length > 0) {
    filteredPosts = filteredPosts.filter(post =>
      filters.selectedTags.every(selectedTag =>
        post.tags.includes(selectedTag)
      )
    );
  }

  switch (filters.sortBy) {
    case 'date-asc':
      filteredPosts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      break;
    case 'title':
      filteredPosts.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'date-desc':
    default:
      filteredPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      break;
  }

  return filteredPosts;
};

export const paginatePosts = (posts: BlogPost[], currentPage: number, postsPerPage: number): BlogPost[] => {
  const startIndex = (currentPage - 1) * postsPerPage;
  return posts.slice(startIndex, startIndex + postsPerPage);
};

export const getPaginationInfo = (currentPage: number, postsPerPage: number, totalPosts: number): PaginationState => {
  return {
    currentPage,
    postsPerPage,
    totalPosts
  };
};

export const getBlogPageData = async (
  currentPage: number = 1,
  postsPerPage: number = 6,
  filters: BlogFilters = {
    searchQuery: '',
    selectedTags: [],
    sortBy: 'date-desc'
  }
): Promise<BlogPageData> => {
  try {
    const allPosts = await getAllBlogPosts();
    const filteredPosts = filterPosts(allPosts, filters);
    const paginatedPosts = paginatePosts(filteredPosts, currentPage, postsPerPage);
    const availableTags = getAllTags(allPosts);

    return {
      posts: paginatedPosts,
      pagination: getPaginationInfo(currentPage, postsPerPage, filteredPosts.length),
      availableTags
    };
  } catch (error) {
    console.error('Error getting blog page data:', error);
    return {
      posts: [],
      pagination: { currentPage: 1, postsPerPage, totalPosts: 0 },
      availableTags: []
    };
  }
};