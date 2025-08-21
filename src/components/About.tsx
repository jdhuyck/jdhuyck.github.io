import React from 'react';

const About: React.FC = () => {
  return (
    <section id="about" className="py-16">
      <div className="container mx-auto px-8">
        <h2 className="section-title">Professional Summary</h2>
        <p className="max-w-4xl mx-auto mb-12">
          Results-driven Data Scientist and Engineer with expertise in backend systems, API integrations, and data pipeline automation. 
          Proven ability to lead projects from concept to deployment, including Gmail and Shopify API implementations and database architecture.
        </p>

        <h3 className="text-2xl font-semibold mb-8 text-center">Technical Skills</h3>
        <div className="skills-container mt-8">
          <div className="skills-grid grid grid-cols-1 md:grid-cols-3 gap-8 justify-center">
            <div className="skill-category bg-white p-6 rounded shadow-md">
              <h4 className="text-secondary text-xl font-semibold mb-4 border-b-2 border-light pb-2">Languages</h4>
              <ul className="list-disc pl-5">
                <li>Python (Pandas, NumPy, FastAPI)</li>
                <li>SQL</li>
                <li>Rust</li>
                <li>JavaScript</li>
              </ul>
            </div>
            <div className="skill-category bg-white p-6 rounded shadow-md">
              <h4 className="text-secondary text-xl font-semibold mb-4 border-b-2 border-light pb-2">APIs & Services</h4>
              <ul className="list-disc pl-5">
                <li>Google, Shopify and Discord APIs</li>
                <li>RESTful Services</li>
                <li>AWS S3</li>
              </ul>
            </div>
            <div className="skill-category bg-white p-6 rounded shadow-md">
              <h4 className="text-secondary text-xl font-semibold mb-4 border-b-2 border-light pb-2">Tools & Concepts</h4>
              <ul className="list-disc pl-5">
                <li>PostgreSQL, MongoDB</li>
                <li>Git, Docker, Github Actions</li>
                <li>Data Modeling, CI Development</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;