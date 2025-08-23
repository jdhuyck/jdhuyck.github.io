import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import BlogPostForm from '../components/admin/BlogPostForm';
import { BlogPostFormData } from '../types/admin';
import { loadPostsFromStorage, saveDraftToStorage, savePostsToStorage } from '../lib/adminUtils';

const EditPost: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<BlogPostFormData | null>(null);

    useEffect(() => {
        if (id) {
            const posts = loadPostsFromStorage();
            const foundPost = posts.find(p => p.id === id);
            if (foundPost) {
                setPost(foundPost);
            } else {
                navigate('/admin');
            }
        }
    }, [id, navigate]);

    const handleSubmit = (formData: BlogPostFormData) => {
        const posts = loadPostsFromStorage();
        const updatedPosts = posts.map(p =>
            p.id === id ? { ...formData, tags: formData.tags } : p
        );
        savePostsToStorage(updatedPosts);
        navigate('/admin');
    };

    const handleCancel = () => {
        navigate('/admin');
    };

    if (!post) {
        return (
            <AdminLayout>
                <div>Loading...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className='mb-6'>
                <h2 className='text-2xl font-bold text-gray-900'>Edit Blog Post</h2>
            </div>

            <BlogPostForm
                initialData={post}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                onSaveDraft={saveDraftToStorage}
                isEditing={true}
            />
        </AdminLayout>
    );
};

export default EditPost;