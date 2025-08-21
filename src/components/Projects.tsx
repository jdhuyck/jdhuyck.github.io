import React from 'react';

const Projects: React.FC = () => {
  return (
    <section id="projects" className="py-16">
      <div className="container mx-auto px-8">
        <h2 className="section-title">Featured Projects</h2>
        
        <div className="projects-grid grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="project bg-white rounded shadow-md overflow-hidden transition-all duration-300 hover:-translate-y-2">
            <div className="project-content p-6">
              <h3 className="text-xl font-semibold text-primary mb-2">Shopify Data Mapper</h3>
              <p className="text-gray-600 mb-4">Python, PostgreSQL</p>
              <ul className="list-disc pl-6">
                <li className="mb-2">Engineered relational database schema for SKU data extraction via Shopify API</li>
                <li className="mb-2">Implemented specialty store integrations for wholesale reporting systems</li>
              </ul>
            </div>
          </div>

          <div className="project bg-white rounded shadow-md overflow-hidden transition-all duration-300 hover:-translate-y-2">
            <div className="project-content p-6">
              <h3 className="text-xl font-semibold text-primary mb-2">Email Processing Automation</h3>
              <p className="text-gray-600 mb-4">AWS S3, PostgreSQL, Google API, FastAPI</p>
              <ul className="list-disc pl-6">
                <li className="mb-2">Designed relational data structures for client email analysis</li>
                <li className="mb-2">Integrated S3 storage protocols for Google API REST objects</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;