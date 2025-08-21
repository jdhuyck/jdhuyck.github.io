import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BlogPost as BlogPostType } from '../types/blog'

// Mock data - in Phase 2, this will come from external files
const mockBlogPosts: BlogPostType[] = [
  {
    id: '1',
    title: 'Getting Started with React and TypeScript',
    date: '2023-05-15',
    tags: ['React', 'TypeScript', 'Web Development'],
    content: 'This is a brief introduction to using React with TypeScript...',
    snippet: 'Learn how to set up a React project with TypeScript and avoid common pitfalls.'
  },
  {
    id: '2',
    title: 'Mastering Tailwind CSS',
    date: '2023-06-22',
    tags: ['CSS', 'Tailwind', 'Frontend'],
    content: 'Tailwind CSS is a utility-first framework that allows you to rapidly build custom user interfaces...',
    snippet: 'Discover advanced techniques for using Tailwind CSS in your projects.'
  }
]

const Blog = () => {
  const [posts] = useState<BlogPostType[]>(mockBlogPosts)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Blog</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <p className="text-gray-500 text-sm mb-4">{new Date(post.date).toLocaleDateString()}</p>
              <p className="text-gray-700 mb-4">{post.snippet}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <Link 
                to={`/blog/${post.id}`} 
                className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              >
                Read More
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Blog