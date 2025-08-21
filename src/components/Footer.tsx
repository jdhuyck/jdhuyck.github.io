import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-dark text-white py-8 text-center">
      <div className="container mx-auto px-8">
        <p>&copy; {currentYear} Jody Huyck-Jones. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;