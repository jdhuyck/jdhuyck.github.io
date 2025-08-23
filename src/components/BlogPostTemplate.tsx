// components/BlogPostTemplate.tsx
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
      <Link to="/blog" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        &larr; Back to Blog
      </Link>
      
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{title}</h1>
        <p className="text-gray-600 mb-4">{new Date(date).toLocaleDateString()}</p>
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