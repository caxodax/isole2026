import React, { useEffect, useState } from "react";
import "./About.css";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/init";

function StatPill({ value, label, prefix, delay = 0 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frameId;
    const duration = 1200; // ms
    const startAt = performance.now() + delay;

    const step = (now) => {
      if (now < startAt) {
        frameId = requestAnimationFrame(step);
        return;
      }
      const progress = Math.min((now - startAt) / duration, 1);
      const current = Math.round(Number(value) * progress);
      setDisplayValue(current);
      if (progress < 1) frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, delay]);

  return (
    <div className="about-stat-card">
      <div className="about-stat-accent" />
      <div className="about-stat-number">
        <span className="stat-prefix">{prefix}</span>
        {displayValue}
      </div>
      <div className="about-stat-label">{label}</div>
    </div>
  );
}

export default function About() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const snap = await getDoc(doc(db, 'site_config', 'hero'));
        if (snap.exists()) {
          setConfig(snap.data());
        }
      } catch (err) {
        console.error("Error cargando sección nosotros", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAbout();
  }, []);

  // Datos dinámicos con Fallbacks
  const data = {
    title: config?.aboutTitle || "DONDE LOS VEHÍCULOS SE VUELVEN CINE",
    p1: config?.aboutP1 || "ISOLE es un estudio de fotografía y video especializado en el mundo automotriz. Buscamos ángulos, texturas y reflejos que hagan que cada vehículo se vea como una pieza de diseño.",
    p2: config?.aboutP2 || "Trabajamos con marcas, negocios y entusiastas que quieren contenido con presencia real: piezas pensadas para redes, campañas y lanzamientos donde la imagen habla por sí sola.",
    imageUrl: config?.aboutImageUrl || "/LERM.jpeg",
    stats: [
      { id: 1, value: config?.stat1Value || 200, label: config?.stat1Label || "producciones entregadas", prefix: config?.stat1Prefix || "+" },
      { id: 2, value: config?.stat2Value || 5, label: config?.stat2Label || "años creando contenido visual", prefix: config?.stat2Prefix || "+" },
      { id: 3, value: config?.stat3Value || 3, label: config?.stat3Label || "tipos de clientes: marcas, talleres y proyectos personales", prefix: config?.stat3Prefix || "" },
    ]
  };

  return (
    <section id="about">
      <div className="about-container">
        <div className="about-grid">
          
          <div className="about-content fade-in">
            <span className="about-pre">Filtro Visual</span>
            <h2 className="about-title">{data.title}</h2>
            
            <div className="about-text-group">
                <p className="about-p">{data.p1}</p>
                <p className="about-p">{data.p2}</p>
            </div>

            <div className="about-stats-grid">
              {data.stats.map((stat, index) => (
                <StatPill
                  key={stat.id}
                  value={stat.value}
                  label={stat.label}
                  prefix={stat.prefix}
                  delay={index * 200}
                />
              ))}
            </div>
          </div>

          <div className="about-visual fade-in">
            <div className="about-image-frame">
              <img
                src={data.imageUrl}
                alt="Director de ISOLE"
                className="about-image-master"
              />
              <div className="about-image-overlay" />
            </div>
            {/* Decoración abstracta */}
            <div className="about-decor-box" />
          </div>

        </div>
      </div>
    </section>
  );
}
