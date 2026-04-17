import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import "./AlbumModal.css";

export default function AlbumModal({ open, album, initialIndex = 0, onClose }) {
  const photos = album?.photos || [];
  const [index, setIndex] = useState(initialIndex);

  // Zoom / Pan
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false); // Nuevo para Blur-up
  const touchStartRef = useRef(0); // Para Gestos (Swipe)
  const draggingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const imgWrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setIndex(initialIndex || 0);
    setZoomed(false);
    setPan({ x: 0, y: 0 });
    setLoaded(false); // Reset al abrir o cambiar
  }, [open, initialIndex]);

  // Reset loaded when index changes
  useEffect(() => {
    setLoaded(false);
  }, [index]);

  const total = photos.length;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const go = (next) => {
    if (!total) return;
    const n = (next + total) % total;
    setIndex(n);
    setZoomed(false);
    setPan({ x: 0, y: 0 });
  };

  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, total]);

  const current = useMemo(() => photos[index] || null, [photos, index]);

  const toggleZoom = () => {
    setZoomed((z) => {
      const nextZoom = !z;
      if (!nextZoom) setPan({ x: 0, y: 0 });
      return nextZoom;
    });
  };

  const onPointerDown = (e) => {
    if (!zoomed) return;
    draggingRef.current = true;
    lastRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!zoomed || !draggingRef.current) return;
    const dx = e.clientX - lastRef.current.x;
    const dy = e.clientY - lastRef.current.y;
    lastRef.current = { x: e.clientX, y: e.clientY };

    const wrap = imgWrapRef.current;
    if (!wrap) return;
    const maxX = wrap.clientWidth * 0.25;
    const maxY = wrap.clientHeight * 0.25;

    setPan((p) => ({
      x: clamp(p.x + dx, -maxX, maxX),
      y: clamp(p.y + dy, -maxY, maxY)
    }));
  };

  const onPointerUp = () => {
    draggingRef.current = false;
  };

  const onTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;

    // Umbral de 50px para evitar falsos positivos
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  if (!open || !album) return null;

  // Master: Alta resolución (2560px)
  const currentMaster = current?.url || current?.src;
  // Thumb: Miniatura (800px) para la tira inferior
  const getThumb = (p) => p?.thumbnailUrl || p?.url || p?.src;

  return (
    <div className="album-modal-overlay" onMouseDown={onClose} role="dialog" aria-modal="true">
      <Helmet>
        <title>{`${album.title} | ${current?.title || album.category} | ISOLE`}</title>
        {album.description && <meta name="description" content={album.description} />}
      </Helmet>
      <div 
        className="album-modal" 
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="album-left">
          <div className="album-stage">
            <button className="album-nav album-prev" onClick={prev} aria-label="Anterior">‹</button>

            <div
              className={`album-image-wrap ${zoomed ? "is-zoomed" : ""}`}
              ref={imgWrapRef}
              onDoubleClick={toggleZoom}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onContextMenu={(e) => e.preventDefault()} // Protección de imagen
            >
              {/* Capa de Miniatura (Placeholder) */}
              {!loaded && (
                <img
                  src={getThumb(current)}
                  alt=""
                  className="album-image thumb-placeholder"
                  draggable={false}
                />
              )}

              <img
                key={currentMaster}
                src={currentMaster}
                alt={album.title}
                draggable={false}
                onLoad={() => setLoaded(true)}
                className={`album-image master-image ${loaded ? 'is-loaded' : 'is-loading'}`}
                style={{
                  transform: zoomed
                    ? `translate(${pan.x}px, ${pan.y}px) scale(1.7)`
                    : "translate(0px, 0px) scale(1)"
                }}
              />
            </div>

            <button className="album-zoom-btn" onClick={toggleZoom} type="button">
              {zoomed ? "Zoom −" : "Zoom +"}
            </button>

            <button className="album-nav album-next" onClick={next} aria-label="Siguiente">›</button>
          </div>

          {current?.title ? <div className="album-caption">{current.title}</div> : null}

          <div className="album-thumbs">
            {photos.map((p, i) => (
              <button
                key={i}
                className={`album-thumb ${i === index ? "active" : ""}`}
                onClick={() => go(i)}
                type="button"
              >
                <img src={getThumb(p)} alt="" draggable={false} />
              </button>
            ))}
          </div>
        </div>

        <aside className="album-right">
          <div className="album-topbar">
            <div className="album-badge">{album.category}</div>
            <button className="album-close" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>

          <h3 className="album-title">{album.title}</h3>
          {album.description ? <p className="album-desc">{album.description}</p> : null}

          <div className="album-counter">
            <span className="album-counter-strong">{index + 1}</span> / {total}
          </div>

          <div className="album-actions">
            <button className="album-btn" onClick={prev} type="button">← Anterior</button>
            <button className="album-btn" onClick={next} type="button">Siguiente →</button>
          </div>

          <div className="album-hints">
            <div>• ESC para cerrar</div>
            <div>• ← → para navegar</div>
            <div>• Doble click para zoom</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
