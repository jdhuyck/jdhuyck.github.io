import { useParams } from 'react-router-dom'
import { BlogPost as BlogPostType } from '../types/blog'

const mockBlogPosts: BlogPostType[] = [
  {
    id: '1',
    title: 'Getting Started with React and TypeScript',
    date: '2023-05-15',
    tags: ['React', 'TypeScript', 'Web Development'],
    content: `
      <h2>Introduction</h2>
      <p>React with TypeScript provides a powerful combination for building modern web applications.</p>
      
      <h2>Setting Up</h2>
      <p>To get started, create a new project using Vite:</p>
      <pre>npm create vite@latest my-react-ts-app -- --template react-ts</pre>
      
      <h2>Benefits</h2>
      <p>TypeScript adds static typing to JavaScript, helping catch errors during development.</p>
    `,
    snippet: 'Learn how to set up a React project with TypeScript and avoid common pitfalls.'
  },
  {
    id: '2',
    title: 'Mastering Tailwind CSS',
    date: '2023-06-22',
    tags: ['CSS', 'Tailwind', 'Frontend'],
    content: `
      <h2>What is Tailwind CSS?</h2>
      <p>Tailwind CSS is a utility-first CSS framework that allows you to rapidly build custom user interfaces.</p>
      
      <h2>Key Features</h2>
      <ul>
        <li>Utility-first approach</li>
        <li>Responsive design</li>
        <li>Component-friendly</li>
      </ul>
    `,
    snippet: 'Discover advanced techniques for using Tailwind CSS in your projects.'
  }
]

const BlogPost = () => {
  const { id } = useParams<{ id: string }>()
  const post = mockBlogPosts.find(post => post.id === id)

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Post Not Found</h1>
        <p className="mt-4">The blog post you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <article className="container mx-auto px-4 py-8 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
        <p className="text-gray-500">{new Date(post.date).toLocaleDateString()}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {post.tags.map(tag => (
            <span key={tag} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      </header>
      
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  )
}

export default BlogPost