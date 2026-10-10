export interface BlogPost {
  id: string;
  title: string;
  date: string;
  tags: string[];
  content: string;
  snippet: string;
}

export interface BlogFilters {
  searchQuery: string;
  selectedTags: string[];
  sortBy: 'date-desc' | 'date-asc' | 'title';
}

export interface PaginationState {
  currentPage: number;
  postsPerPage: number;
  totalPosts: number;
}

export interface BlogPageData {
  posts: BlogPost[]
  pagination: PaginationState;
  availableTags: string[];
}