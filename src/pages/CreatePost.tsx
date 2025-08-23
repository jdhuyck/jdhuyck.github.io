import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import BlogPostForm from '../components/admin/BlogPostForm';
import { BlogPostFormData } from '../types/admin';
import { 
  loadPostsFromStorage, 
  savePostsToStorage, 
  saveDraftToStorage, 
  loadDraftFromStorage, 
  clearDraftFromStorage 
} from '../lib/adminUtils';

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const [hasDraft, setHasDraft] = useState(false);
  const [showDraftSaved, setShowDraftSaved] = useState(false);

  useEffect(() => {
    const draft = loadDraftFromStorage();
    setHasDraft(!!draft);
  }, []);

  const handleSubmit = (formData: BlogPostFormData) => {
    const posts = loadPostsFromStorage();
    
    // Check if ID already exists
    if (posts.some(post => post.id === formData.id)) {
      alert('A post with this ID already exists. Please choose a different ID.');
      return;
    }

    const newPost: BlogPostFormData = {
      ...formData,
      tags: formData.tags
    };

    const updatedPosts = [...posts, newPost];
    savePostsToStorage(updatedPosts);
    clearDraftFromStorage();
    navigate('/admin');
  };

  const handleSaveDraft = (formData: BlogPostFormData) => {
    saveDraftToStorage(formData);
    setHasDraft(true);
    setShowDraftSaved(true);
    
    // Hide the success message after 3 seconds
    setTimeout(() => {
      setShowDraftSaved(false);
    }, 3000);
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  const handleLoadDraft = () => {
    const draft = loadDraftFromStorage();
    if (draft) {
      return draft;
    }
    return undefined;
  };

  const handleClearDraft = () => {
    if (window.confirm('Are you sure you want to clear your draft? This action cannot be undone.')) {
      clearDraftFromStorage();
      setHasDraft(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Blog Post</h2>
        
        {/* Draft notifications */}
        {showDraftSaved && (
          <div className="mt-2 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800">✓ Draft saved successfully!</p>
          </div>
        )}
        
        {hasDraft && (
          <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-yellow-800">
              You have a saved draft.{' '}
              <button
                onClick={handleClearDraft}
                className="text-yellow-900 underline hover:text-yellow-700 font-medium"
              >
                Clear draft
              </button>
            </p>
          </div>
        )}
      </div>
      
      <BlogPostForm
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        onCancel={handleCancel}
        initialData={handleLoadDraft()}
      />
    </AdminLayout>
  );
};

export default CreatePost;