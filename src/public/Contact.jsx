import React, { useState, useEffect } from "react";
import "./Contact.css";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/init";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    serviceType: "",
    date: "",
    notes: ""
  });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [config, setConfig] = useState({
    whatsappNumber: "584245935719",
    whatsappDefaultMessage: "Hola ISOLE, quiero información sobre una sesión."
  });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  // Cargar configuración de WhatsApp desde Firestore
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'site_config', 'hero'));
        if (snap.exists() && snap.data().whatsappNumber) {
          setConfig(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (err) {
        console.error("Error cargando config de contacto", err);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setSending(true);

    try {
      await addDoc(collection(db, "appointments"), {
        ...form,
        createdAt: serverTimestamp()
      });

      const subject = `Solicitud ISOLE - ${form.name}`;
      const body = [
        `Nombre: ${form.name}`,
        `WhatsApp: ${form.whatsapp}`,
        `Servicio: ${form.serviceType}`,
        `Fecha: ${form.date}`,
        `Notas: ${form.notes}`
      ].join("\n");

      window.location.href = `mailto:isoledesignvzla@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      setStatus("Solicitud guardada. Abriendo correo...");
      setForm({ name: "", whatsapp: "", serviceType: "", date: "", notes: "" });
    } catch (err) {
      console.error(err);
      setStatus("Error al enviar.");
    } finally {
      setSending(false);
    }
  };

  const waLink = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(config.whatsappDefaultMessage)}`;

  return (
    <section id="contact">
      <div className="contact-shell">
        <div className="contact-header">
          <p className="section-tag">Contacto</p>
          <h2 className="section-title">Agenda tu sesión con ISOLE</h2>
          <p className="section-sub">
            Estamos listos para llevar tu marca al siguiente nivel visual. 
            Escríbenos directamente o llena el formulario.
          </p>
        </div>

        <div className="contact-panel">
          <form onSubmit={handleSubmit} className="contact-form fade-in">
            <div className="contact-row">
              <div className="contact-field">
                <label>Nombre / marca</label>
                <input required name="name" value={form.name} onChange={handleChange} />
              </div>
              <div className="contact-field">
                <label>Tu WhatsApp</label>
                <input required name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="+58..." />
              </div>
            </div>

            <div className="contact-row">
              <div className="contact-field">
                <label>Tipo de servicio</label>
                <select required name="serviceType" value={form.serviceType} onChange={handleChange}>
                  <option value="">Seleccionar...</option>
                  <option value="foto">Foto Automotriz</option>
                  <option value="video">Reels / Video</option>
                  <option value="evento">Evento</option>
                </select>
              </div>
              <div className="contact-field">
                <label>Fecha aproximada</label>
                <input name="date" type="date" value={form.date} onChange={handleChange} />
              </div>
            </div>

            <div className="contact-field">
              <label>Cuéntanos más</label>
              <textarea name="notes" rows={4} value={form.notes} onChange={handleChange} placeholder="Detalles del proyecto..." />
            </div>

            <button type="submit" disabled={sending}>
              {sending ? "Cargando..." : "Enviar Solicitud"}
            </button>
            {status && <p className="contact-status">{status}</p>}
          </form>

          <div className="contact-direct fade-in">
            <h3>¿Prefieres hablar ya mismo?</h3>
            <p>Elige tu canal preferido. Atendemos solicitudes HD en menos de 24h.</p>

            <div className="contact-direct-actions">
              <a href={waLink} target="_blank" rel="noreferrer" className="direct-btn direct-whatsapp">
                <span className="direct-ic">💬</span>
                <span>WhatsApp Directo</span>
              </a>

              <a href="https://www.instagram.com/isolevzla" target="_blank" rel="noreferrer" className="direct-btn direct-instagram">
                <span className="direct-ic">📸</span>
                <span>Instagram</span>
              </a>

              <a href="mailto:isoledesignvzla@gmail.com" className="direct-btn direct-gmail">
                <span className="direct-ic">✉️</span>
                <span>Enviar Correo</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
