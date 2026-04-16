import React, { useEffect, useState } from 'react';
import { db } from '../firebase/init';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

// Componentes refactorizados
import AdminTabs from './components/AdminTabs';
import PhotoManager from './components/PhotoManager';
import VideoManager from './components/VideoManager';
import ServiceManager from './components/ServiceManager';
import AppointmentList from './components/AppointmentList';
import MetadataManager from './components/MetadataManager';
import SiteConfigManager from './components/SiteConfigManager';
import TestimonialManager from './components/TestimonialManager';

export default function AdminDashboard() {
  const [tab, setTab] = useState('photos');

  // Datos compartidos
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  
  // Metadatos dinámicos (Fotos)
  const [categories, setCategories] = useState([]);
  const [albums, setAlbums] = useState([]);

  // Metadatos dinámicos (Videos)
  const [videoCategories, setVideoCategories] = useState([]);
  const [videoAlbums, setVideoAlbums] = useState([]);

  // ---- CARGAS DE DATOS ----
  const loadPhotos = async () => {
    try {
      const q = query(collection(db, 'photos'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error cargando fotos', err);
    }
  };

  const loadVideos = async () => {
    try {
      const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setVideos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error cargando videos', err);
    }
  };

  const loadAppointments = async () => {
    try {
      const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error cargando citas', err);
    }
  };

  const loadServices = async () => {
    try {
      const q = query(collection(db, 'services'), orderBy('order', 'asc'));
      const snap = await getDocs(q);
      setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error cargando servicios', err);
    }
  };

  const loadMetadata = async () => {
    try {
      // Metadatos de Fotos
      const catsSnap = await getDocs(query(collection(db, 'categories'), orderBy('name', 'asc')));
      setCategories(catsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const albumsSnap = await getDocs(query(collection(db, 'albums'), orderBy('createdAt', 'desc')));
      setAlbums(albumsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Metadatos de Videos
      const vCatsSnap = await getDocs(query(collection(db, 'video_categories'), orderBy('name', 'asc')));
      setVideoCategories(vCatsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const vAlbumsSnap = await getDocs(query(collection(db, 'video_albums'), orderBy('createdAt', 'desc')));
      setVideoAlbums(vAlbumsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (err) {
      if (err.code === 'permission-denied') {
        console.warn('Metadata loading blocked by Firebase rules. Please update your rules.');
      } else {
        console.error('Error cargando metadatos', err);
      }
    }
  };

  useEffect(() => {
    loadPhotos();
    loadVideos();
    loadAppointments();
    loadServices();
    loadMetadata();
  }, []);

  return (
    <div className="admin-dashboard">
      <AdminTabs activeTab={tab} onTabChange={setTab} />

      <div className="admin-content">
        {tab === 'photos' && (
          <PhotoManager 
            photos={photos} 
            categories={categories}
            albums={albums}
            onRefresh={() => { loadPhotos(); loadMetadata(); }} 
          />
        )}

        {tab === 'videos' && (
          <VideoManager 
            videos={videos} 
            categories={videoCategories}
            albums={videoAlbums}
            onRefresh={() => { loadVideos(); loadMetadata(); }} 
          />
        )}

        {tab === 'services' && (
          <ServiceManager services={services} onRefresh={loadServices} />
        )}

        {tab === 'appointments' && (
          <AppointmentList appointments={appointments} />
        )}

        {tab === 'site' && (
          <SiteConfigManager />
        )}

        {tab === 'testimonials' && (
          <TestimonialManager />
        )}

        {tab === 'config' && (
          <MetadataManager 
            categories={categories} 
            albums={albums} 
            photos={photos}
            videoCategories={videoCategories}
            videoAlbums={videoAlbums}
            videos={videos}
            onRefresh={loadMetadata} 
          />
        )}
      </div>
    </div>
  );
}
