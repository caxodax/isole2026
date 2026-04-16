import React, { useEffect, useState, useRef } from "react";
import "./Testimonials.css";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/init";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const q = query(collection(db, "testimonials"), orderBy("order", "asc"));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        
        // Fallback if empty
        if (list.length === 0) {
          setTestimonials([
            { id: "1", name: "Dirección de Marketing", role: "Marca Automotriz", quote: "ISOLE nos ayudó a que el lanzamiento del modelo se viera como un spot de marca global.", image: "/exp-marca.jpg" },
            { id: "2", name: "Propietario", role: "Taller Especializado", quote: "Las fotos y videos muestran el trabajo del taller con un nivel de detalle que antes no teníamos.", image: "/exp-taller.jpg" },
            { id: "3", name: "Cliente Particular", role: "Proyecto Personal", quote: "Quería algo diferente para mi proyecto personal y terminamos con una sesión de cine.", image: "/exp-personal.jpg" }
          ]);
        } else {
          setTestimonials(list);
        }
      } catch (e) {
        console.error("Error loading testimonials", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <section id="testimonials">
      <div className="section-header">
        <p className="section-tag">Experiencias ISOLE</p>
        <h2 className="section-title">Lo que dicen quienes ya se vieron en cine</h2>
        <p className="section-sub">
          Selección de proyectos donde la imagen hizo la diferencia. Estética cinematográfica aplicada a marcas y proyectos personales.
        </p>
      </div>

      <div className="carousel-wrapper fade-in">
        {testimonials.length > 3 && (
            <div className="carousel-controls">
                <button onClick={() => scroll("left")} className="carousel-btn prev" aria-label="Anterior">←</button>
                <button onClick={() => scroll("right")} className="carousel-btn next" aria-label="Siguiente">→</button>
            </div>
        )}

        <div className="exp-carousel" ref={scrollRef}>
          {testimonials.map((exp) => (
            <article key={exp.id} className="exp-card-premium">
              <div className="exp-image-wrap">
                <img src={exp.image} alt={exp.name} className="exp-image" loading="lazy" />
                <div className="exp-overlay" />
              </div>

              <div className="exp-body">
                <div className="exp-quote-icon">“</div>
                <p className="exp-quote">{exp.quote}</p>
                <div className="exp-footer">
                   <div className="exp-info">
                     <p className="exp-name">{exp.name}</p>
                     <p className="exp-role">{exp.role}</p>
                   </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
