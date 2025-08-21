import React from 'react';

const Experience: React.FC = () => {
  return (
    <section id="experience" className="py-16 bg-light">
      <div className="container mx-auto px-8">
        <h2 className="section-title">Professional Experience</h2>

        <div className="experience-articles max-w-4xl mx-auto">
          <article className="experience-item bg-white rounded shadow-md p-8 mb-8 transition-all duration-300 hover:-translate-y-1">
            <div className="experience-header mb-6 pb-4 border-b-2 border-light">
              <h3 className="text-2xl font-semibold text-primary mb-2">Associate Data Scientist & Engineer</h3>
              <h4 className="text-xl text-gray-600 font-normal">PreWarp, United Kingdom</h4>
            </div>
            <ul className="experience-details list-disc pl-6">
              <li className="mb-3 relative">
                Led end-to-end implementation of Gmail API integration to automate processing and storage of client emails
              </li>
              <li className="mb-3 relative">
                Designed data pipelines ingesting Shopify API data into PostgreSQL
              </li>
              <li className="mb-3 relative">
                Developed unified product mapping system for client specialty stores
              </li>
              <li className="mb-3 relative">
                Architected AWS S3 storage solution improving query efficiency
              </li>
            </ul>
          </article>

          <article className="experience-item bg-white rounded shadow-md p-8 mb-8 transition-all duration-300 hover:-translate-y-1">
            <div className="experience-header mb-6 pb-4 border-b-2 border-light">
              <h3 className="text-2xl font-semibold text-primary mb-2">Lab Technician</h3>
              <h4 className="text-xl text-gray-600 font-normal">Middlesex University, London</h4>
            </div>
            <ul className="experience-details list-disc pl-6">
              <li className="mb-3 relative">
                Automated server terminal updates using bash and python scripts
              </li>
              <li className="mb-3 relative">
                Optimized network infrastructure to improve data transfer efficiency
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
};

export default Experience;