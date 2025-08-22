import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BlogPost as BlogPostType } from '../types/blog'
import { getAllBlogPosts } from '../lib/blogUtils'

// Gradient options for the blog post cards
const gradientOptions = [
  'from-blue-400 to-indigo-500',
  'from-green-400 to-teal-500',
  'from-purple-400 to-pink-500',
  'from-orange-400 to-red-500',
  'from-yellow-400 to-amber-500',
  'from-cyan-400 to-blue-500'
]

const Blog = () => {
  const [posts, setPosts] = useState<BlogPostType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const blogPosts = await getAllBlogPosts()
        setPosts(blogPosts)
      } catch (error) {
        console.error('Error loading blog posts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-16 px-4'>
        <div className='max-w-6xl mx-auto'>
          <h1 className='text-4xl font-bold text-gray-800 mb-8 text-center'>Blog</h1>
          <div className='text-center'>Loading posts...</div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-16 px-4'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-4xl font-bold text-gray-800 mb-8 text-center'>Blog</h1>

        {posts.length === 0 ? (
          <div className='text-center'>
            <p className='text-gray-600'>No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg: grid-cols-3 gap-8'>
            {posts.map((post, index) => (
              <div key={post.id} className='bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-2'>
                {/* Gradient bar - different color for each post */}
                <div className={`h-3 bg-gradient-to-r ${gradientOptions[index % gradientOptions.length]}`}></div>
                <div className='p-6'>
                  <h2 className='text-xl font-semibold text-gray-800 mb-2'>{post.title}</h2>
                  <p className='text-gray-500 text-sm mb-4'>{new Date(post.date).toLocaleDateString()}</p>
                  <p className='text-gray-700 mb-4'>{post.snippet}</p>
                  <div className='flex flex-wrap gap-2 mb-4'>
                    {post.tags.map(tag => (
                      <span key={tag} className='bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded'>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={`/blog/${post.id}`}
                    className='inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition'
                  >
                    Read More
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Blog