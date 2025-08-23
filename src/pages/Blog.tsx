import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BlogFilters, BlogPost as BlogPostType } from '../types/blog'
import { getBlogPageData } from '../lib/blogUtils'
import ReactMarkdown from 'react-markdown'
import SearchFilter from '../components/blog/SearchFilter'
import Pagination from '../components/blog/Pagination'

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
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  const initialFilters: BlogFilters = {
    searchQuery: searchParams.get('search') || '',
    selectedTags: searchParams.get('tags')?.split(',') || [],
    sortBy: (searchParams.get('sort') as BlogFilters['sortBy']) || 'date-desc'
  }

  const [filters, setFilters] = useState<BlogFilters>(initialFilters)
  const [pagination, setPagination] = useState({
    currentPage: parseInt(searchParams.get('page') || '1'),
    postsPerPage: 6,
    totalPosts: 0
  })

  useEffect(() => {
    loadPosts()
  }, [filters, pagination.currentPage])

  useEffect(() => {
    // Update URL with current filters and pagination
    const params = new URLSearchParams()

    if (filters.searchQuery) params.set('search', filters.searchQuery)
    if (filters.selectedTags.length > 0) params.set('tags', filters.selectedTags.join(','))
    if (filters.sortBy !== 'date-desc') params.set('sort', filters.sortBy)
    if (pagination.currentPage > 1) params.set('page', pagination.currentPage.toString())

    setSearchParams(params)
  }, [filters, pagination.currentPage, setSearchParams])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const data = await getBlogPageData(
        pagination.currentPage,
        pagination.postsPerPage,
        filters
      )

      setPosts(data.posts)
      setAvailableTags(data.availableTags)
      setPagination(prev => ({ ...prev, totalPosts: data.pagination.totalPosts }))
    } catch (error) {
      console.error('Error loading blog posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersChange = (newFilters: BlogFilters) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth'})
  }

  if (loading && posts.length === 0) {
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

        {/* Search and Filter Component */}
        <SearchFilter
          filters={filters}
          availableTags={availableTags}
          onFiltersChange={handleFiltersChange}
          resultsCount={pagination.totalPosts}
        />

        {/* Blog Posts Grid */}
        {posts.length === 0 ? (
          <div className='text-center py-12 bg-white rounded-lg shadow-md'>
            <p className='text-gray-600 text-lg'>No posts found matching your criteria.</p>
            <p className='text-gray-400 mt-2'>Try adjusting your search filters</p>
          </div>
        ) : (
          <>
          <div className='grid grid-cols-1 md: grid-cols-2 lg:grid-cols-3 gap-8'>
            {posts.map((post, index) => (
              <div key={post.id} className='bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-2'>
                {/* Gradient bar */}
                <div className={`h-3 bg-gradient-to-r ${gradientOptions[index % gradientOptions.length]}`}></div>
                <div className='p-6'>
                  <h2 className='text-xl font-semibold text-gray-800 mb-2'>{post.title}</h2>
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
                    className='inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition'
                  >
                    Read More
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination Component */}
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
          />
          </>
        )}
      </div>
    </div>
  )
}

export default Blog;