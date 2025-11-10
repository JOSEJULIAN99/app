// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\admin\AdminAgencias.jsx
import { useEffect, useState, useCallback } from 'react';
import { API_BASE } from '../../config.js';
import { fetchWithUser } from '../../utils/user.js';

const EMPTY = {
  nombre_agencia: '',
  dpto: '',
  prov: '',
  dist: '',
  direccion: '',
  referencia: '',
  telefono: '',
};

export default function AdminAgencias() {
  const [filters, setFilters] = useState({ dpto: '', prov: '', dist: '', nombre: '' });
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState(null);

  const load = useCallback(async () => {
    setMsg('');
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v.trim()) qs.set(k, v.trim());
      });
      const url = qs.toString()
        ? `${API_BASE}/api/admin/agencias?${qs.toString()}`
        : `${API_BASE}/api/admin/agencias`;

      const res = await fetchWithUser(url);
      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(err?.message || 'Error cargando agencias');
      }
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      {/* filtros */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Buscar agencias</h2>
        <form
          className="grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}
          onSubmit={e => {
            e.preventDefault();
            load();
          }}
        >
          <input
            placeholder="Dpto"
            value={filters.dpto}
            onChange={e => setFilters(f => ({ ...f, dpto: e.target.value }))}
          />
          <input
            placeholder="Prov"
            value={filters.prov}
            onChange={e => setFilters(f => ({ ...f, prov: e.target.value }))}
          />
          <input
            placeholder="Dist"
            value={filters.dist}
            onChange={e => setFilters(f => ({ ...f, dist: e.target.value }))}
          />
          <input
            placeholder="Nombre"
            value={filters.nombre}
            onChange={e => setFilters(f => ({ ...f, nombre: e.target.value }))}
          />
        </form>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={load} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          <button className="btn" onClick={() => setEdit({ ...EMPTY })}>
            Nueva agencia
          </button>
        </div>
      </section>

      {/* tabla */}
      <section className="card" style={{ overflowX: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>Agencias</h2>
        {msg && <div className="notice">{msg}</div>}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dpto</th>
              <th>Prov</th>
              <th>Dist</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.nombre_agencia}</td>
                <td>{r.dpto}</td>
                <td>{r.prov}</td>
                <td>{r.dist}</td>
                <td>{r.direccion}</td>
                <td>{r.telefono}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn" onClick={() => setEdit(r)}>
                    Editar
                  </button>
                  <button
                    className="btn"
                    onClick={() => delRow(r.id, load, setMsg)}
                    style={{ marginLeft: 4 }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 12 }}>
                  No hay agencias para los filtros indicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* drawer de edición */}
      {edit && (
        <Editor
          edit={edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            load();
          }}
        />
      )}
    </>
  );
}

function Editor({ edit, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ ...edit }));
  const isNew = !edit.id;
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const url = isNew
        ? `${API_BASE}/api/admin/agencias`
        : `${API_BASE}/api/admin/agencias/${form.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetchWithUser(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(err?.message || 'No se pudo guardar');
      }
      onSaved();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="drawer" onClick={onClose}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{isNew ? 'Nueva agencia' : 'Editar agencia'}</h3>
        <div className="form">
          <label>Nombre</label>
          <input
            value={form.nombre_agencia || ''}
            onChange={e => setForm(f => ({ ...f, nombre_agencia: e.target.value }))}
          />

          <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            <input
              placeholder="Dpto"
              value={form.dpto || ''}
              onChange={e => setForm(f => ({ ...f, dpto: e.target.value }))}
            />
            <input
              placeholder="Prov"
              value={form.prov || ''}
              onChange={e => setForm(f => ({ ...f, prov: e.target.value }))}
            />
            <input
              placeholder="Dist"
              value={form.dist || ''}
              onChange={e => setForm(f => ({ ...f, dist: e.target.value }))}
            />
          </div>

          <label>Dirección</label>
          <input
            value={form.direccion || ''}
            onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
          />

          <label>Referencia</label>
          <input
            value={form.referencia || ''}
            onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))}
          />

          <label>Teléfono</label>
          <input
            value={form.telefono || ''}
            onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
          />
        </div>

        <div className="actions-row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="btn primary" onClick={save} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

async function delRow(id, reload, setMsg) {
  if (!confirm('¿Eliminar definitivamente esta agencia?')) return;
  try {
    const res = await fetchWithUser(`${API_BASE}/api/admin/agencias/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await safeJson(res);
      throw new Error(err?.message || 'No se pudo eliminar');
    }
    await reload();
  } catch (e) {
    setMsg(e.message);
  }
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
