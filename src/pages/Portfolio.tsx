const Portfolio = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Section */}
      <header className="bg-[#2c3e50] text-white py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2c3e50]/90 to-[#3498db]/80"></div>
        <div className="container mx-auto px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Jody Huyck-Jones</h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto mb-8">
            Data Engineer | Data Scientist | Back End Developer
          </p>
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <a href="tel:+447305624769" className="text-white flex items-center gap-2">
              <i className="fas fa-phone"></i> (+44)7305‑624769
            </a>
            <a href="mailto:jodyhj@outlook.com" className="text-white flex items-center gap-2">
              <i className="fas fa-envelope"></i> jodyhj@outlook.com
            </a>
            <span className="text-white flex items-center gap-2">
              <i className="fas fa-map-marker-alt"></i> London, UK
            </span>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#contact" className="bg-[#3498db] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#e74c3c] transition">
              Get in Touch
            </a>
            <a href="resources/Jody Huyck-Jones resume.pdf" className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-[#2c3e50] transition" download>
              <i className="fas fa-download mr-2"></i> Download Resume
            </a>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-8">
          <h2 className="text-3xl font-bold text-center text-[#2c3e50] mb-12 relative 
                        after:content-[''] after:absolute after:bottom-[-12px] after:left-1/2 
                        after:transform after:-translate-x-1/2 after:w-20 after:h-1 after:bg-[#3498db]">
            Professional Summary
          </h2>
          <p className="max-w-4xl mx-auto mb-12 text-center text-gray-700">
            Results-driven Data Scientist and Engineer with expertise in backend systems, API integrations, and data pipeline automation. 
            Proven ability to lead projects from concept to deployment, including Gmail and Shopify API implementations and database architecture.
          </p>

          <h3 className="text-2xl font-semibold mb-8 text-center text-[#2c3e50]">Technical Skills</h3>
          <div className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-center">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-[#3498db] text-xl font-semibold mb-4 border-b-2 border-gray-100 pb-2">Languages</h4>
                <ul className="list-disc pl-5 text-gray-700">
                  <li>Python (Pandas, NumPy, FastAPI)</li>
                  <li>SQL</li>
                  <li>Rust</li>
                  <li>JavaScript</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-[#3498db] text-xl font-semibold mb-4 border-b-2 border-gray-100 pb-2">APIs & Services</h4>
                <ul className="list-disc pl-5 text-gray-700">
                  <li>Google, Shopify and Discord APIs</li>
                  <li>RESTful Services</li>
                  <li>AWS S3</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-[#3498db] text-xl font-semibold mb-4 border-b-2 border-gray-100 pb-2">Tools & Concepts</h4>
                <ul className="list-disc pl-5 text-gray-700">
                  <li>PostgreSQL, MongoDB</li>
                  <li>Git, Docker, Github Actions</li>
                  <li>Data Modeling, CI Development</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-8">
          <h2 className="text-3xl font-bold text-center text-[#2c3e50] mb-12 relative 
                        after:content-[''] after:absolute after:bottom-[-12px] after:left-1/2 
                        after:transform after:-translate-x-1/2 after:w-20 after:h-1 after:bg-[#3498db]">
            Professional Experience
          </h2>

          <div className="max-w-4xl mx-auto">
            <article className="bg-white rounded-lg shadow-md p-8 mb-8 transition-all duration-300 hover:-translate-y-1">
              <div className="mb-6 pb-4 border-b-2 border-gray-100">
                <h3 className="text-2xl font-semibold text-[#3498db] mb-2">Associate Data Scientist & Engineer</h3>
                <h4 className="text-xl text-gray-600 font-normal">PreWarp, United Kingdom</h4>
              </div>
              <ul className="list-disc pl-6 text-gray-700">
                <li className="mb-3 relative before:content-['•'] before:text-[#3498db] before:font-bold before:absolute before:-left-4">
                  Led end-to-end implementation of Gmail API integration to automate processing and storage of client emails
                </li>
                <li className="mb-3 relative before:content-['•'] before:text-[#3498db] before:font-bold before:absolute before:-left-4">
                  Designed data pipelines ingesting Shopify API data into PostgreSQL
                </li>
                <li className="mb-3 relative before:content-['•'] before:text-[#3498db] before:font-bold before:absolute before:-left-4">
                  Developed unified product mapping system for client specialty stores
                </li>
                <li className="mb-3 relative before:content-['•'] before:text-[#3498db] before:font-bold before:absolute before:-left-4">
                  Architected AWS S3 storage solution improving query efficiency
                </li>
              </ul>
            </article>

            <article className="bg-white rounded-lg shadow-md p-8 mb-8 transition-all duration-300 hover:-translate-y-1">
              <div className="mb-6 pb-4 border-b-2 border-gray-100">
                <h3 className="text-2xl font-semibold text-[#3498db] mb-2">Lab Technician</h3>
                <h4 className="text-xl text-gray-600 font-normal">Middlesex University, London</h4>
              </div>
              <ul className="list-disc pl-6 text-gray-700">
                <li className="mb-3 relative before:content-['•'] before:text-[#3498db] before:font-bold before:absolute before:-left-4">
                  Automated server terminal updates using bash and python scripts
                </li>
                <li className="mb-3 relative before:content-['•'] before:text-[#3498db] before:font-bold before:absolute before:-left-4">
                  Optimized network infrastructure to improve data transfer efficiency
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-8">
          <h2 className="text-3xl font-bold text-center text-[#2c3e50] mb-12 relative 
                        after:content-[''] after:absolute after:bottom-[-12px] after:left-1/2 
                        after:transform after:-translate-x-1/2 after:w-20 after:h-1 after:bg-[#3498db]">
            Featured Projects
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:-translate-y-2">
              <div className="h-3 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-[#3498db] mb-2">Shopify Data Mapper</h3>
                <p className="text-gray-600 mb-4">Python, PostgreSQL</p>
                <ul className="list-disc pl-6 text-gray-700">
                  <li className="mb-2">Engineered relational database schema for SKU data extraction via Shopify API</li>
                  <li className="mb-2">Implemented specialty store integrations for wholesale reporting systems</li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:-translate-y-2">
              <div className="h-3 bg-gradient-to-r from-green-400 to-teal-500"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-[#3498db] mb-2">Email Processing Automation</h3>
                <p className="text-gray-600 mb-4">AWS S3, PostgreSQL, Google API, FastAPI</p>
                <ul className="list-disc pl-6 text-gray-700">
                  <li className="mb-2">Designed relational data structures for client email analysis</li>
                  <li className="mb-2">Integrated S3 storage protocols for Google API REST objects</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-8">
          <h2 className="text-3xl font-bold text-center text-[#2c3e50] mb-12 relative 
                        after:content-[''] after:absolute after:bottom-[-12px] after:left-1/2 
                        after:transform after:-translate-x-1/2 after:w-20 after:h-1 after:bg-[#3498db]">
            Education
          </h2>
          
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold text-[#3498db] mb-2">BSc Mathematics and Computer Science</h3>
            <h4 className="text-xl text-gray-600 font-normal mb-4">University of York, United Kingdom</h4>
            <p className="mb-4 text-gray-700">
              <strong>Relevant Coursework:</strong> Algorithms, Relational Databases, Machine and Deep Learning, 
              Statistical Modelling, High-Integrity Systems Engineering
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li className="mb-2">Built computer vision classification systems using TensorFlow</li>
              <li className="mb-2">Conducted topological data analysis using Persistent Homology with R</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-white">
        <div className="container mx-auto px-8 max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-center text-[#2c3e50] mb-12 relative 
                        after:content-[''] after:absolute after:bottom-[-12px] after:left-1/2 
                        after:transform after:-translate-x-1/2 after:w-20 after:h-1 after:bg-[#3498db]">
            Get in Touch
          </h2>
          
          <a href="mailto:jodyhj@outlook.com" className="bg-[#3498db] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#e74c3c] transition inline-block mb-8">
            Email Me
          </a>
          
          <div className="social-links flex flex-col md:flex-row justify-center gap-8 mt-8 text-gray-700">
            <a href="https://github.com/jdhuyck" className="flex items-center gap-2 text-lg hover:text-[#3498db] transition">
              <i className="fab fa-github"></i> Github
            </a>
            <a href="https://www.linkedin.com/in/jodyhj" className="flex items-center gap-2 text-lg hover:text-[#3498db] transition">
              <i className="fab fa-linkedin"></i> LinkedIn
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2c3e50] text-white py-8 text-center">
        <div className="container mx-auto px-8">
          <p>&copy; {currentYear} Jody Huyck-Jones. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;