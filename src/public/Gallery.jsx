import React, { useEffect, useMemo, useState } from 'react';
import "./Gallery.css";
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/init';
import AlbumModal from '../components/AlbumModal';

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');

  // Estado del Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const qPhotos = query(collection(db, 'photos'), orderBy('createdAt', 'desc'));
        const snapPhotos = await getDocs(qPhotos);
        const photoList = snapPhotos.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPhotos(photoList);

        const qCats = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const snapCats = await getDocs(qCats);
        const cats = snapCats.docs.map(d => d.data().name);
        setDbCategories(cats);
      } catch (e) {
        console.error('Error cargando datos de galería', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = useMemo(() => {
    return ['Todos', ...dbCategories];
  }, [dbCategories]);

  const albums = useMemo(() => {
    let filteredPhotos = photos;
    if (activeCategory !== 'Todos') {
      filteredPhotos = photos.filter((p) => p.category === activeCategory);
    }

    const groups = {};
    filteredPhotos.forEach((p) => {
      const albumKey = p.albumName || 'Otros';
      if (!groups[albumKey]) {
        groups[albumKey] = {
          title: albumKey,
          category: p.category || 'Varios',
          description: p.albumDescription || '',
          coverUrl: p.thumbnailUrl || p.url, // USAMOS MINIATURA PARA EL GRID
          photos: [],
          createdAt: p.createdAt
        };
      }
      groups[albumKey].photos.push(p);
    });

    return Object.values(groups).sort((a, b) => {
       const dateA = a.createdAt?.seconds || 0;
       const dateB = b.createdAt?.seconds || 0;
       return dateB - dateA;
    });
  }, [photos, activeCategory]);

  const handleOpenAlbum = (album) => {
    setSelectedAlbum(album);
    setModalOpen(true);
  };

  return (
    <section id="gallery">
      <div className="section-header">
        <span className="section-tag">Producciones</span>
        <h2 className="section-title">Portafolio Fotográfico</h2>
        <p className="section-sub">
          Explora nuestros proyectos organizados por categorías. 
          Haz clic en una colección para ver el reportaje completo.
        </p>
      </div>

      {categories.length > 1 && (
        <div className="gallery-filter">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={'gallery-filter-pill ' + (cat === activeCategory ? 'active' : '')}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="gallery-grid">
          {[1,2,3].map(i => (
            <div key={i} className="skeleton-card shimmer" style={{ height: '400px', borderRadius: '24px' }}></div>
          ))}
        </div>
      )}

      {!loading && albums.length === 0 && (
        <p className="gallery-empty">No hay álbumes publicados por el momento.</p>
      )}

      <div className="gallery-grid">
        {!loading && albums.map((album, index) => (
          <div 
            key={album.title} 
            className="gallery-item gallery-item-fancy fade-in"
            onClick={() => handleOpenAlbum(album)}
          >
            <img
              src={album.coverUrl}
              alt={album.title}
              loading="lazy"
            />
            
            <div className="gallery-item-overlay">
              <div className="gallery-item-plus">+</div>
            </div>

            <div className="gallery-item-caption">
              <div className="gallery-item-title">{album.title}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span className="gallery-item-tag">{album.category}</span>
                <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                  {album.photos.length} fotos
                </span>
              </div>
            </div>

            <div className="gallery-item-index">
              {String(index + 1).padStart(2, '0')}
            </div>
          </div>
        ))}
      </div>

      <AlbumModal 
        open={modalOpen} 
        album={selectedAlbum} 
        onClose={() => setModalOpen(false)} 
      />

      <style>{`
        .shimmer {
          background: #1a1a1a;
          background-image: linear-gradient(to right, #1a1a1a 0%, #252525 20%, #1a1a1a 40%, #1a1a1a 100%);
          background-repeat: no-repeat;
          background-size: 800px 100%;
          display: inline-block;
          position: relative;
          animation: shimmer 1.5s infinite linear;
        }
        @keyframes shimmer {
          0% { background-position: -468px 0; }
          100% { background-position: 468px 0; }
        }
        .fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
