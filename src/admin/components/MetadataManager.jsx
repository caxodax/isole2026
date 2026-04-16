import React, { useState } from 'react';
import { db } from '../../firebase/init';
import { collection, addDoc, deleteDoc, doc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

export default function MetadataManager({ 
  categories, albums, photos, 
  videoCategories, videoAlbums, videos,
  onRefresh 
}) {
  const [mode, setMode] = useState('photos'); // 'photos' o 'videos'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Determinamos qué datos usar según el modo
  const currentCats = mode === 'photos' ? categories : videoCategories;
  const currentAlbums = mode === 'photos' ? albums : videoAlbums;
  const currentItems = mode === 'photos' ? photos : videos;
  
  const catCol = mode === 'photos' ? 'categories' : 'video_categories';
  const albumCol = mode === 'photos' ? 'albums' : 'video_albums';
  const itemCol = mode === 'photos' ? 'photos' : 'videos';
  const itemTypeLabel = mode === 'photos' ? 'fotos' : 'videos';

  // Estados para creación
  const [newCat, setNewCat] = useState('');
  const [newAlbum, setNewAlbum] = useState({ name: '', category: '', description: '' });

  // Estados para edición de Categoría
  const [editingCat, setEditingCat] = useState(null); 
  const [editCatName, setEditCatName] = useState('');

  // Estados para edición de Álbum
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [editAlbumForm, setEditAlbumForm] = useState({ name: '', category: '', description: '' });

  // Manejador centralizado de errores de Firebase
  const handleError = (err) => {
    console.error(err);
    if (err.code === 'permission-denied') {
      setError('Error: No tienes permisos en Firebase. Revisa las reglas de seguridad en la consola.');
    } else {
      setError(`Ocurrió un error: ${err.message || 'Error desconocido'}`);
    }
  };

  // Limpiar estados al cambiar de modo
  const switchMode = (newMode) => {
    setMode(newMode);
    setEditingCat(null);
    setEditingAlbum(null);
    setError('');
  };

  // ---- GESTIÓN DE CATEGORÍAS ----
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, catCol), { name: newCat.trim() });
      setNewCat('');
      onRefresh();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const startEditCategory = (cat) => {
    setEditingCat(cat);
    setEditCatName(cat.name);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCat || !editCatName.trim()) return;
    if (editingCat.name === editCatName.trim()) {
      setEditingCat(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const batch = writeBatch(db);
      const oldName = editingCat.name;
      const newName = editCatName.trim();

      batch.update(doc(db, catCol, editingCat.id), { name: newName });

      // Actualizar items vinculados (fotos o videos)
      const itemsToUpdate = currentItems.filter(p => p.category === oldName);
      itemsToUpdate.forEach(p => batch.update(doc(db, itemCol, p.id), { category: newName }));

      // Actualizar álbumes vinculados
      const albumsToUpdate = currentAlbums.filter(a => a.category === oldName);
      albumsToUpdate.forEach(a => batch.update(doc(db, albumCol, a.id), { category: newName }));

      await batch.commit();
      setEditingCat(null);
      onRefresh();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${catName}"? Los ${itemTypeLabel} asociados se moverán a "Otros".`)) return;
    setLoading(true);
    setError('');
    try {
      const batch = writeBatch(db);
      const itemsToMove = currentItems.filter(p => p.category === catName);
      itemsToMove.forEach(p => batch.update(doc(db, itemCol, p.id), { category: 'Otros' }));
      batch.delete(doc(db, catCol, catId));
      await batch.commit();
      onRefresh();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // ---- GESTIÓN DE ÁLBUMES ----
  const handleAddAlbum = async (e) => {
    e.preventDefault();
    if (!newAlbum.name.trim() || !newAlbum.category) return;
    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, albumCol), {
        name: newAlbum.name.trim(),
        category: newAlbum.category,
        description: newAlbum.description.trim(),
        createdAt: serverTimestamp()
      });
      setNewAlbum({ name: '', category: '', description: '' });
      onRefresh();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const startEditAlbum = (album) => {
    setEditingAlbum(album);
    setEditAlbumForm({ 
      name: album.name, 
      category: album.category, 
      description: album.description || '' 
    });
  };

  const handleUpdateAlbum = async (e) => {
    e.preventDefault();
    if (!editingAlbum || !editAlbumForm.name.trim() || !editAlbumForm.category) return;

    setLoading(true);
    setError('');
    try {
      const batch = writeBatch(db);
      const oldName = editingAlbum.name;
      const newName = editAlbumForm.name.trim();

      // 1. Actualizar el álbum
      batch.update(doc(db, albumCol, editingAlbum.id), {
        name: newName,
        category: editAlbumForm.category,
        description: editAlbumForm.description.trim()
      });

      // 2. Si el nombre cambió, actualizar items vinculados
      const itemsToUpdate = currentItems.filter(p => (mode === 'photos' ? p.albumName : p.albumName) === oldName);
      itemsToUpdate.forEach(p => {
        batch.update(doc(db, itemCol, p.id), { 
          albumName: newName,
          category: editAlbumForm.category, 
          albumDescription: editAlbumForm.description.trim()
        });
      });

      await batch.commit();
      setEditingAlbum(null);
      onRefresh();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlbum = async (albumId) => {
    if (!window.confirm(`¿Borrar este álbum? No se borrarán los ${itemTypeLabel}, pero dejarán de estar agrupados.`)) return;
    setLoading(true);
    setError('');
    try {
      await deleteDoc(doc(db, albumCol, albumId));
      onRefresh();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="metadata-manager">
      <div className="section-header">
        <h2 className="section-title">Configuración de Contenido</h2>
        <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
          <button 
            onClick={() => switchMode('photos')}
            className={mode === 'photos' ? 'tab-btn active' : 'tab-btn'}
            style={{ padding: '8px 20px', borderRadius: 20 }}
          >
            Gestión de Fotos
          </button>
          <button 
            onClick={() => switchMode('videos')}
            className={mode === 'videos' ? 'tab-btn active' : 'tab-btn'}
            style={{ padding: '8px 20px', borderRadius: 20 }}
          >
            Gestión de Videos
          </button>
        </div>
      </div>

      {error && (
        <div className="panel" style={{ background: 'rgba(255, 123, 123, 0.1)', borderColor: '#ff7b7b', marginBottom: 20, padding: 15, marginTop: 20 }}>
          <p className="error-text" style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      <div className="form-group-row" style={{ marginTop: 20 }}>
        {/* COLUMNA CATEGORÍAS */}
        <div className="panel" style={{ flex: 1, padding: 20 }}>
          <h3>Categorías ({mode === 'photos' ? 'Fotos' : 'Videos'})</h3>
          
          {editingCat ? (
            <form onSubmit={handleUpdateCategory} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.75rem', opacity: 0.8 }}>Renombrar categoría:</label>
              <div className="form-group-row">
                <input 
                  autoFocus
                  value={editCatName} 
                  onChange={(e) => setEditCatName(e.target.value)} 
                />
                <button type="submit" disabled={loading} style={{ background: '#7bff9a', color: '#050505' }}>✔</button>
                <button type="button" onClick={() => setEditingCat(null)} style={{ background: 'rgba(255,255,255,0.1)' }}>✕</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddCategory} style={{ marginBottom: 16 }}>
              <div className="form-group-row">
                <input 
                  value={newCat} 
                  onChange={(e) => setNewCat(e.target.value)} 
                  placeholder="Nueva categoría..." 
                />
                <button type="submit" disabled={loading}>Añadir</button>
              </div>
            </form>
          )}

          <div className="meta-list">
            {currentCats.map(c => (
              <div key={c.id} className="pill" style={{ margin: '4px', gap: '8px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem' }}>{c.name}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => startEditCategory(c)} title="Editar" style={{ background: 'none', color: '#7bff9a', border: 'none', cursor: 'pointer', padding: 0 }}>✎</button>
                  <button onClick={() => handleDeleteCategory(c.id, c.name)} title="Eliminar" style={{ background: 'none', color: '#ff7b7b', border: 'none', cursor: 'pointer', padding: 0, fontSize: '1.1rem' }}>×</button>
                </div>
              </div>
            ))}
            {currentCats.length === 0 && <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Sin categorías.</p>}
          </div>
        </div>

        {/* COLUMNA ÁLBUMES */}
        <div className="panel" style={{ flex: 1.5, padding: 20 }}>
          <h3>{editingAlbum ? 'Editar Álbum' : 'Crear Álbum (Carpeta)'}</h3>
          
          <form onSubmit={editingAlbum ? handleUpdateAlbum : handleAddAlbum}>
            <div className="form-group-row">
              <input 
                value={editingAlbum ? editAlbumForm.name : newAlbum.name} 
                onChange={(e) => editingAlbum 
                  ? setEditAlbumForm({...editAlbumForm, name: e.target.value})
                  : setNewAlbum({...newAlbum, name: e.target.value})
                } 
                placeholder="Nombre del álbum"
                required
              />
              <select 
                value={editingAlbum ? editAlbumForm.category : newAlbum.category} 
                onChange={(e) => editingAlbum
                  ? setEditAlbumForm({...editAlbumForm, category: e.target.value})
                  : setNewAlbum({...newAlbum, category: e.target.value})
                }
                required
              >
                <option value="">Seleccionar Categoría...</option>
                {currentCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <textarea 
              value={editingAlbum ? editAlbumForm.description : newAlbum.description} 
              onChange={(e) => editingAlbum
                ? setEditAlbumForm({...editAlbumForm, description: e.target.value})
                : setNewAlbum({...newAlbum, description: e.target.value})
              }
              placeholder="Descripción del álbum (opcional)"
              rows="2"
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ flex: 1, background: editingAlbum ? '#7bff9a' : '', color: editingAlbum ? '#050505' : '' }} disabled={loading}>
                {editingAlbum ? 'Guardar Cambios' : 'Crear Álbum'}
              </button>
              {editingAlbum && (
                <button type="button" onClick={() => setEditingAlbum(null)} style={{ flex: 0.5, background: 'rgba(255,255,255,0.1)' }}>
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <h4 style={{ marginTop: 20 }}>Álbumes Existentes ({mode === 'photos' ? 'Fotos' : 'Videos'})</h4>
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentAlbums.map(a => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td><span className="pill" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{a.category}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => startEditAlbum(a)} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', color: '#7bff9a' }}>Editar</button>
                      <button onClick={() => handleDeleteAlbum(a.id)} style={{ padding: '4px 8px', background: '#ff7b7b', color: 'white' }}>Borrar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentAlbums.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', opacity: 0.5 }}>Sin álbumes.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
