import React, { useState } from 'react';
import { db } from '../../firebase/init';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export default function ServiceManager({ services, onRefresh }) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    description: '',
    badge: '',
    priceFrom: '',
    order: '',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEdit = (service) => {
    setEditingId(service.id);
    setForm({
      name: service.name || '',
      tagline: service.tagline || '',
      description: service.description || '',
      badge: service.badge || '',
      priceFrom: service.priceFrom ? service.priceFrom.replace('$', '') : '',
      order: service.order || '',
    });
    setStatus({ type: '', msg: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ name: '', tagline: '', description: '', badge: '', priceFrom: '', order: '' });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de eliminar el servicio "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'services', id));
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setStatus({ type: '', msg: '' });

    if (!form.name.trim()) {
      setStatus({ type: 'error', msg: 'El nombre del servicio es obligatorio.' });
      return;
    }

    setSaving(true);
    try {
      let formattedPrice = form.priceFrom.trim();
      // Si el usuario puso un $ al inicio, lo quitamos para ponerlo al final
      if (formattedPrice.startsWith('$')) {
        formattedPrice = formattedPrice.substring(1).trim();
      }
      
      if (formattedPrice && !formattedPrice.endsWith('$')) {
        formattedPrice = `${formattedPrice}$`;
      }

      const serviceData = {
        name: form.name.trim(),
        tagline: form.tagline.trim(),
        description: form.description.trim(),
        badge: form.badge.trim(),
        priceFrom: formattedPrice,
        order: form.order ? Number(form.order) : Date.now(),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'services', editingId), serviceData);
        setStatus({ type: 'success', msg: '¡Servicio actualizado!' });
      } else {
        await addDoc(collection(db, 'services'), {
          ...serviceData,
          createdAt: serverTimestamp(),
        });
        setStatus({ type: 'success', msg: '¡Servicio creado!' });
      }

      handleCancel();
      onRefresh();
    } catch (err) {
      console.error('Error guardando servicio', err);
      setStatus({ type: 'error', msg: 'Error al procesar el servicio.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="manager-shell">
      <div className="section-header">
        <h3>{editingId ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
        <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
          {editingId ? 'Modificando servicio existente.' : 'Define aquí los servicios que se mostrarán en la landing.'}
        </p>
      </div>

      {status.msg && (
        <div className={status.type === 'error' ? 'error-text' : 'success-text'}>
          {status.msg}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="form-group-row">
          <div style={{ flex: 1.5 }}>
            <label>Nombre del servicio</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Ej: Cobertura automotriz premium" />
          </div>
          <div style={{ flex: 1 }}>
            <label>Orden</label>
            <input name="order" type="number" value={form.order} onChange={handleChange} placeholder="Ej: 1" />
          </div>
        </div>

        <label>Subtítulo / claim corto</label>
        <input name="tagline" value={form.tagline} onChange={handleChange} placeholder="Ej: Fotos y reels que hacen que tu auto..." />

        <label>Descripción</label>
        <textarea name="description" rows="3" value={form.description} onChange={handleChange} placeholder="Detalles del paquete..." />

        <div className="form-group-row">
          <div style={{ flex: 1 }}>
            <label>Etiqueta / badge</label>
            <input name="badge" value={form.badge} onChange={handleChange} placeholder="Ej: Popular" />
          </div>
          <div style={{ flex: 1 }}>
            <label>Precio Desde ($)</label>
            <input name="priceFrom" value={form.priceFrom} onChange={handleChange} placeholder="Ej: 150" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" disabled={saving} style={{ flex: editingId ? 1.5 : 1 }}>
            {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Servicio'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancel} style={{ flex: 0.5, background: 'rgba(255,255,255,0.1)' }}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <h3 style={{ marginTop: 32 }}>Servicios actuales</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Ord</th>
            <th>Servicio</th>
            <th>Precio</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id}>
              <td>{s.order ?? '-'}</td>
              <td>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{s.tagline}</div>
              </td>
              <td style={{ color: '#7bff9a' }}>{s.priceFrom}</td>
              <td>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleEdit(s)} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.05)', color: '#7bff9a' }}>Editar</button>
                  <button onClick={() => handleDelete(s.id, s.name)} style={{ padding: '6px 10px', background: 'rgba(255,77,77,0.15)', color: '#ff4d4d' }}>× Borrar</button>
                </div>
              </td>
            </tr>
          ))}
          {services.length === 0 && (
            <tr><td colSpan="4" style={{ textAlign: 'center', opacity: 0.5 }}>No hay servicios.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
