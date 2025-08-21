import React from 'react';

const Contact: React.FC = () => {
  return (
    <section id="contact" className="py-16">
      <div className="container mx-auto px-8 max-w-3xl text-center">
        <h2 className="section-title">Get in Touch</h2>
        
        <a href="mailto:jodyhj@outlook.com" className="btn mb-8">Email Me</a>
        
        <div className="social-links flex flex-col md:flex-row justify-center gap-8 mt-8">
          <a href="https://github.com/jdhuyck" className="flex items-center gap-2 text-lg">
            <i className="fab fa-github"></i> Github
          </a>
          <a href="https://www.linkedin.com/in/jodyhj" className="flex items-center gap-2 text-lg">
            <i className="fab fa-linkedin"></i> LinkedIn
          </a>
        </div>
      </div>
    </section>
  );
};

export default Contact;