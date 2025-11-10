// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\envio\fase3\Enviados.jsx
import { useEffect, useState } from 'react';
import { API_BASE } from '../../../config.js';
import { fetchWithUser } from '../../../utils/user.js';

// --- Modales reutilizables (mismo estilo que ya usas) ---
function ModalMotivo({ title, onClose, onConfirm }) {
  const [motivo, setMotivo] = useState('');
  return (
    <div className="drawer" onClick={onClose}>
      <div
        className="drawer-panel"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 520 }}
      >
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <textarea
          rows={5}
          style={{ width: '100%', borderRadius: 12, padding: 10 }}
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          placeholder="Describe el motivo…"
        />
        <div className="actions-row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn primary"
            onClick={() => onConfirm(motivo.trim())}
            disabled={!motivo.trim()}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalPago({ pendiente, onClose, onConfirm }) {
  const [monto, setMonto] = useState(pendiente ?? 0);
  const [motivo, setMotivo] = useState('');
  const montoNum = Number(monto) || 0;
  const pendienteNum = Number(pendiente) || 0;
  const difiere = Math.abs(montoNum - pendienteNum) > 0.009;

  return (
    <div className="drawer" onClick={onClose}>
      <div
        className="drawer-panel"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 520 }}
      >
        <h3 style={{ marginTop: 0 }}>Registrar pago</h3>

        <div>
          Pendiente actual:{' '}
          <strong>S/{pendienteNum.toFixed(2)}</strong>
        </div>

        <label style={{ marginTop: 8 }}>Monto pagado (S/)</label>
        <input
          inputMode="decimal"
          value={monto}
          onChange={e => setMonto(e.target.value)}
        />

        {difiere && (
          <>
            <div className="notice" style={{ marginTop: 8 }}>
              El monto difiere del pendiente. Debe indicar un motivo.
            </div>
            <label>Motivo</label>
            <textarea
              rows={4}
              style={{ width: '100%', borderRadius: 12, padding: 10 }}
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
            />
          </>
        )}

        <div className="actions-row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn primary"
            onClick={() =>
              onConfirm({
                monto: montoNum,
                motivo: difiere ? motivo.trim() : undefined
              })
            }
            disabled={montoNum < 0 || (difiere && !motivo.trim())}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Enviados() {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  // modal = { type:'regresar'|'cancelar'|'pagar', id, pendiente? }
  const [modal, setModal] = useState(null);

  async function load() {
    setLoading(true);
    setMsg('');
    try {
        const res = await fetchWithUser(`${API_BASE}/api/pedidos?estado=EMBALADO`);
        if (!res.ok) throw new Error('No se pudo cargar la lista');
        
        const json = await res.json();
        
        // 🎯 CORRECCIÓN: Extraer la lista de la propiedad 'data'
        const finalRows = Array.isArray(json) ? json : (json.data || []);
        
        setRows(finalRows); // Ahora setRows recibe el array de pedidos
    } catch (e) {
        setMsg(e.message);
    } finally {
        setLoading(false);
    }
}

  useEffect(() => {
    load();
  }, []);

  // helpers
  function currentUser() {
    return (localStorage.getItem('wombo_usuario') || 'JOSE').toUpperCase();
  }

  // ACCIONES
  async function doRegresar(id, motivo) {
    try {
      const usuario = currentUser();
      const res = await fetchWithUser(`${API_BASE}/api/pedidos/${id}/regresar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, motivo })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'No se pudo regresar');
      }
      setModal(null);
      await load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function doCancelar(id, motivo) {
    try {
      const usuario = currentUser();
      const res = await fetchWithUser(`${API_BASE}/api/pedidos/${id}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, motivo })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'No se pudo cancelar');
      }
      setModal(null);
      await load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function doPagar(id, { monto, motivo }) {
  try {
    const usuario = currentUser();
    const res = await fetchWithUser(`${API_BASE}/api/pedidos/${id}/pagar`, {
      // 👆 orden correcto
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, monto, motivo })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || 'No se pudo registrar el pago');
    }
    setModal(null);
    await load();
  } catch (e) {
    setMsg(e.message);
  }
}

  return (
    <main className="container">
      <h1>Fase 3 · Enviados (EMBALADOS)</h1>

      {msg && <div className="notice">{msg}</div>}

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div>Cargando…</div>
        ) : rows.length === 0 ? (
          <div className="hint">No hay pedidos EMBALADOS.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>#</th>
                <th style={{ textAlign: 'left' }}>Cliente</th>
                <th style={{ textAlign: 'left' }}>Agencia / Dirección</th>
                <th style={{ textAlign: 'left' }}>Ubicación</th>
                <th>Total</th>
                <th>Abono</th>
                <th>Pendiente</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>
                    <div>
                      <strong>{r.clientes?.nombre_completo}</strong>
                    </div>
                    <div className="hint">{r.clientes?.telefono}</div>
                  </td>
                  <td>
                    <div>
                      <strong>{r.agencia_tipo}</strong>
                    </div>
                    <div className="hint">
                      {r.agencia_tipo === 'SHALOM'
                        ? r.agencia_nombre || '-'
                        : r.direccion || '-'}
                    </div>
                  </td>
                  <td>
                    {r.dpto} / {r.prov} / {r.dist}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    S/{Number(r.total).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    S/{Number(r.abono).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    S/{Number(r.pendiente).toFixed(2)}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button
                      className="btn"
                      onClick={() => setModal({ type: 'regresar', id: r.id })}
                    >
                      Regresar
                    </button>
                    <button
                      className="btn"
                      onClick={() => setModal({ type: 'cancelar', id: r.id })}
                    >
                      Cancelado
                    </button>
                    <button
                      className="btn"
                      onClick={() =>
                        setModal({
                          type: 'pagar',
                          id: r.id,
                          pendiente: r.pendiente
                        })
                      }
                    >
                      Pagado
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODALES */}
      {modal?.type === 'regresar' && (
        <ModalMotivo
          title="Motivo de regreso a REGISTRADO"
          onClose={() => setModal(null)}
          onConfirm={mot => doRegresar(modal.id, mot)}
        />
      )}
      {modal?.type === 'cancelar' && (
        <ModalMotivo
          title="Motivo de cancelación"
          onClose={() => setModal(null)}
          onConfirm={mot => doCancelar(modal.id, mot)}
        />
      )}
      {modal?.type === 'pagar' && (
        <ModalPago
          pendiente={modal.pendiente}
          onClose={() => setModal(null)}
          onConfirm={payload => doPagar(modal.id, payload)}
        />
      )}
    </main>
  );
}
