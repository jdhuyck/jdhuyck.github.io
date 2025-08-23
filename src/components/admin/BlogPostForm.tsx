import React, { useState, useEffect } from 'react';
import { BlogPostFormData, FormErrors } from '../../types/admin';
import { validateForm, generateSlug, saveDraftToStorage } from '../../lib/adminUtils';
import ReactMarkdown from 'react-markdown'

interface BlogPostFormProps {
    initialData?: BlogPostFormData;
    onSubmit: (data: BlogPostFormData) => void;
    onCancel: () => void;
    isEditing?: boolean;
}

const initialFormData: BlogPostFormData = {
    id: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    tags: '',
    snippet: '',
    content: ''
};

const BlogPostForm: React.FC<BlogPostFormProps> = ({
    initialData = initialFormData,
    onSubmit,
    onCancel,
    isEditing = false
}) => {
    const [formData, setFormData] = useState<BlogPostFormData>(initialData);
    const [errors, setErrors] = useState<FormErrors>({});
    const [showPreview, setShowPreview] = useState(false);

    // Auto-save Draft
    useEffect(() => {
        const autoSaveTimer = setTimeout(() => {
            if (formData.title || formData.content) {
                saveDraftToStorage(formData);
            }
        }, 2000);  // 2 seconds

        return () => clearTimeout(autoSaveTimer);
    }, [formData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined}));
        }

        // Auto-generate ID from title
        if (name === 'title' && !isEditing) {
            setFormData(prev => ({
                ...prev,
                id: generateSlug(value)
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validateForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        onSubmit({
            ...formData,
            tags: formData.tags  // Store as comma-separated for editing
        });
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, tags: value }));

        if (errors.tags) {
            setErrors(prev => ({ ...prev, tags: undefined }));
        }
    };

    const previewContent = () => {
        setShowPreview(true);
    };

    const editContent = () => {
        setShowPreview(false);
    };

    if (showPreview) {
        return (
            <div className='bg-white p-6 rounded-lg shadow-md'>
                <div className='flex justify-between items-center mb-6'>
                    <h2 className='text-2xl font-bold text-gray-900'>Preview</h2>
                    <button
                        onClick={editContent}
                        className='bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600'
                    >
                        Edit
                    </button>
                </div>

                <div className='prose max-w-none'>
                    <h1>{formData.title}</h1>
                    <p className='text-gray-600'>Date: {formData.date}</p>
                    <p className='text-gray-600'>Tags: {formData.tags}</p>
                    <p className='text-gray-600'>Snippet: {formData.snippet}</p>
                    <hr className='my-4' />
                    <div className='whitespace-pre-wrap'>
                        <ReactMarkdown>
                            {formData.content}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className='bg-white p-6 rounded-lg shadow-md'>
            <div className='grid grid-cols-1 gap-6'>
                {/* ID Field */}
                <div>
                    <label htmlFor='id' className='block text-sm font-medium text-gray-700'>
                        ID (URL Slug)
                    </label>
                    <input
                        type='text'
                        id='id'
                        name='id'
                        value={formData.id}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                            errors.id ? 'border-red-500' : ''
                        }`}
                        placeholder='my-blog-post'
                        disabled={isEditing}
                    />
                    {errors.id && <p className='mt-1 text-sm text-red-600'>{errors.id}</p>}
                    <p className='mt-1 text-sm text-gray-500'>
                        This will be used in the URL. Only lowercase letters, numbers, and hyphens are allowed.
                    </p>
                </div>

                {/* Title Field */}
                <div>
                    <label htmlFor='title' className='block text-sm font-medium text-gray-700'>
                        Title *
                    </label>
                    <input
                        type='text'
                        id='title'
                        name='title'
                        value={formData.title}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                            errors.title ? 'border-red-500' : ''
                        }`}
                        placeholder='Enter blog post title'
                    />
                    {errors.title && <p className='mt-1 text-sm text-red-600'>{errors.title}</p>}
                </div>

                {/* Date FIeld */}
                <div>
                    <label htmlFor='date' className='block text-sm font-medium text-gray-700'>
                        Date *
                    </label>
                    <input
                        type='date'
                        id='date'
                        name='date'
                        value={formData.date}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-50 sm:text-sm ${
                            errors.date ? 'border-red-500' : ''
                        }`}
                    />
                    {errors.date && <p className='mt-1 text-sm text-red-600'>{errors.date}</p>}
                </div>

                {/* Tags Field */}
                <div>
                    <label htmlFor='tags' className='block text-sm font-medium text-gray-700'>
                        Tags
                    </label>
                    <input
                        type="text"
                        id="tags"
                        name='tags'
                        value={formData.tags}
                        onChange={handleTagsChange}
                        className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                        placeholder='tag 1, tag 2, tag 3'
                    />
                    <p className='mt-1 text-sm text-gray-500'>
                        Separate tags with commas
                    </p>
                </div>

                {/* Snippet Field */}
                <div>
                    <label htmlFor='snippet' className='block text-sm font-medium text-gray-700'>
                        Snippet *
                    </label>
                    <textarea
                        id="snippet"
                        name='snippet'
                        value={formData.snippet}
                        onChange={handleChange}
                        rows={3}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                            errors.snippet ? 'border-red-500' : ''
                        }`}
                        placeholder='Brief description of blog post'
                    />
                    {errors.snippet && <p className='mt-1 text-sm text-red-600'>{errors.snippet}</p>}
                    <p className='mt-1 text-sm text-gray-500'>
                        {formData.snippet.length}/200 characters
                    </p>
                </div>

                {/* Content Field */}
                <div>
                    <label htmlFor='content' className='block text-sm font-medium text-gray-700'>
                        Content *
                    </label>
                    <textarea
                        id='content'
                        name='content'
                        value={formData.content}
                        onChange={handleChange}
                        rows={12}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus: ring-blue-500 sm:text-sm ${
                            errors.content ? 'border-red-500' : ''
                        }`}
                        placeholder="Write your blog post content in the Markdown format..."
                    />
                    {errors.content && <p className='mt-1 text-sm text-red-600'>{errors.content}</p>}
                </div>

                {/* Action Buttons */}
                <div className='flex justify-between items-center'>
                    <div className='flex space-x-4'>
                        <button
                            type='submit'
                            className='bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700'
                        >
                            {isEditing ? 'Update Post' : 'Create Post'}
                        </button>
                        <button
                            type='button'
                            onClick={onCancel}
                            className='bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600'
                        >
                            Cancel
                        </button>
                        <button
                            type='button'
                            onClick={previewContent}
                            className='bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700'
                        >
                            Preview
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default BlogPostForm;