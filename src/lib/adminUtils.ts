import { BlogPostFormData, FormErrors } from '../types/admin';

// Local storage keys
const STORAGE_KEYS = {
    BLOG_POSTS: 'blog-admin-posts',
    DRAFT: 'blog-admin-draft'
};

export const validateForm = (formData: BlogPostFormData): FormErrors => {
    const errors: FormErrors = {};

    if (!formData.id.trim()) {
        errors.id = 'ID is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.id)) {
        errors.id = 'ID can only contain lowercase letters, numbers, and hyphens';
    }

    if (!formData.title.trim()) {
        errors.title = 'Title is required';
    }

    if (!formData.date.trim()) {
        errors.date = 'Date is required';
    } else if (isNaN(Date.parse(formData.date))) {
        errors.date = 'Invalid date format';
    }

    if (!formData.snippet.trim()) {
        errors.snippet = 'Snippet is required';
    } else if (formData.snippet.length > 200) {
        errors.snippet = 'Snippet must be less than 200 characters';
    }

    if (!formData.content.trim()) {
        errors.content = 'Content is required';
    }

    return errors;
};

// Local storage functions
export const savePostsToStorage = (posts: BlogPostFormData[]): void => {
    try {
        localStorage.setItem(STORAGE_KEYS.BLOG_POSTS, JSON.stringify(posts));
    } catch (error) {
        console.error('Error saving posts to local storage:', error);
    }
};

export const loadPostsFromStorage = (): BlogPostFormData[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.BLOG_POSTS);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading posts from local storage:', error);
        return [];
    }
};

export const saveDraftToStorage = (draft: BlogPostFormData): void => {
    try {
        localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draft));
    } catch (error) {
        console.error('Error saving draft to local storage:', error);
    }
};

export const loadDraftFromStorage = (): BlogPostFormData | null => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.DRAFT);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error('Error loading draft from local storage:', error);
        return null;
    }
};

export const clearDraftFromStorage = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEYS.DRAFT);
    } catch (error) {
        console.error('Error clearing draft from local storage:', error);
    }
};

// Helper functions
export const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 50);
};

export const formatTags = (tagsString: string): string[] => {
    return tagsString
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
};