// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\admin\AdminUsuarios.jsx
import { useEffect, useState } from 'react';
import { API_BASE } from '../../config.js';
import { fetchWithUser } from '../../utils/user.js';

export default function AdminUsuarios() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    usuario: '',
    clave_prov: '',
    rol: 'OPERADOR',
    activo: true,
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setMsg('');
    setLoading(true);
    try {
      const res = await fetchWithUser(`${API_BASE}/api/admin/usuarios`);
      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(err?.message || 'Error cargando usuarios');
      }
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setMsg(e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function crear() {
    setMsg('');
    // validación mínima en front
    if (!form.usuario.trim() || !form.clave_prov.trim()) {
      setMsg('Usuario y clave son obligatorios');
      return;
    }
    try {
      const res = await fetchWithUser(`${API_BASE}/api/admin/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: form.usuario.toUpperCase().trim(),
          clave_prov: form.clave_prov.trim(),
          rol: form.rol.toUpperCase(),
          activo: form.activo,
        }),
      });
      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(err?.message || 'No se pudo crear');
      }
      setForm({ usuario: '', clave_prov: '', rol: 'OPERADOR', activo: true });
      await load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function actualizar(id, patch) {
    setMsg('');
    try {
      const res = await fetchWithUser(`${API_BASE}/api/admin/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(err?.message || 'No se pudo actualizar');
      }
      await load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Inactivar este usuario?')) return;
    setMsg('');
    try {
      const res = await fetchWithUser(`${API_BASE}/api/admin/usuarios/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(err?.message || 'No se pudo eliminar');
      }
      await load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  function cambiarClave(id, usuario) {
    const nueva = prompt(`Nueva clave para ${usuario}:`, '');
    if (nueva === null) return; // canceló
    if (!nueva.trim()) {
      alert('La clave no puede estar vacía');
      return;
    }
    actualizar(id, { clave_prov: nueva.trim() });
  }

  return (
    <>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Crear usuario</h2>
        <div
          className="grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}
        >
          <input
            placeholder="Usuario (MAYUS)"
            value={form.usuario}
            onChange={e =>
              setForm(f => ({ ...f, usuario: e.target.value.toUpperCase() }))
            }
          />
          <input
            placeholder="Clave prov."
            type="password"
            value={form.clave_prov}
            onChange={e => setForm(f => ({ ...f, clave_prov: e.target.value }))}
          />
          <select
            value={form.rol}
            onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}
          >
            <option value="OPERADOR">OPERADOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={form.activo}
              onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
            />{' '}
            Activo
          </label>
        </div>
        <div className="actions-row" style={{ marginTop: 8 }}>
          <button className="btn primary" onClick={crear}>
            Crear
          </button>
        </div>
      </section>

      <section className="card" style={{ overflowX: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>Usuarios</h2>
        {msg && <div className="notice">{msg}</div>}
        {loading ? (
          <div className="hint">Cargando…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.usuario}</td>
                  <td>
                    <select
                      value={r.rol}
                      onChange={e => actualizar(r.id, { rol: e.target.value })}
                    >
                      <option value="OPERADOR">OPERADOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!r.activo}
                      onChange={e => actualizar(r.id, { activo: e.target.checked })}
                    />
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button
                      className="btn"
                      onClick={() => cambiarClave(r.id, r.usuario)}
                    >
                      Cambiar clave
                    </button>
                    <button
                      className="btn"
                      onClick={() => eliminar(r.id)}
                      style={{ marginLeft: 4 }}
                    >
                      Inactivar
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 12 }}>
                    No hay usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
