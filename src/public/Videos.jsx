import React, { useEffect, useMemo, useState } from 'react';
import "./Videos.css";
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/init';
import VideoAlbumModal from '../components/VideoAlbumModal';

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');

  // Estado del Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Cargar todos los videos
        const qVideos = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
        const snapVideos = await getDocs(qVideos);
        const videoList = snapVideos.docs.map((d) => ({ id: d.id, ...d.data() }));
        setVideos(videoList);

        // 2. Cargar categorías de video oficiales
        const qCats = query(collection(db, 'video_categories'), orderBy('name', 'asc'));
        const snapCats = await getDocs(qCats);
        const cats = snapCats.docs.map(d => d.data().name);
        setDbCategories(cats);

      } catch (e) {
        console.error('Error cargando datos de videos', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = useMemo(() => {
    return ['Todos', ...dbCategories];
  }, [dbCategories]);

  // Agrupar videos por Álbum
  const albums = useMemo(() => {
    let filtered = videos;
    if (activeCategory !== 'Todos') {
      filtered = videos.filter(v => v.category === activeCategory);
    }

    const groups = {};
    filtered.forEach((v) => {
      const albumKey = v.albumName || 'Otros';
      if (!groups[albumKey]) {
        groups[albumKey] = {
          title: albumKey,
          category: v.category || 'Video',
          description: v.albumDescription || '',
          coverUrl: v.thumbnailUrl || '', 
          photos: [], // Reusamos el nombre de propiedad para compatibilidad con el modal
          createdAt: v.createdAt
        };
      }
      groups[albumKey].photos.push(v);
    });

    return Object.values(groups).sort((a, b) => {
       const dateA = a.createdAt?.seconds || 0;
       const dateB = b.createdAt?.seconds || 0;
       return dateB - dateA;
    });
  }, [videos, activeCategory]);

  const handleOpenAlbum = (album) => {
    setSelectedAlbum(album);
    setModalOpen(true);
  };

  return (
    <section id="videos">
      <div className="section-header">
        <span className="section-tag">Audiovisual</span>
        <h2 className="section-title">Producciones de Video</h2>
        <p className="section-sub">
          Contenido cinematográfico, reels y campañas diseñadas para impactar.
          Selecciona una categoría para ver nuestras colecciones.
        </p>
      </div>

      {/* Filtros dinámicos de videos */}
      {categories.length > 1 && (
        <div className="gallery-filter">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`gallery-filter-pill ${cat === activeCategory ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading && <p>Cargando producciones...</p>}

      {!loading && albums.length === 0 && (
        <p className="gallery-empty">No hay producciones de video en esta categoría aún.</p>
      )}

      <div className="gallery-grid">
        {albums.map((album, index) => (
          <div 
            key={album.title} 
            className="video-album-card"
            onClick={() => handleOpenAlbum(album)}
          >
            <div className="video-thumb-container">
              {album.coverUrl ? (
                <img src={album.coverUrl} alt={album.title} loading="lazy" />
              ) : (
                <div className="album-placeholder">Video Album</div>
              )}
              <div className="video-play-icon">▶</div>
              <div className="video-count-badge">{album.photos.length} clips</div>
            </div>
            
            <div className="video-card-body">
              <h3 className="video-card-title">{album.title}</h3>
              <div className="video-card-footer">
                <span className="video-card-cat">{album.category}</span>
                <span className="video-card-action">Ver colección →</span>
              </div>
            </div>

            <div className="gallery-item-index">
              {String(index + 1).padStart(2, '0')}
            </div>
          </div>
        ))}
      </div>

      {/* Modal para ver los videos del álbum */}
      <VideoAlbumModal 
        open={modalOpen} 
        album={selectedAlbum} 
        onClose={() => setModalOpen(false)} 
      />

      <style>{`
        .video-album-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        
        .video-album-card:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .video-thumb-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16/9;
          overflow: hidden;
          background: #000;
        }

        .video-thumb-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .video-album-card:hover .video-thumb-container img {
          transform: scale(1.05);
        }

        .video-play-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          width: 54px;
          height: 54px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          color: white;
          z-index: 5;
          transition: all 0.3s ease;
        }

        .video-album-card:hover .video-play-icon {
          background: #7bff9a;
          color: #000;
          transform: translate(-50%, -50%) scale(1.1);
        }

        .video-count-badge {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(0,0,0,0.6);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.7rem;
          color: white;
          backdrop-filter: blur(4px);
        }

        .video-card-body {
          padding: 16px;
        }

        .video-card-title {
          font-size: 1.1rem;
          margin: 0 0 8px 0;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .video-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .video-card-cat {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .video-card-action {
          font-size: 0.75rem;
          color: #7bff9a;
          font-weight: 500;
        }

        .album-placeholder {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.3;
        }
      `}</style>
    </section>
  );
}
