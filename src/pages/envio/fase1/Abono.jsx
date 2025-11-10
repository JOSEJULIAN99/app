// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\envio\fase1\Abono.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../../config.js';
import { KEYS, loadLocal, saveLocal } from '../../../utils/storage.js';
import { fmtPEN, round2, toNumber } from '../../../utils/money.js';

export default function Abono() {
  const navigate = useNavigate();

  // === Estado compartido (fase anterior) ===
  const cliente = loadLocal(KEYS.FASE1_CLIENTE, null);
  const agencia = loadLocal(KEYS.FASE1_AGENCIA, null);
  const pedido  = loadLocal(KEYS.FASE1_PEDIDO,  null);
  const abonoSaved = loadLocal(KEYS.FASE1_ABONO, { abono: 0 });

  // === Sesión para obtener usuario_id / usuario ===
  const session = loadLocal(KEYS.SESSION, null); // { user_id: <uuid>, username: 'jose', ... }

  // === Estado local ===
  const [abono, setAbono] = useState(() => toNumber(abonoSaved.abono || 0));
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirecciones si faltan prerequisitos
  useEffect(() => {
    if (!cliente) {
      navigate('/envio/fase1/cliente', { replace: true });
    } else if (!agencia) {
      navigate('/envio/fase1/agencia', { replace: true });
    } else if (!pedido) {
      navigate('/envio/fase1/pedido', { replace: true });
    }
  }, [cliente, agencia, pedido, navigate]);

  // Persistir abono en local
  useEffect(() => {
    saveLocal(KEYS.FASE1_ABONO, { abono });
  }, [abono]);

  // === Totales ===
  const subtotal = useMemo(() => {
    if (!pedido?.items?.length) return 0;
    return round2(
      pedido.items.reduce(
        (a, x) => a + toNumber(x.cantidad || 0) * toNumber(x.precio_unitario || 0),
        0
      )
    );
  }, [pedido]);

  const descMonto = useMemo(() => {
    if (!pedido?.descuento) return 0;
    const t = (pedido.descuento.tipo || 'monto').toLowerCase();
    const v = toNumber(pedido.descuento.valor || 0);
    if (t === 'porc') {
      const porc = Math.min(100, Math.max(0, v));
      return round2((subtotal * porc) / 100);
    }
    // monto fijo
    return round2(Math.min(subtotal, Math.max(0, v)));
  }, [pedido, subtotal]);

  const total = useMemo(() => round2(subtotal - descMonto), [subtotal, descMonto]);

  const pendiente = useMemo(
    () => round2(Math.max(0, total - toNumber(abono))),
    [total, abono]
  );

  // Validación previa a registrar
  function validarPrereq() {
    const cliNombre = cliente?.nombre || cliente?.nombre_completo;
    if (!cliente?.tipo_doc || !cliente?.nro_doc || !cliNombre || !cliente?.telefono) {
      setMsg('Faltan datos de cliente. Complete la Fase 1 – Cliente.');
      return false;
    }
    if (!agencia?.agencia_tipo || !agencia?.dpto || !agencia?.prov || !agencia?.dist) {
      setMsg('Faltan datos de agencia. Complete la Fase 1 – Agencia.');
      return false;
    }
    if (!pedido?.items || pedido.items.length === 0) {
      setMsg('El carrito está vacío. Complete la Fase 1 – Pedido.');
      return false;
    }
    if (abono < 0) {
      setMsg('El abono no puede ser negativo.');
      return false;
    }
    if (abono > total) {
      setMsg('El abono no puede ser mayor que el total.');
      return false;
    }
    return true;
  }

  // Normaliza valor de input a dinero con 2 decimales
  function handleAbonoChange(e) {
    const v = e.target.value;
    if (v === '') {
      setAbono(0);
      return;
    }
    const n = toNumber(v, 0);
    const safe = n < 0 ? 0 : n;
    setAbono(round2(safe));
  }

  async function registrarPedido() {
    setMsg('');
    if (!validarPrereq()) return;

    setLoading(true);
    try {
      const cliNombre = cliente.nombre || cliente.nombre_completo;

      const body = {
        cliente: {
          tipo_doc: cliente.tipo_doc,
          nro_doc: cliente.nro_doc,
          nombre_completo: cliNombre,
          telefono: cliente.telefono,
        },
        agencia: {
          agencia_tipo: agencia.agencia_tipo,
          agencia_nombre: agencia.nombre_agencia || null, // SHALOM u OTRA
          direccion: agencia.direccion || null,          // OLVA/FLORES/OTRA
          dpto: agencia.dpto,
          prov: agencia.prov,
          dist: agencia.dist, // OJO: dist (no distrito)
        },
        carrito: {
          items: (pedido.items || []).map((x) => ({
            id: x.id || null, // uuid o null si manual
            nombre: x.nombre,
            cantidad: toNumber(x.cantidad || 0),
            precio_unitario: toNumber(x.precio_unitario || 0),
            es_manual: !!x.es_manual,
          })),
          descuento: {
            tipo: (pedido?.descuento?.tipo || 'monto').toLowerCase(),
            valor: toNumber(pedido?.descuento?.valor || 0),
          },
        },
        abono: toNumber(abono || 0),

        // compat con backend attachActor
        usuario_id: session?.user_id || null,   // UUID directo (si existe)
        usuario: session?.username || null,     // fallback por handle

        // compat legado
        usuario_crea: String(localStorage.getItem('wombo_usuario') || 'JOSE')
          .toUpperCase()
          .trim(),
      };

      // headers opcionales de identidad
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (session?.user_id) headers['x-usuario-id'] = session.user_id;
      if (session?.username) headers['x-usuario'] = session.username;

      const res = await fetch(`${API_BASE}/api/pedidos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.message || 'No se pudo registrar el pedido.');
      }

      // Backend responde: { ok, pedido_id, total, abono, pendiente }
      const data = await res.json();

      // Guardamos el resultado para "Enviar" (NO limpiamos nada aquí)
      saveLocal(KEYS.FASE1_REGISTRO, data);

      navigate('/envio/fase1/enviar');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  const cliNombre = cliente?.nombre || cliente?.nombre_completo || '—';

  return (
    <main className="container narrow">
      <h1>Fase 1 · Abono</h1>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Resumen</h2>

        <div className="form">
          <div>
            <strong>Cliente:</strong> {cliNombre} — {cliente?.telefono || '—'}
          </div>
          <div>
            <strong>Documento:</strong>{' '}
            {cliente?.tipo_doc ? `${cliente.tipo_doc}-${cliente.nro_doc}` : '—'}
          </div>
          <div>
            <strong>Agencia:</strong> {agencia?.agencia_tipo || '—'} |{' '}
            <strong>Destino:</strong>{' '}
            {agencia?.agencia_tipo === 'SHALOM'
              ? agencia?.nombre_agencia || '-'
              : agencia?.direccion || '-'}{' '}
            | <strong>Ubicación:</strong>{' '}
            {agencia?.dpto}/{agencia?.prov}/{agencia?.dist}
          </div>

          <div style={{ marginTop: 8 }}>
            <strong>Subtotal:</strong> {fmtPEN(subtotal)}{' '}
            <strong style={{ marginLeft: 12 }}>Descuento:</strong> -
            {fmtPEN(descMonto)}{' '}
            <strong style={{ marginLeft: 12 }}>Total:</strong> {fmtPEN(total)}
          </div>

          <label style={{ marginTop: 10 }}>Abono inicial (S/)</label>
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={abono}
            onChange={handleAbonoChange}
            onFocus={(e) => e.target.select()}
          />
          <div>
            <strong>Pendiente:</strong> {fmtPEN(pendiente)}
          </div>

          {msg && <div className="notice">{msg}</div>}

          <div className="actions-row">
            <Link to="/envio/fase1/pedido" className="btn">
              Atrás
            </Link>
            <button
              className="btn primary"
              onClick={registrarPedido}
              disabled={loading}
              title="Registra el pedido en la BD y continúa a Enviar"
            >
              {loading ? 'Registrando…' : 'Registrar pedido'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

