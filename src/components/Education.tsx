import React from 'react';

const Education: React.FC = () => {
  return (
    <section id="education" className="py-16 bg-light">
      <div className="container mx-auto px-8">
        <h2 className="section-title">Education</h2>
        
        <div className="education-item max-w-4xl mx-auto">
          <h3 className="text-2xl font-semibold text-primary mb-2">BSc Mathematics and Computer Science</h3>
          <h4 className="text-xl text-gray-600 font-normal mb-4">University of York, United Kingdom</h4>
          <p className="mb-4">
            <strong>Relevant Coursework:</strong> Algorithms, Relational Databases, Machine and Deep Learning, 
            Statistical Modelling, High-Integrity Systems Engineering
          </p>
          <ul className="list-disc pl-6">
            <li className="mb-2">Built computer vision classification systems using TensorFlow</li>
            <li className="mb-2">Conducted topological data analysis using Persistent Homology with R</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Education;