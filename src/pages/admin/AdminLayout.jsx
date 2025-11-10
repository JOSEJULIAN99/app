// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\admin\AdminLayout.jsx
import { Link, Outlet, useLocation } from 'react-router-dom';
import { getSession } from '../../utils/user.js';

export default function AdminLayout() {
  // defensivo: puede venir null
  const sess = getSession() || {};
  const isAdmin = sess.rol === 'ADMIN';
  const location = useLocation();

  // ojo: en App.jsx ya tienes <RequireAdmin> alrededor del /admin,
  // pero dejamos este check por si alguien entra directo al componente
  if (!sess.usuario) {
    return (
      <main className="container">
        <div className="notice">Inicia sesión para acceder a /admin.</div>
      </main>
    );
  }
  if (!isAdmin) {
    return (
      <main className="container">
        <div className="notice">Acceso restringido. Solo ADMIN.</div>
      </main>
    );
  }

  const isActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(path + '/');

  return (
    <main className="container">
      <h1>Admin</h1>
      <nav className="actions-row" style={{ marginBottom: 12 }}>
        <Link
          className="btn"
          style={isActive('/admin') ? { background: 'var(--primary)', color: '#fff' } : {}}
          to="/admin"
        >
          Dashboard
        </Link>
        <Link
          className="btn"
          style={isActive('/admin/usuarios') ? { background: 'var(--primary)', color: '#fff' } : {}}
          to="/admin/usuarios"
        >
          Usuarios
        </Link>
        <Link
          className="btn"
          style={isActive('/admin/agencias') ? { background: 'var(--primary)', color: '#fff' } : {}}
          to="/admin/agencias"
        >
          Agencias Shalom
        </Link>
      </nav>

      <Outlet />
    </main>
  );
}
