export interface BlogPostFormData {
    id: string;
    title: string;
    date: string;
    tags: string;
    snippet: string;
    content: string;
}

export interface FormErrors {
    id?: string;
    title?: string;
    date?: string;
    tags?: string;
    snippet?: string;
    content?: string;
}

export interface AdminState {
    posts: BlogPostFormData[];
    currentPost: BlogPostFormData[];
    errors: FormErrors;
    isEditing: boolean;
    showPreview: boolean;
}