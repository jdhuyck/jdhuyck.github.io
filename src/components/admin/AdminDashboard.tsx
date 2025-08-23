import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BlogPostFormData } from '../../types/admin';
import { loadPostsFromStorage, savePostsToStorage, loadDraftFromStorage, clearDraftFromStorage } from '../../lib/adminUtils';

const AdminDashboard: React.FC = () => {
    const [posts, setPosts] = useState<BlogPostFormData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasDraft, setHasDraft] = useState(false);

    useEffect(() => {
        loadPosts();
        const draft = loadDraftFromStorage();
        setHasDraft(!!draft);
    }, []);

    const loadPosts = () => {
        const storedPosts = loadPostsFromStorage();
        setPosts(storedPosts);
        setIsLoading(false);
    };

    const handleClearDraft = () => {
        if (window.confirm('Are you sure you want to clear your draft?')) {
            clearDraftFromStorage();
            setHasDraft(false);
        }
    }

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            const updatedPosts = posts.filter(post => post.id !== id);
            setPosts(updatedPosts);
            savePostsToStorage(updatedPosts);
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className='flex justify-between items-center mb-6'>
                {hasDraft && (
                    <div className='mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-4'>
                        <p className='text-yellow-800'>
                            You have a saved draft.{' '}
                            <Link
                                to="/admin/new"
                                className='text-yellow-900 underline hover:text-yellow-700 font-medium'
                            >
                                Continue editing
                            </Link>
                            {' or '}
                            <button
                                onClick={handleClearDraft}
                                className='text-yellow-900 underline hover:text-yellow-700 font-medium'
                            >
                                Clear Draft
                            </button>
                        </p>
                    </div>
                )}
                <h2 className='text-2xl font-bold text-gray-900'>Blog Posts</h2>
                <Link
                    to="/admin/new"
                    className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700'
                >
                    Create New Post
                </Link>
            </div>

            {posts.length === 0 ? (
                <div className='text-center py-12'>
                    <p className='text-gray-500 text-lg'>No blog posts yet.</p>
                    <p className='text-gray-400 mt-2'>Create your first post to get started!</p>
                </div>
            ) : (
                <div className='grid grid-cols-1 gap-6'>
                    {posts.map((post) => (
                        <div key={post.id} className='bg-white p-6 rounded-lg shadow-md'>
                            <div className='flex justify-between items-start'>
                                <div>
                                    <h3 className='text-xl font-semibold text-gray-900'>{post.title}</h3>
                                    <p className='text-gray-600 mt-1'>{post.date}</p>
                                    <p className='text-gray-600 mt-2'>{post.snippet}</p>
                                    <div className='flex flex-wrap gap-2 mt-3'>
                                        {post.tags.split(',').map((tag, index) => (
                                            <span
                                                key={index}
                                                className='bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded'
                                            >
                                                {tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className='flex space-x-2'>
                                    <Link
                                        to={`/admin/edit/${post.id}`}
                                        className='bg-yellow-600 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-700'
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(post.id)}
                                        className='bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700'
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;