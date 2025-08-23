import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { BlogPost as BlogPostType } from '../types/blog'
import { getAllBlogPosts } from '../lib/blogUtils'
import { useEffect, useState } from 'react'

// Gradient options for the blog post cards
const gradientOptions = [
  'from-blue-400 to-indigo-500',
  'from-green-400 to-teal-500',
  'from-purple-400 to-pink-500',
  'from-orange-400 to-red-500',
  'from-yellow-400 to-amber-500',
  'from-cyan-400 to-blue-500'
]

const Home = () => {
  const [featuredBlogPosts, setFeaturedBlogPosts] = useState<BlogPostType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFeaturedPosts = async () => {
      try {
        const allPosts = await getAllBlogPosts()
        const latestPosts = allPosts.slice(0, 2)
        setFeaturedBlogPosts(latestPosts)
      } catch (error) {
        console.error('Error loading featured blog posts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFeaturedPosts()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Hi, I'm <span className="text-blue-600">Jody Huyck-Jones</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Data Engineer | Data Scientist | Back End Developer
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/portfolio" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              View My Portfolio
            </Link>
            <Link 
              to="/blog" 
              className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
            >
              Read My Blog
            </Link>
          </div>
        </div>
      </section>

      {/* Skills Preview Section */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Technical Expertise</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-blue-600 mb-4">Languages</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  Python (Pandas, NumPy, FastAPI)
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  SQL
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  Rust
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  JavaScript
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-blue-600 mb-4">APIs & Services</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  Google, Shopify and Discord APIs
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  RESTful Services
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  AWS S3
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-blue-600 mb-4">Tools & Concepts</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  PostgreSQL, MongoDB
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  Git, Docker, Github Actions
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  Data Modeling, CI Development
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Blog Posts  Section*/}
      <section className='py-16 px-4 bg-gray-50'>
        <div className='max-w-6xl mx-auto'>
          <div className='flex justify-between items-center mb-12'>
            <h2 className='text-3xl font-bold text-gray-800'>Latest Blog Posts</h2>
            <Link
              to="/blog"
              className='text-blue-600 font-medium hover:text-blue-800 transition'
            >
              View All Posts →
            </Link>
          </div>

          {loading ? (
            <div className='text-center py-8'>
              <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              <p className='mt-2 text-gray-600'>Loading posts...</p>
            </div>
          ) : featuredBlogPosts.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-gray-600'>No blog posts yet.</p>
              <p className='text-sm text-gray-500 mt-2'>
                Check back soon for new content!
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              {featuredBlogPosts.map((post, index) => (
                <div key={post.id} className='bg-white rounded-xl overflow-hidden shadow-md hover:shadow:lg transition'>
                  <div className={`h-3 bg-gradient-to-r ${gradientOptions[index % gradientOptions.length]}`}></div>
                  <div className='p-6'>
                    <h3 className='text-xl font-semibold text-gray-800 mb-2'>{post.title}</h3>
                    <p className='text-gray-500 text-sm mb-4'>
                      {new Date(post.date).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>

                    {/* Formatted snippet */}
                    <div className='text-gray-700 mb-4 prose prose-sm max-w-none'>
                      <ReactMarkdown>
                        {post.snippet}
                      </ReactMarkdown>
                  </div>

                  <div className='flex flex-wrap gap-2 mb-4'>
                    {post.tags.map(tag => (
                      <span key={tag} className='bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded'>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={`/blog/${post.id}`}
                    className='inline-block text-blue-600 font-medium hover:text-blue-800 transition'
                  >
                    Read More →
                  </Link>
                </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Let's Work Together</h2>
          <p className="text-xl mb-8">I'm available for freelance projects and full-time opportunities</p>
          <a 
            href="mailto:jodyhj@outlook.com" 
            className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
          >
            Get In Touch
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-800 text-gray-300">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} Jody Huyck-Jones. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="https://github.com/jdhuyck" className="hover:text-white transition">GitHub</a>
            <a href="https://www.linkedin.com/in/jodyhj" className="hover:text-white transition">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home