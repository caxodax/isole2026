import React from 'react';

export default function AdminTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'photos', label: 'Fotos' },
    { id: 'videos', label: 'Videos' },
    { id: 'services', label: 'Servicios' },
    { id: 'appointments', label: 'Citas' },
    { id: 'site', label: 'Sitio' },
    { id: 'testimonials', label: 'Experiencias' },
    { id: 'config', label: 'Configuración' },
  ];

  return (
    <div className="admin-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`admin-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
