// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\Login.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, getSession } from '../utils/user.js';
import { KEYS, saveLocal } from '../utils/storage.js'; // ⬅️ añadimos esto

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const sess = getSession(); // { usuario, rol, user_id?, username? } o null

  // si venía de una ruta protegida, la guardamos en state (ej: /admin/usuarios)
  const from = location.state?.from || '/';

  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // si YA está logueado, no tiene sentido mostrar login
  useEffect(() => {
    if (sess?.usuario) {
      nav('/admin', { replace: true });
    }
  }, [sess, nav]);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      // normalizamos a mayúscula porque tu backend lo usa así
      const u = usuario.trim().toUpperCase();
      const p = clave.trim();
      if (!u || !p) {
        throw new Error('Complete usuario y clave.');
      }

      // ⬇️ login retorna { ...data, usuario, rol, id? }
      const res = await login(u, p);

      // ⬇️ Persistimos la sesión que otros componentes leen (ej. Abono.jsx)
      //    username: el handle visible; user_id: si el backend lo devuelve
      saveLocal(KEYS.SESSION, {
        user_id: res.id || null,
        username: res.usuario || u,
      });

      // si vino de una ruta protegida vuelve ahí; si no, a /admin
      nav(from, { replace: true });
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container narrow">
      <h1>Login</h1>
      <form className="card form" onSubmit={onSubmit}>
        <label>Usuario</label>
        <input
          autoComplete="username"
          value={usuario}
          onChange={e => setUsuario(e.target.value)}
          placeholder="Ingrese su usuario"
        />

        <label>Clave</label>
        <input
          type="password"
          autoComplete="current-password"
          value={clave}
          onChange={e => setClave(e.target.value)}
          placeholder="****"
        />

        {msg && <div className="notice">{msg}</div>}

        <button className="btn primary" disabled={loading}>
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}
