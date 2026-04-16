import React, { useState, useRef, useEffect } from 'react';
import { db, storage } from '../../firebase/init';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { compressImage } from '../../utils/imageUtils';

export default function VideoManager({ videos, categories, albums, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [form, setForm] = useState({ 
    title: '', 
    category: '', 
    albumName: '',
    albumDescription: '',
    url: ''
  });
  const [thumbFile, setThumbFile] = useState(null);

  // Estados para gestión y buscadores
  const [viewAlbum, setViewAlbum] = useState('Todos');
  const [showCatSuggestions, setShowCatSuggestions] = useState(false);
  const [showAlbumSuggestions, setShowAlbumSuggestions] = useState(false);

  const fileInputRef = useRef(null);
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

  const handleThumbChange = (e) => {
    if (e.target.files && e.target.files[0]) setThumbFile(e.target.files[0]);
  };

  const validateUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    const instagramRegex = /^(https?:\/\/)?(www\.)?(instagram\.com)\/(p|reels|reel)\/.+$/;
    return youtubeRegex.test(url) || instagramRegex.test(url);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setStatus({ type: '', msg: '' });

    if (!form.url.trim() || !validateUrl(form.url.trim())) {
      return setStatus({ type: 'error', msg: 'URL de YouTube o Reel no válida.' });
    }
    if (!form.category.trim() || !form.albumName.trim()) {
      return setStatus({ type: 'error', msg: 'Categoría y álbum obligatorios.' });
    }

    setUploading(true);
    try {
      // Auto-crear metadatos de video si no existen
      if (!categories.find(c => c.name.toLowerCase() === form.category.toLowerCase())) {
        await addDoc(collection(db, 'video_categories'), { name: form.category.trim() });
      }
      if (!albums.find(a => a.name.toLowerCase() === form.albumName.toLowerCase())) {
        await addDoc(collection(db, 'video_albums'), {
          name: form.albumName.trim(),
          category: form.category.trim(),
          description: form.albumDescription.trim(),
          createdAt: serverTimestamp()
        });
      }

      let thumbnailUrl = '';
      let storagePath = '';

      // Si no hay miniatura manual, intentamos generar la de YouTube
      if (!thumbFile && (form.url.includes('youtube.com') || form.url.includes('youtu.be'))) {
        try {
          const u = new URL(form.url.trim());
          let id = '';
          if (u.hostname === 'youtu.be') id = u.pathname.replace('/', '');
          else id = u.searchParams.get('v');
          
          if (id) thumbnailUrl = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
        } catch (e) {
          console.warn("No se pudo obtener miniatura de YT automáticamente");
        }
      }

      if (thumbFile) {
        let file = await compressImage(thumbFile, 800, 0.8);
        const storageRef = ref(storage, `video_thumbs/${Date.now()}_${file.name.replace(/\s+/g, '_')}`);
        await uploadBytesResumable(storageRef, file);
        thumbnailUrl = await getDownloadURL(storageRef);
        storagePath = storageRef.fullPath;
      }

      await addDoc(collection(db, 'videos'), {
        title: form.title.trim() || 'Producción Audiovisual',
        category: form.category.trim(),
        albumName: form.albumName.trim(),
        albumDescription: form.albumDescription.trim(),
        url: form.url.trim(),
        thumbnailUrl,
        storagePath,
        createdAt: serverTimestamp(),
      });

      setStatus({ type: 'success', msg: '¡Video agregado con éxito!' });
      setForm({ title: '', category: '', albumName: '', albumDescription: '', url: '' });
      setThumbFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onRefresh();
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Error al guardar el video.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVideo = async (video) => {
    if (!window.confirm('¿Eliminar este video permanentemente?')) return;
    try {
      await deleteDoc(doc(db, 'videos', video.id));
      if (video.storagePath) {
        const fileRef = ref(storage, video.storagePath);
        await deleteObject(fileRef);
      }
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  };

  const filteredVideos = videos.filter(v => viewAlbum === 'Todos' || v.albumName === viewAlbum);

  return (
    <div className="manager-shell">
      <div className="panel" style={{ padding: 20, marginBottom: 24 }}>
        <h3>Agregar Videos / Reels</h3>
        {status.msg && <div className={status.type === 'error' ? 'error-text' : 'success-text'}>{status.msg}</div>}
        
        <form onSubmit={handleUpload}>
          <div className="form-group-row">
            <div style={{ flex: 1.5 }}>
              <label>URL del Video (YT / Instagram)</label>
              <input name="url" value={form.url} onChange={handleChange} placeholder="Link aquí..." required />
            </div>
            <div style={{ flex: 1 }}>
              <label>Título (Opcional)</label>
              <input name="title" value={form.title} onChange={handleChange} placeholder="Título del reel" />
            </div>
          </div>

          <div className="form-group-row">
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
            <div style={{ flex: 1, position: 'relative' }} ref={albumContainerRef}>
               <label>Álbum de Video</label>
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
          </div>

          <label>Thumbnail (Carátula - Opcional)</label>
          <input type="file" accept="image/*" onChange={handleThumbChange} ref={fileInputRef} />
          {form.url.includes('instagram.com') && (
            <p style={{ fontSize: '0.75rem', color: '#ff7b7b', marginTop: -8, marginBottom: 10 }}>
              ⚠️ Instagram requiere que subas la carátula manualmente.
            </p>
          )}

          <label>Descripción del Álbum / Historia</label>
          <textarea name="albumDescription" rows="2" value={form.albumDescription} onChange={handleChange} placeholder="Contexto..." />

          <button type="submit" disabled={uploading}>{uploading ? 'Guardando...' : 'Guardar Video'}</button>
        </form>
      </div>

      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Biblioteca de Videos</h3>
        <select value={viewAlbum} onChange={(e) => setViewAlbum(e.target.value)} style={{ width: 'auto', minWidth: '200px' }}>
          <option value="Todos">Ver Todos los Álbumes</option>
          {albums.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
        </select>
      </div>

      <div className="admin-photo-grid">
        {filteredVideos.map((v) => (
          <div key={v.id} className="admin-photo-card">
            <button className="admin-photo-delete" onClick={() => handleDeleteVideo(v)}>×</button>
            <div className="admin-photo-img-wrap">
              {v.thumbnailUrl ? <img src={v.thumbnailUrl} alt="" /> : <div style={{opacity:0.5}}>Link Externo</div>}
            </div>
            <div className="admin-photo-info">
              <div className="admin-photo-title">{v.title}</div>
              <div className="admin-photo-meta">{v.albumName}</div>
            </div>
          </div>
        ))}
        {filteredVideos.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', opacity: 0.5 }}>No hay videos en este álbum.</p>}
      </div>

      <style>{`
        .custom-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: rgba(20, 20, 20, 0.95); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; z-index: 1000; max-height: 200px; overflow-y: auto; }
        .dropdown-item { padding: 10px 15px; cursor: pointer; font-size: 0.85rem; color: white; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .dropdown-item:hover { background: rgba(255, 255, 255, 0.1); }
      `}</style>
    </div>
  );
}
