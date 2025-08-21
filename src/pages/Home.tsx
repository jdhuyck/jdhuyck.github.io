import { Link } from 'react-router-dom'
import { BlogPost as BlogPostType } from '../types/blog'

// Mock data for featured blog posts
const featuredBlogPosts: BlogPostType[] = [
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

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Hi, I'm <span className="text-blue-600">John Doe</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Frontend Developer & UI/UX Enthusiast
          </p>
          <div className="flex justify-center gap-4">
            <a 
              href="#projects" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              View My Work
            </a>
            <Link 
              to="/blog" 
              className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
            >
              Read My Blog
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section id="projects" className="py-16 bg-white px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Featured Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Project 1 */}
            <div className="bg-gray-50 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition">
              <div className="h-48 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">E-Commerce Dashboard</h3>
                <p className="text-gray-600 mb-4">A responsive dashboard for e-commerce analytics with React and D3.js</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">React</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">TypeScript</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Tailwind</span>
                </div>
              </div>
            </div>

            {/* Project 2 */}
            <div className="bg-gray-50 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition">
              <div className="h-48 bg-gradient-to-r from-green-400 to-teal-500"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Task Management App</h3>
                <p className="text-gray-600 mb-4">A collaborative task management application with real-time updates</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">React</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Firebase</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Redux</span>
                </div>
              </div>
            </div>

            {/* Project 3 */}
            <div className="bg-gray-50 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition">
              <div className="h-48 bg-gradient-to-r from-purple-400 to-pink-500"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Weather Forecast</h3>
                <p className="text-gray-600 mb-4">A beautiful weather application with 7-day forecasts and location search</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Vue.js</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">OpenWeather API</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Chart.js</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Blog Posts Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Latest Blog Posts</h2>
            <Link 
              to="/blog" 
              className="text-blue-600 font-medium hover:text-blue-800 transition"
            >
              View All Posts →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredBlogPosts.map(post => (
              <div key={post.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{post.title}</h3>
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
                    className="inline-block text-blue-600 font-medium hover:text-blue-800 transition"
                  >
                    Read More →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Let's Work Together</h2>
          <p className="text-xl mb-8">I'm available for freelance projects and full-time opportunities</p>
          <a 
            href="mailto:contact@example.com" 
            className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
          >
            Get In Touch
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-800 text-gray-300">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} John Doe. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition">GitHub</a>
            <a href="#" className="hover:text-white transition">LinkedIn</a>
            <a href="#" className="hover:text-white transition">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home