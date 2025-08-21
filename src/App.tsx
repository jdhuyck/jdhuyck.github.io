import React from 'react';
import Header from './components/Header';
import About from './components/About';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Education from './components/Education';
import Contact from './components/Contact';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="App">
      <Header />
      <About />
      <Experience />
      <Projects />
      <Education />
      <Contact />
      <Footer />
    </div>
  );
};

export default App;