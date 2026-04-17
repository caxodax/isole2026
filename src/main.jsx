import React from 'react';
import ReactDOM from 'react-dom/client';
import PublicApp from './public/PublicApp.jsx';
import AdminApp from './admin/AdminApp.jsx';
import { HelmetProvider } from 'react-helmet-async';
import './styles/base.css';

const path = window.location.pathname;
const isAdmin = path.startsWith('/admin');

ReactDOM.createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    {isAdmin ? <AdminApp /> : <PublicApp />}
  </HelmetProvider>
);
