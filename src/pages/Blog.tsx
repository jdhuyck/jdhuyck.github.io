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
  },
  {
    id: '3',
    title: 'Building Scalable Data Pipelines',
    date: '2023-07-10',
    tags: ['Data Engineering', 'Python', 'ETL'],
    content: 'Designing robust data pipelines that can scale with your business needs...',
    snippet: 'Explore best practices for creating maintainable and scalable data infrastructure.'
  },
  {
    id: '4',
    title: 'API Integration Patterns',
    date: '2023-08-05',
    tags: ['API', 'Integration', 'REST'],
    content: 'Common patterns and best practices for integrating with third-party APIs...',
    snippet: 'Learn effective strategies for reliable API integrations.'
  },
  {
    id: '5',
    title: 'Database Optimization Techniques',
    date: '2023-09-12',
    tags: ['Database', 'SQL', 'Performance'],
    content: 'How to optimize database queries and improve application performance...',
    snippet: 'Practical techniques for database performance tuning.'
  },
  {
    id: '6',
    title: 'CI/CD for Data Projects',
    date: '2023-10-18',
    tags: ['CI/CD', 'Data Engineering', 'Automation'],
    content: 'Implementing continuous integration and deployment for data projects...',
    snippet: 'Streamline your data workflows with modern CI/CD practices.'
  }
]

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
  const [posts] = useState<BlogPostType[]>(mockBlogPosts)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Blog</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <div key={post.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
              {/* Gradient bar - different color for each post */}
              <div className={`h-3 bg-gradient-to-r ${gradientOptions[index % gradientOptions.length]}`}></div>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{post.title}</h2>
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
    </div>
  )
}

export default Blog