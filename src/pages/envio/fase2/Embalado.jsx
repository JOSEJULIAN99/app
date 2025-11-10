// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\envio\fase2\Embalado.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../../config.js';

// Modal genérico para pedir motivo
function MotivoModal({ title, onClose, onConfirm }) {
  const [motivo, setMotivo] = useState('');
  return (
    <div className="drawer" onClick={onClose}>
      <div
        className="drawer-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520 }}
      >
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <textarea
          rows={5}
          style={{ width: '100%', borderRadius: 12, padding: 10 }}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Describe el motivo…"
        />
        <div className="actions-row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button
            className="btn primary"
            onClick={() => { if (!motivo.trim()) return; onConfirm(motivo.trim()); }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Embalado() {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMotivo, setShowMotivo] = useState(null);

  const navigate = useNavigate();

  // helpers
  function normalizePedidos(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.content)) return raw.content;
    if (Array.isArray(raw.rows)) return raw.rows;
    if (Array.isArray(raw.lista)) return raw.lista;
    // soporte a forma { ok, data: { data: [...] } }
    if (raw?.data && Array.isArray(raw.data.data)) return raw.data.data;
    return [];
  }

  async function fetchJson(url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    return res.json();
  }

  async function load() {
    setLoading(true);
    setMsg('');
    try {
      const urls = [
        `${API_BASE}/api/pedidos?estado=REGISTRADO`,
        `${API_BASE}/api/pedidos?estado=registrado`,
        `${API_BASE}/api/pedidos`,
      ];

      let pedidos = [];
      let lastError = null;

      for (const url of urls) {
        try {
          const data = await fetchJson(url);
          const arr = normalizePedidos(data);
          if (arr.length > 0) { pedidos = arr; break; }
        } catch (e) { lastError = e; }
      }

      if (pedidos.length === 0) {
        if (lastError) throw lastError;
        setRows([]); return;
      }

      const registrados = pedidos.filter((p) => {
        const est = (p.estado || p.estado_envio || p.estado_pedido || '').toString();
        return est.toUpperCase() === 'REGISTRADO';
      });

      setRows(registrados.length > 0 ? registrados : pedidos);
    } catch (e) {
      setMsg(e.message || 'No se pudo listar los pedidos.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function identityHeaders() {
    const h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    const u = (localStorage.getItem('wombo_usuario') || '').toUpperCase();
    const uid = localStorage.getItem('wombo_usuario_id') || '';
    if (u) h['x-usuario'] = u;
    if (uid) h['x-usuario-id'] = uid;
    return h;
  }

  async function marcarEmbalado(id) {
    setMsg('');
    try {
      // attachActor acepta usuario en headers o body; preferimos headers
      const res = await fetch(`${API_BASE}/api/pedidos/${id}/embalar`, {
        method: 'POST',
        headers: identityHeaders(),
        body: JSON.stringify({ usuario: (localStorage.getItem('wombo_usuario') || 'JOSE').toUpperCase() }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.message || 'No se pudo marcar como EMBALADO');
      }
      await load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function eliminar(id, motivo) {
    setMsg('');
    try {
      const body = {
        usuario: (localStorage.getItem('wombo_usuario') || 'JOSE').toUpperCase(),
        motivo,
      };
      const res = await fetch(`${API_BASE}/api/pedidos/${id}`, {
        method: 'DELETE',
        headers: identityHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.message || 'No se pudo eliminar el pedido');
      }
      setShowMotivo(null);
      await load();
    } catch (e) {
      setMsg(e.message);
    }
  }


  return (
    <main className="container">
      <h1>Fase 2 · Embalado (REGISTRADOS)</h1>

      {msg && <div className="notice">{msg}</div>}

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div className="hint">Cargando…</div>
        ) : rows.length === 0 ? (
          <div className="hint">No hay pedidos REGISTRADOS.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>#</th>
                <th style={{ textAlign: 'left' }}>Cliente</th>
                <th style={{ textAlign: 'left' }}>Agencia / Dirección</th>
                <th style={{ textAlign: 'left' }}>Ubicación</th>
                <th>Total</th>
                <th>Pendiente</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const total = Number(row.total || 0);
                const abono = Number(row.abono || 0);
                const pendiente = Number(
                  row.pendiente != null ? row.pendiente : (total - abono)
                );
                const destino =
                  row.agencia_tipo === 'SHALOM'
                    ? (row.nom_agencia_o_direccion || row.agencia_nombre || '-')
                    : (row.nom_agencia_o_direccion || row.direccion || row.agencia_direccion || '-');

                return (
                  <tr key={row.id}>
                    <td>#{row.id}</td>
                    <td>
                      <div>
                        <strong>
                          {row.clientes?.nombre_completo ||
                            row.cliente_nombre ||
                            row.cliente ||
                            '—'}
                        </strong>
                      </div>
                      <div className="hint">
                        {row.clientes?.telefono || row.cliente_telefono || '—'}
                      </div>
                    </td>
                    <td>
                      <div><strong>{row.agencia_tipo || '—'}</strong></div>
                      <div className="hint">{destino}</div>
                    </td>
                    <td>
                      {(row.dpto || row.departamento || '—')} /{' '}
                      {(row.prov || row.provincia || '—')} /{' '}
                      {(row.dist || row.distrito || '—')}
                    </td>
                    <td style={{ textAlign: 'right' }}>S/{total.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>S/{pendiente.toFixed(2)}</td>
                    <td style={{ whiteSpace: 'nowrap', display: 'flex', gap: 6 }}>
                      <Link
                        to={`/envio/fase2/imprimir/${row.id}`}
                        className="btn"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Imprimir
                      </Link>
                      <button className="btn" onClick={() => navigate(`/envio/fase2/editar/${row.id}`)} type="button">Editar</button>
                      <button className="btn" onClick={() => marcarEmbalado(row.id)} type="button">
                        Embalado
                      </button>
                      <button
                        className="btn"
                        onClick={() => setShowMotivo({ type: 'eliminar', id: row.id })}
                        type="button"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* modal eliminar */}
      {showMotivo?.type === 'eliminar' && (
        <MotivoModal
          title="Motivo de eliminación"
          onClose={() => setShowMotivo(null)}
          onConfirm={(motivo) => eliminar(showMotivo.id, motivo)}
        />
      )}
    </main>
  );
}
