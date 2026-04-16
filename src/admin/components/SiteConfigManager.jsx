import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase/init';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export default function SiteConfigManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ video: 0, about: 0 });
  const [status, setStatus] = useState({ type: '', msg: '' });

  const [form, setForm] = useState({
    tag: '',
    title: '',
    subtitle: '',
    videoUrl: '',
    btnPrimaryText: '',
    btnPrimaryLink: '',
    btnSecondaryText: '',
    btnSecondaryLink: '',
    whatsappNumber: '',
    whatsappDefaultMessage: 'Hola ISOLE, quiero información sobre una sesión.',
    // Nosotros (About)
    aboutTitle: 'DONDE LOS VEHÍCULOS SE VUELVEN CINE',
    aboutP1: '',
    aboutP2: '',
    aboutImageUrl: '/LERM.jpeg',
    stat1Value: 200, stat1Label: 'producciones entregadas', stat1Prefix: '+',
    stat2Value: 5, stat2Label: 'años creando contenido visual', stat2Prefix: '+',
    stat3Value: 3, stat3Label: 'tipos de clientes', stat3Prefix: ''
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'site_config', 'hero');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setForm(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (err) {
        console.error('Error cargando configuración', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    const path = type === 'video' ? `site_assets/hero_bg_${Date.now()}` : `site_assets/about_img_${Date.now()}`;
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(prev => ({ ...prev, [type]: progress }));
      },
      (error) => {
        console.error(error);
        setStatus({ type: 'error', msg: `Error al subir.` });
        setSaving(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setForm(prev => ({ ...prev, [type === 'video' ? 'videoUrl' : 'aboutImageUrl']: downloadURL }));
        setUploadProgress(prev => ({ ...prev, [type]: 0 }));
        setSaving(false);
        setStatus({ type: 'success', msg: `Archivo subido correctamente. Haz clic en el botón de abajo para sincronizar.` });
      }
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', msg: '' });

    try {
      await setDoc(doc(db, 'site_config', 'hero'), {
        ...form,
        updatedAt: serverTimestamp()
      });
      setStatus({ type: 'success', msg: '¡Website sincronizado con éxito!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Error al sincronizar.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="panel">Cargando configuración global...</div>;

  return (
    <div className="manager-shell">
      <div className="section-header">
        <h3>Gestor de Sitio ISOLE</h3>
        <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
          Configura cada detalle visual y textual de la landing page.
        </p>
      </div>

      {status.msg && (
        <div className={status.type === 'error' ? 'error-text' : 'success-text'} style={{ marginBottom: 24, padding: 15, borderRadius: 12 }}>
          {status.msg}
        </div>
      )}

      <form onSubmit={handleSave} className="config-form">
        
        {/* --- PORTADA (HERO) --- */}
        <div className="config-section-premium">
          <h4 className="config-subtitle">1. Portada Principal (Hero)</h4>
          
          <div className="form-group-row">
            <div style={{ flex: 1 }}>
              <label>Video de Fondo (Master)</label>
              <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} />
              {uploadProgress.video > 0 && <progress value={uploadProgress.video} max="100" style={{width:'100%'}} />}
              <small style={{opacity: 0.5}}>{form.videoUrl ? 'Video actual configurado' : 'Sin video subido'}</small>
            </div>
            <div style={{ flex: 1 }}>
              <label>Etiqueta Superior (Tag)</label>
              <input name="tag" value={form.tag} onChange={handleChange} placeholder="Ej: VEHÍCULOS · EVENTOS" />
            </div>
          </div>

          <label>Título Gran Formato (H1)</label>
          <input name="title" value={form.title} onChange={handleChange} style={{fontSize: '1.2rem', fontWeight: 800}} />

          <label>Subtítulo / Impacto</label>
          <textarea name="subtitle" rows="3" value={form.subtitle} onChange={handleChange} placeholder="Describe el estudio..." />
        </div>

        {/* --- BOTONES Y WHATSAPP --- */}
        <div className="config-section-premium" style={{marginTop: 30}}>
          <h4 className="config-subtitle">2. Acciones y WhatsApp</h4>
          
          <div className="form-group-row">
            <div style={{ flex: 1 }}>
              <label>Botón Principal (Texto)</label>
              <input name="btnPrimaryText" value={form.btnPrimaryText} onChange={handleChange} />
              <label>Link / Sección</label>
              <input name="btnPrimaryLink" value={form.btnPrimaryLink} onChange={handleChange} placeholder="#gallery" />
            </div>
            <div style={{ flex: 1 }}>
              <label>Botón Secundario (Texto)</label>
              <input name="btnSecondaryText" value={form.btnSecondaryText} onChange={handleChange} />
              <label>Link / Sección</label>
              <input name="btnSecondaryLink" value={form.btnSecondaryLink} onChange={handleChange} placeholder="#booking o wa.me" />
            </div>
          </div>

          <div style={{background: 'rgba(37, 211, 102, 0.05)', padding: 15, borderRadius: 12, marginTop: 15, border: '1px solid rgba(37, 211, 102, 0.2)'}}>
            <label style={{color: '#25D366'}}>Número de WhatsApp (Empresarial)</label>
            <input name="whatsappNumber" value={form.whatsappNumber} onChange={handleChange} placeholder="58424..." />
            <label style={{color: '#25D366'}}>Mensaje Directo Automático</label>
            <input name="whatsappDefaultMessage" value={form.whatsappDefaultMessage} onChange={handleChange} />
          </div>
        </div>

        {/* --- NOSOTROS (ABOUT) --- */}
        <div className="config-section-premium" style={{marginTop: 30}}>
            <h4 className="config-subtitle">3. Nuestra Historia (About)</h4>
            <div className="form-group-row">
                <div style={{ flex: 1 }}>
                    <label>Título de Sección</label>
                    <input name="aboutTitle" value={form.aboutTitle} onChange={handleChange} />
                    <label>Primer Párrafo</label>
                    <textarea name="aboutP1" rows="4" value={form.aboutP1} onChange={handleChange} />
                    <label>Segundo Párrafo</label>
                    <textarea name="aboutP2" rows="4" value={form.aboutP2} onChange={handleChange} />
                </div>
                <div style={{ flex: 0.6 }}>
                    <label>Fotografía de Portada (Nosotros)</label>
                    <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', height: 350, border: '1px solid rgba(255,255,255,0.1)' }}>
                        <img src={form.aboutImageUrl} alt="Director" style={{width:'100%', height:'100%', objectFit: 'cover'}} />
                        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background:'rgba(0,0,0,0.4)'}}>
                             <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'about')} style={{position:'absolute', inset: 0, opacity: 0, cursor: 'pointer'}} />
                             <span style={{background:'#fff', color:'#000', padding: '8px 16px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700}}>Cambiar Foto</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- CIFRAS (STATS) --- */}
        <div className="config-section-premium" style={{marginTop: 30}}>
            <h4 className="config-subtitle">4. Estadísticas (Cifras)</h4>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20}}>
                {[1,2,3].map(i => (
                    <div key={i} style={{background: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)'}}>
                        <div style={{display:'flex', gap: 5}}>
                            <input name={`stat${i}Prefix`} value={form[`stat${i}Prefix`]} onChange={handleChange} placeholder="+" style={{width: 50}} />
                            <input name={`stat${i}Value`} type="number" value={form[`stat${i}Value`]} onChange={handleChange} placeholder="200" style={{flex: 1}} />
                        </div>
                        <label style={{marginTop: 10}}>Etiqueta (Descripción)</label>
                        <input name={`stat${i}Label`} value={form[`stat${i}Label`]} onChange={handleChange} placeholder="producciones" />
                    </div>
                ))}
            </div>
        </div>

        <button type="submit" disabled={saving} className="btn-sync">
          {saving ? 'SINCRONIZANDO...' : 'SINCRONIZAR WEBSITE'}
        </button>

      </form>

      <style>{`
        .config-section-premium { background: rgba(255,255,255,0.02); padding: 25px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .config-subtitle { font-family: var(--font-fancy); color: #fff; letter-spacing: 3px; font-size: 0.9rem; text-transform: uppercase; margin-bottom: 25px; border-left: 3px solid #fff; padding-left: 15px; }
        .config-form label { display: block; font-size: 0.7rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 700; }
        .config-form input, .config-form textarea { width: 100%; margin-bottom: 15px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; color: #fff; }
        .btn-sync { width: 100%; margin-top: 50px; padding: 25px; border-radius: 20px; border: none; background: #fff; color: #000; font-weight: 900; font-size: 1.2rem; cursor: pointer; transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1); letter-spacing: 2px; }
        .btn-sync:hover { transform: scale(1.02); box-shadow: 0 0 50px rgba(255,255,255,0.3); }
        .btn-sync:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
