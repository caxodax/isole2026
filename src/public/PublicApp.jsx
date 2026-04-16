import React from 'react';
import "./Footer.css";
import Hero from './Hero.jsx';
import Gallery from './Gallery.jsx';
import Videos from './Videos.jsx';
import Services from './Services.jsx';
import About from './About.jsx';
import Testimonials from './Testimonials.jsx';
import Contact from './Contact.jsx';

export default function PublicApp() {
  return (
    <div className="public-root">
      <Hero />
      <Gallery />
      <Videos />
      <Services />
      <About />
      <Testimonials />
      <Contact />
      <footer className="footer">
        ISOLE · Producción fotográfica y audiovisual · Todos los derechos reservados
      </footer>
    </div>
  );
}
