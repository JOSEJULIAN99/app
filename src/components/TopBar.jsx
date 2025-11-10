// C:\Users\Jose-Julian\Desktop\wombo\web\src\components\TopBar.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext.jsx';
import { getSession, logout } from '../utils/user.js';

export default function TopBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { mode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // sesión actual
  const session = getSession() || {};
  const usuario = session.usuario || null;
  const rol = session.rol || null;
  const isAdmin = rol === 'ADMIN';

  // detectar scroll para poner sombra
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 6);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMobileMenu = () => setOpen(false);

  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate('/login', { replace: true });
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <header className={`topbar ${scrolled ? 'topbar-scrolled' : ''}`}>
      <div className="topbar-inner">
        {/* IZQUIERDA */}
        <div className="topbar-left">
          {/* hamburguesa (solo móvil) - SIEMPRE VISIBLE EN MÓVIL */}
          <button
            className="btn-icon mobile-only"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú de navegación"
            aria-expanded={open}
            type="button"
          >
            ☰
          </button>

          {/* marca */}
          <Link to="/" className="brand" onClick={closeMobileMenu}>
            <span className="brand-main">Wombo</span>
            <span className="brand-sub">Gestión de envíos</span>
          </Link>
        </div>

        {/* CENTRO (solo desktop) */}
        <nav className="topbar-nav desktop-only" aria-label="Navegación principal">
          <Link
            to="/envio"
            className={`topbar-link ${isActive('/envio') ? 'active' : ''}`}
          >
            Envío
          </Link>

          {isAdmin ? (
            <Link
              to="/admin"
              className={`topbar-link ${isActive('/admin') ? 'active' : ''}`}
            >
              Admin
            </Link>
          ) : (
            <span
              className="topbar-link disabled"
              title="Requiere rol de administrador"
            >
              Admin
            </span>
          )}
        </nav>
        {usuario ? (
            <div className="user-pill" title={usuario}>
              <span className="user-name">{usuario}</span>
              <span className={`user-role ${isAdmin ? 'role-admin' : ''}`}>
                {rol || 'USER'}
              </span>
            </div>
          ) : null}
        {/* DERECHA - APLICAMOS desktop-only al contenedor */}
        <div className="topbar-right desktop-only">
  {/* Tema */}
  <button
    className="btn-icon"
    onClick={toggleTheme}
    type="button"
    aria-label={`Cambiar a modo ${mode === 'light' ? 'oscuro' : 'claro'}`}
  >
    {mode === 'light' ? '🌙' : '☀️'}
  </button>

  {/* Login / Logout (solo visible en escritorio) */}
  {usuario ? (
    <button
      className="btn small"
      onClick={handleLogout}
      type="button"
    >
      Salir
    </button>
  ) : (
    <Link to="/login" className="btn small">
      Login
    </Link>
  )}
</div>

      </div>

      {/* MENÚ MÓVIL (drawer) - NO HAY CAMBIOS AQUÍ */}
      {open && (
        <div
          className="drawer"
          onClick={closeMobileMenu}
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
        >
          <div
            className="drawer-panel"
            onClick={(e) => e.stopPropagation()}
            role="navigation"
          >
            <div className="drawer-header">
              <div className="drawer-title">
                <span className="brand-main">Wombo</span>
                <span className="brand-sub">Gestión de envíos</span>
              </div>
              <button
                className="btn-icon"
                onClick={closeMobileMenu}
                aria-label="Cerrar menú"
                type="button"
              >
                ×
              </button>
            </div>

            {/* usuario en móvil */}
            {usuario ? (
              <div className="drawer-user">
                <span className="drawer-user-name">{usuario}</span>
                <span className={`drawer-user-role ${isAdmin ? 'admin' : ''}`}>
                  {rol || 'USER'}
                </span>
              </div>
            ) : null}

            <ul className="drawer-list">
              <li>
                <Link
                  to="/envio"
                  className={`drawer-link ${isActive('/envio') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Envío
                </Link>
              </li>
              <li>
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className={`drawer-link ${isActive('/admin') ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    Admin
                  </Link>
                ) : (
                  <span className="drawer-link disabled">Admin</span>
                )}
              </li>

              {/* Tema en móvil (Se mantiene visible en el drawer) */}
              <li>
                <button
                  className="btn block"
                  onClick={toggleTheme}
                  type="button"
                >
                  Tema: {mode === 'light' ? 'Claro 🌙' : 'Oscuro ☀️'}
                </button>
              </li>

              {/* Salir / Login en móvil (Se mantiene visible en el drawer) */}
              <li>
                {usuario ? (
                  <button
                    className="btn block primary"
                    onClick={handleLogout}
                    type="button"
                  >
                    Salir
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="btn block primary"
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>
                )}
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
