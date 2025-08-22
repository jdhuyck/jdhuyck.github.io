import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BlogPost as BlogPostType } from '../types/blog'
import { getBlogPostById } from '../lib/blogUtils'
import BlogPostTemplate from '../components/BlogPostTemplate'

const BlogPost = () => {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<BlogPostType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPost = async () => {
      if (!id) return
      try {
        const blogPost = await getBlogPostById(id)
        setPost(blogPost)
      } catch (error) {
        console.error('Error loading blog post:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [id])

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-16 px-4'>
        <div className='max-w-4xl mx-auto'>Loading post...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Post Not Found</h1>
        <p className="mt-4">The blog post you're looking for doesn't exist.</p>
      </div>
    )
  }

  return <BlogPostTemplate {...post} />
}

export default BlogPost