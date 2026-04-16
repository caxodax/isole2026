import React, { useEffect, useRef, useState } from 'react';
import "./Hero.css";
import gsap from 'gsap';
import { db } from '../firebase/init';
import { doc, getDoc } from 'firebase/firestore';

export default function Hero() {
  const [config, setConfig] = useState({
    tag: 'VEHÍCULOS · EVENTOS · CINE LOOK',
    title: 'ISOLE VISUAL ZONE',
    subtitle: 'Estudio audiovisual enfocado en texturas, reflejos y movimiento para marcas que quieren verse como cine, no como publicidad.',
    videoUrl: '/hero.mp4',
    btnPrimaryText: 'Ver portafolio',
    btnPrimaryLink: '#gallery',
    btnSecondaryText: 'Agendar sesión',
    btnSecondaryLink: '#booking'
  });

  const heroRef = useRef(null);
  const videoRef = useRef(null);
  const tagRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const buttonsRef = useRef(null);

  useEffect(() => {
    const fetchHeroConfig = async () => {
      try {
        const docRef = doc(db, 'site_config', 'hero');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setConfig(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (err) {
        console.error('Error cargando configuración de Hero', err);
      }
    };
    fetchHeroConfig();
  }, []);

  const handleAction = (link) => {
    if (link.startsWith('#')) {
      const target = document.getElementById(link.substring(1));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    } else if (link) {
      window.open(link, '_blank');
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (videoRef.current) {
        gsap.fromTo(
          videoRef.current,
          { scale: 1.08, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.4, ease: 'power3.out' }
        );
      }

      const tl = gsap.timeline({ delay: 0.2 });
      if (tagRef.current) tl.from(tagRef.current, { y: 12, opacity: 0, duration: 0.4, ease: 'power3.out' });
      if (titleRef.current) tl.from(titleRef.current, { y: 26, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.1');
      if (subtitleRef.current) tl.from(subtitleRef.current, { y: 18, opacity: 0, duration: 0.5, ease: 'power3.out' }, '-=0.2');
      if (buttonsRef.current) tl.from(buttonsRef.current.children, { y: 18, opacity: 0, duration: 0.4, ease: 'power3.out', stagger: 0.08 }, '-=0.2');
    }, heroRef);

    return () => ctx.revert();
  }, [config]); // Re-animar si cambia la config (ej: cambio en admin)

  return (
    <section className="hero" ref={heroRef}>
      <video
        key={config.videoUrl} 
        ref={videoRef}
        className="hero-video"
        src={config.videoUrl}
        autoPlay
        muted
        loop
        playsInline
      />

      <div className="hero-gradient" />

      <div className="hero-content">
        <div className="hero-logo">ISOLE STUDIO</div>

        <p className="hero-sub">{config.tag}</p>

        <div className="hero-inner">
          <div className="hero-tag" ref={tagRef}>{config.tag}</div>

          <h1 className="hero-title" ref={titleRef}>{config.title}</h1>

          <p className="hero-subtitle" ref={subtitleRef}>{config.subtitle}</p>

          <div className="hero-buttons" ref={buttonsRef}>
            {config.btnPrimaryText && (
              <button
                type="button"
                className="hero-btn hero-btn-primary"
                onClick={() => handleAction(config.btnPrimaryLink)}
              >
                {config.btnPrimaryText}
              </button>
            )}
            {config.btnSecondaryText && (
              <button
                type="button"
                className="hero-btn hero-btn-secondary"
                onClick={() => handleAction(config.btnSecondaryLink)}
              >
                {config.btnSecondaryText}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
