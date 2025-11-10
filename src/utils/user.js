// C:\Users\Jose-Julian\Desktop\wombo\web\src\utils\user.js
import { API_BASE } from '../config.js';
  
export async function login(usuario, clave) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ usuario, clave })
  });
  if (!res.ok) {
    const e = await res.json().catch(()=>({}));
    throw new Error(e?.message || 'Login inválido');
  }
  const data = await res.json();

  // soporte para las dos formas: plano y dentro de data
  const user = data.usuario || data.data?.usuario || null;
  const rawRol = data.rol || data.data?.rol || 'OPERADOR';
  const rol = String(rawRol).trim().toUpperCase();   // <-- forzamos aquí

  localStorage.setItem('wombo_usuario', user);
  localStorage.setItem('wombo_rol', rol);

  return { ...data, usuario: user, rol };
}

export function logout() {
  localStorage.removeItem('wombo_usuario');
  localStorage.removeItem('wombo_rol');
}

export function getSession() {
  return {
    usuario: localStorage.getItem('wombo_usuario') || null,
    rol: localStorage.getItem('wombo_rol') || null
  };
}

// sigue igual
export async function fetchWithUser(url, options = {}) {
  const sess = getSession();
  const headers = { ...(options.headers || {}), 'x-usuario': sess.usuario || '' };
  return fetch(url, { ...options, headers });
}
