import React, { useEffect, useState } from 'react';
import "./admin.css";
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/init';
import Login from './Login.jsx';
import AdminDashboard from './AdminDashboard.jsx';

export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div>Verificando sesión...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em' }}>
            ISOLE ADMIN
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
            Panel de contenido
          </div>
        </div>
        <div style={{ fontSize: '0.8rem' }}>
          {user.email}
          <button style={{ marginLeft: 10 }} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="admin-main">
        <AdminDashboard />
      </main>
    </div>
  );
}
