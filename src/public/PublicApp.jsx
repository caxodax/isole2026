import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';
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
      <Helmet>
        <title>ISOLE · Producción Fotográfica y Audiovisual</title>
        <meta name="description" content="Estudio de producción fotográfica y audiovisual profesional. Especialistas en moda, eventos y publicidad." />
      </Helmet>
      <Hero />
      <Gallery />
      <Videos />
      <Services />
      <About />
      <Testimonials />
      <Contact />
      <Analytics />
      <footer className="footer">
        ISOLE · Producción fotográfica y audiovisual · Todos los derechos reservados
      </footer>
    </div>
  );
}
