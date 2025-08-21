import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-primary text-white py-20 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-secondary/80"></div>
      <div className="container mx-auto px-8 relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Jody Huyck-Jones</h1>
        <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto mb-8">
          Data Engineer | Data Scientist | Back End Developer
        </p>
        <div className="header-contact flex flex-wrap justify-center gap-6 mb-8">
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
        <a href="#contact" className="btn">Get in Touch</a>
        <a href="resources/Jody Huyck-Jones resume.pdf" className="btn secondary" download>
          <i className="fas fa-download mr-2"></i> Download Resume
        </a>
      </div>
    </header>
  );
};

export default Header;