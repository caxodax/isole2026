import React, { useState, useRef, useEffect } from 'react';
import { db, storage } from '../../firebase/init';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { generateVersions } from '../../utils/imageUtils';

export default function PhotoManager({ photos, categories, albums, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [form, setForm] = useState({ 
    title: '', 
    category: '', 
    albumName: '',
    albumDescription: ''
  });
  
  // Estado para gestión y filtrado
  const [viewAlbum, setViewAlbum] = useState('Todos');
  const [showCatSuggestions, setShowCatSuggestions] = useState(false);
  const [showAlbumSuggestions, setShowAlbumSuggestions] = useState(false);

  const fileRef = useRef(null);
  const catContainerRef = useRef(null);
  const albumContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (catContainerRef.current && !catContainerRef.current.contains(e.target)) setShowCatSuggestions(false);
      if (albumContainerRef.current && !albumContainerRef.current.contains(e.target)) setShowAlbumSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setStatus({ type: '', msg: '' });
    const files = fileRef.current?.files;
    if (!files || files.length === 0) return setStatus({ type: 'error', msg: 'Selecciona una imagen.' });
    if (!form.category.trim() || !form.albumName.trim()) return setStatus({ type: 'error', msg: 'Categoría y álbum obligatorios.' });

    setUploading(true);
    try {
      // Auto-crear metadatos si no existen
      if (!categories.find(c => c.name.toLowerCase() === form.category.toLowerCase())) {
        await addDoc(collection(db, 'categories'), { name: form.category.trim() });
      }
      if (!albums.find(a => a.name.toLowerCase() === form.albumName.toLowerCase())) {
        await addDoc(collection(db, 'albums'), {
          name: form.albumName.trim(),
          category: form.category.trim(),
          description: form.albumDescription.trim(),
          createdAt: serverTimestamp()
        });
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { full, thumb } = await generateVersions(file);
        
        const timestamp = Date.now();
        const baseRef = `photos/${timestamp}_${i}`;

        // Subir versión FULL
        const fullRef = ref(storage, `${baseRef}_full.webp`);
        await uploadBytesResumable(fullRef, full);
        const url = await getDownloadURL(fullRef);

        // Subir versión THUMB
        const thumbRef = ref(storage, `${baseRef}_thumb.webp`);
        await uploadBytesResumable(thumbRef, thumb);
        const thumbnailUrl = await getDownloadURL(thumbRef);

        const photoTitle = files.length > 1 ? `${form.albumName} - ${i + 1}` : form.title.trim();

        await addDoc(collection(db, 'photos'), {
          title: photoTitle,
          category: form.category.trim(),
          albumName: form.albumName.trim(),
          albumDescription: form.albumDescription.trim(),
          url, // Master
          thumbnailUrl, // Lite
          storagePath: fullRef.fullPath,
          thumbStoragePath: thumbRef.fullPath,
          createdAt: serverTimestamp(),
        });
      }
      setStatus({ type: 'success', msg: `¡Subida exitosa y optimizada!` });
      if (fileRef.current) fileRef.current.value = '';
      onRefresh();
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Error en subida.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photo) => {
    if (!window.confirm('¿Eliminar esta foto permanentemente (todas las versiones)?')) return;
    try {
      await deleteDoc(doc(db, 'photos', photo.id));
      
      // Borrar Master
      if (photo.storagePath) {
        await deleteObject(ref(storage, photo.storagePath));
      }
      // Borrar Thumbnail
      if (photo.thumbStoragePath) {
        await deleteObject(ref(storage, photo.thumbStoragePath));
      }
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error parcial al eliminar archivos físicos');
    }
  };

  const filteredPhotos = photos.filter(p => viewAlbum === 'Todos' || p.albumName === viewAlbum);

  return (
    <div className="manager-shell">
      <div className="panel" style={{ padding: 20, marginBottom: 24 }}>
        <h3>Nueva Subida (Auto-Optimización)</h3>
        <p style={{fontSize: '0.75rem', opacity: 0.6, marginBottom: 15}}>El sistema generará versiones HD y Miniaturas automáticamente.</p>
        <form onSubmit={handleUpload}>
          <div className="form-group-row">
             <div style={{ flex: 1 }}>
               <label>Archivos</label>
               <input type="file" accept="image/*" multiple ref={fileRef} />
             </div>
             <div style={{ flex: 1, position: 'relative' }} ref={catContainerRef}>
               <label>Categoría</label>
               <input name="category" value={form.category} onChange={handleChange} onFocus={() => setShowCatSuggestions(true)} autoComplete="off" />
               {showCatSuggestions && (
                 <div className="custom-dropdown">
                   {categories.filter(c => c.name.toLowerCase().includes(form.category.toLowerCase())).map(c => (
                     <div key={c.id} className="dropdown-item" onClick={() => { setForm(f => ({ ...f, category: c.name })); setShowCatSuggestions(false); }}>{c.name}</div>
                   ))}
                 </div>
               )}
             </div>
          </div>
          <div className="form-group-row">
            <div style={{ flex: 1, position: 'relative' }} ref={albumContainerRef}>
               <label>Álbum</label>
               <input name="albumName" value={form.albumName} onChange={handleChange} onFocus={() => setShowAlbumSuggestions(true)} autoComplete="off" />
               {showAlbumSuggestions && (
                 <div className="custom-dropdown">
                   {albums.filter(a => a.name.toLowerCase().includes(form.albumName.toLowerCase())).map(a => (
                     <div key={a.id} className="dropdown-item" onClick={() => { setForm(f => ({ ...f, albumName: a.name, category: a.category })); setShowAlbumSuggestions(false); }}>
                       <strong>{a.name}</strong> <small>({a.category})</small>
                     </div>
                   ))}
                 </div>
               )}
             </div>
             <div style={{ flex: 1 }}>
               <label>Título (Opcional)</label>
               <input name="title" value={form.title} onChange={handleChange} />
             </div>
          </div>
          <button type="submit" disabled={uploading}>{uploading ? 'Procesando y Subiendo...' : 'Subir Fotos HD + Thumb'}</button>
        </form>
      </div>

      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Gestionar Biblioteca</h3>
        <select value={viewAlbum} onChange={(e) => setViewAlbum(e.target.value)} style={{ width: 'auto', minWidth: '200px' }}>
          <option value="Todos">Ver Todos los Álbumes</option>
          {albums.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
        </select>
      </div>

      <div className="admin-photo-grid">
        {filteredPhotos.map((p) => (
          <div key={p.id} className="admin-photo-card">
            <button 
              className="admin-photo-delete"
              onClick={() => handleDeletePhoto(p)}
              title="Eliminar foto"
            >
              ×
            </button>
            <div className="admin-photo-img-wrap">
              {/* En el admin usamos el Thumbnail para que el panel responda rápido */}
              <img src={p.thumbnailUrl || p.url} alt="" loading="lazy" />
            </div>
            <div className="admin-photo-info">
              <div className="admin-photo-title">{p.title}</div>
              <div className="admin-photo-meta">{p.albumName}</div>
            </div>
          </div>
        ))}
        {filteredPhotos.length === 0 && <p style={{gridColumn: '1/-1', textAlign: 'center', opacity:0.5}}>No hay fotos.</p>}
      </div>

      <style>{`
        .admin-photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }
        .admin-photo-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          transition: transform 0.2s;
        }
        .admin-photo-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.2);
        }
        .admin-photo-delete {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #ff4d4d;
          color: white;
          border: none;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          transition: transform 0.2s;
        }
        .admin-photo-delete:hover {
          transform: scale(1.1);
          background: #ff1a1a;
        }
        .admin-photo-img-wrap {
          width: 100%;
          height: 120px;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .admin-photo-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .admin-photo-info {
          padding: 10px;
        }
        .admin-photo-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .admin-photo-meta {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
          margin-top: 2px;
        }
        .custom-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: rgba(20, 20, 20, 0.95); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; z-index: 1000; max-height: 200px; overflow-y: auto; }
        .dropdown-item { padding: 10px 15px; cursor: pointer; font-size: 0.85rem; color: white; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .dropdown-item:hover { background: rgba(255, 255, 255, 0.1); }
      `}</style>
    </div>
  );
}
