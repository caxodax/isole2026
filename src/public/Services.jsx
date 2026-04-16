import React, { useEffect, useState } from 'react';
import "./Services.css";
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/init';

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const q = query(collection(db, 'services'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setServices(list);
      } catch (e) {
        console.error('Error cargando servicios', e);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <section id="services">
      <div className="section-header">
        <span className="section-tag">Propuesta</span>
        <h2 className="section-title">Servicios ISOLE</h2>
        <p className="section-sub">
          Producción de foto y video diseñada para que tu marca se vea como se
          siente: potente, precisa y memorable.
        </p>
      </div>

      {loading && (
        <div className="services-grid">
           {[1,2,3].map(i => <div key={i} className="service-card skeleton shimmer" style={{height: 350, borderRadius: 24}}></div>)}
        </div>
      )}

      {!loading && services.length === 0 && (
        <p className="gallery-empty">Próximamente definiremos nuestros servicios aquí.</p>
      )}

      <div className="services-grid">
        {!loading && services.map((s, index) => (
          <article key={s.id} className="service-card-premium fade-in">
            <div className="service-card-ambient-glow" />
            
            <div className="service-card-header">
              <span className="service-card-number">{String(index + 1).padStart(2, '0')}</span>
              {s.badge && <span className="service-card-badge">{s.badge}</span>}
            </div>

            <div className="service-card-content">
              <h3 className="service-card-title">{s.name}</h3>
              {s.tagline && <p className="service-card-tagline">{s.tagline}</p>}
              <div className="service-card-divider" />
              {s.description && <p className="service-card-desc">{s.description}</p>}
            </div>

            <div className="service-card-footer">
              <div className="service-card-price">
                <span className="price-label">Inversión</span>
                <span className="price-amount">{s.priceFrom}</span>
              </div>
              <button
                type="button"
                className="service-card-btn"
                onClick={() => {
                  const target = document.getElementById('booking');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Inicia tu proyecto
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
