import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

interface BlogPostTemplateProps {
  title: string;
  date: string;
  tags: string[];
  content: string;
}

const BlogPostTemplate: React.FC<BlogPostTemplateProps> = ({
  title,
  date,
  tags,
  content
}) => {
  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/blog"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition"
      >
        <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        &larr; Back to Blog
      </Link>
      
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{title}</h1>
        <p className="text-gray-600 mb-4">
          Published on {new Date(date).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span key={tag} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      </header>
      
      <div className="prose max-w-none">
        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
          {content}
        </ReactMarkdown>
      </div>
    </article>
  );
};

export default BlogPostTemplate;