import React, { useEffect, useState } from 'react';
import './VideoAlbumModal.css';

function toYoutubeEmbed(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');
    if (host === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.replace('/', '')}`;
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'www.youtube.com') {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch (e) {
    return null;
  }
  return null;
}

export default function VideoAlbumModal({ open, album, onClose }) {
  const [index, setIndex] = useState(0);
  const videos = album?.photos || []; // Reusamos la misma estructura de datos

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  if (!open || !album) return null;

  const current = videos[index];
  const total = videos.length;
  const embedUrl = current ? toYoutubeEmbed(current.url) : null;

  const go = (n) => {
    const nextIndex = (n + total) % total;
    setIndex(nextIndex);
  };

  return (
    <div className="video-album-modal-overlay" onMouseDown={onClose}>
      <div className="video-album-modal" onMouseDown={e => e.stopPropagation()}>
        <div className="video-album-left">
          <div className="video-album-stage">
            {total > 1 && (
              <>
                <button className="video-album-nav video-album-prev" onClick={() => go(index - 1)}>‹</button>
                <button className="video-album-nav video-album-next" onClick={() => go(index + 1)}>›</button>
              </>
            )}
            
            <div className="video-album-content">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title="Video"
                  className="video-album-iframe-wrap"
                  style={{ border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="video-album-external-link">
                  <img src={current?.thumbnailUrl} alt="" />
                  <h3>{current?.title}</h3>
                  <a href={current?.url} target="_blank" rel="noreferrer" className="album-btn" style={{display: 'inline-block', textDecoration: 'none'}}>
                    Ver en plataforma externa →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="video-album-right">
          <div className="video-album-topbar">
            <div className="video-album-badge">{album.category}</div>
            <button className="video-album-close" onClick={onClose}>✕</button>
          </div>

          <h3 className="video-album-title">{album.title}</h3>
          <p className="video-album-desc">{album.description}</p>

          <div style={{ marginTop: 'auto' }}>
            <h4 style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: 10 }}>CONTENIDO DEL ÁLBUM ({total})</h4>
            <div className="video-album-thumbs">
              {videos.map((v, i) => (
                <div 
                  key={i} 
                  className={`video-album-thumb ${i === index ? 'active' : ''}`}
                  onClick={() => setIndex(i)}
                >
                  {v.thumbnailUrl ? <img src={v.thumbnailUrl} alt="" /> : <div className="video-album-thumb-play">▶</div>}
                  {i === index && <div className="video-album-thumb-play">Reproduciendo</div>}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
