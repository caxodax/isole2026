import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase/init';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export default function TestimonialManager() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState({ type: '', msg: '' });

  const [form, setForm] = useState({
    name: '',
    role: '',
    quote: '',
    image: '',
    order: ''
  });

  const loadTestimonials = async () => {
    try {
      const q = query(collection(db, 'testimonials'), orderBy('order', 'asc'));
      const snap = await getDocs(q);
      setTestimonials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    const storageRef = ref(storage, `testimonials/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(progress);
      },
      (error) => {
        console.error(error);
        setStatus({ type: 'error', msg: 'Error al subir imagen.' });
        setSaving(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setForm(prev => ({ ...prev, image: url }));
        setUploadProgress(0);
        setSaving(false);
        setStatus({ type: 'success', msg: 'Imagen subida correctamente.' });
      }
    );
  };

  const handleEdit = (t) => {
    setEditingId(t.id);
    setForm({
      name: t.name || '',
      role: t.role || '',
      quote: t.quote || '',
      image: t.image || '',
      order: t.order || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este testimonio?')) return;
    try {
      await deleteDoc(doc(db, 'testimonials', id));
      loadTestimonials();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', msg: '' });

    try {
      const data = {
        ...form,
        order: Number(form.order) || Date.now(),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'testimonials', editingId), data);
        setStatus({ type: 'success', msg: 'Testimonio actualizado.' });
      } else {
        await addDoc(collection(db, 'testimonials'), {
          ...data,
          createdAt: serverTimestamp()
        });
        setStatus({ type: 'success', msg: 'Testimonio creado.' });
      }

      setEditingId(null);
      setForm({ name: '', role: '', quote: '', image: '', order: '' });
      loadTestimonials();
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Error al guardar.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="manager-shell">
      <div className="section-header">
        <h3>Gestión de Experiencias (Testimonios)</h3>
        <p>Añade o edita los testimonios que aparecen en la sección de "Cine".</p>
      </div>

      {status.msg && <div className={`${status.type}-text`}>{status.msg}</div>}

      <form onSubmit={handleSave} className="panel" style={{padding: 24, background: 'rgba(255,255,255,0.02)', borderRadius: 20}}>
        <div className="form-group-row">
          <div style={{flex: 1}}>
            <label>Nombre del Cliente</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div style={{flex: 1}}>
            <label>Empresa / Cargo / Proyecto</label>
            <input name="role" value={form.role} onChange={handleChange} required />
          </div>
          <div style={{width: 80}}>
            <label>Orden</label>
            <input name="order" type="number" value={form.order} onChange={handleChange} />
          </div>
        </div>

        <label>Cita / Testimonio (Quote)</label>
        <textarea name="quote" rows="3" value={form.quote} onChange={handleChange} required />

        <div className="form-group-row" style={{marginTop: 15, alignItems: 'center'}}>
          <div style={{flex: 1}}>
            <label>Imagen del Proyecto (Recomendado 800x600)</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            {uploadProgress > 0 && <progress value={uploadProgress} max="100" style={{width:'100%'}} />}
          </div>
          {form.image && (
            <div style={{width: 100, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)'}}>
              <img src={form.image} alt="Preview" style={{width:'100%', height:'100%', objectFit: 'cover'}} />
            </div>
          )}
        </div>

        <div style={{display:'flex', gap: 10, marginTop: 20}}>
          <button type="submit" disabled={saving} style={{flex: 2}}>
            {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Testimonio'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm({name:'', role:'', quote:'', image:'', order:''}); }} style={{flex: 1, background: 'rgba(255,255,255,0.1)'}}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <h4 style={{marginTop: 40, marginBottom: 20}}>Testimonios Actuales</h4>
      <div className="testimonials-list" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20}}>
        {testimonials.map(t => (
          <div key={t.id} className="panel" style={{padding: 15, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)'}}>
            <div style={{display: 'flex', gap: 12}}>
              <img src={t.image} alt="" style={{width: 60, height: 60, borderRadius: 10, objectFit: 'cover'}} />
              <div style={{flex: 1}}>
                <div style={{fontWeight: 700, fontSize: '0.9rem'}}>{t.name}</div>
                <div style={{fontSize: '0.75rem', opacity: 0.5}}>{t.role}</div>
              </div>
            </div>
            <p style={{fontSize: '0.85rem', marginTop: 10, fontStyle: 'italic', opacity: 0.8}}>{t.quote}</p>
            <div style={{display: 'flex', gap: 10, marginTop: 15}}>
              <button onClick={() => handleEdit(t)} style={{flex: 1, padding: '8px', fontSize: '0.75rem'}}>Editar</button>
              <button onClick={() => handleDelete(t.id)} style={{flex: 1, padding: '8px', fontSize: '0.75rem', color: '#ff4d4d', background: 'rgba(255,77,77,0.1)'}}>Borrar</button>
            </div>
          </div>
        ))}
        {testimonials.length === 0 && !loading && <div style={{opacity: 0.5}}>No hay testimonios.</div>}
      </div>
    </div>
  );
}
