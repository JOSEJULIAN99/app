// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\envio\fase1\Enviar.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KEYS, loadLocal } from '../../../utils/storage.js';
import { fmtPEN, round2 } from '../../../utils/money.js';

export default function Enviar() {
  const navigate = useNavigate();

  // 1) Tomamos un "snapshot" de TODO lo necesario apenas se monta la vista
  //    y luego limpiamos el almacenamiento local para dejar la fase lista.
  const [snap] = useState(() => ({
    cliente: loadLocal(KEYS.FASE1_CLIENTE, null),
    agencia: loadLocal(KEYS.FASE1_AGENCIA, null),
    pedido: loadLocal(KEYS.FASE1_PEDIDO, null),
    abonoData: loadLocal(KEYS.FASE1_ABONO, { abono: 0 }),
    registro: loadLocal(KEYS.FASE1_REGISTRO, null), // { ok, pedido_id, total, abono, pendiente }
  }));

  // 2) Limpieza inmediata de todas las llaves FASE1_* (mantiene visible el snapshot en memoria)
  useEffect(() => {
    try {
      localStorage.removeItem(KEYS.FASE1_CLIENTE);
      localStorage.removeItem(KEYS.FASE1_AGENCIA);
      localStorage.removeItem(KEYS.FASE1_PEDIDO);
      localStorage.removeItem(KEYS.FASE1_ABONO);
      localStorage.removeItem(KEYS.FASE1_REGISTRO);
    } catch { /* noop */ }
  }, []);

  // 3) Totales locales (por si registro no tiene todo)
  const subtotal = useMemo(() => {
    if (!snap.pedido?.items) return 0;
    return round2(
      snap.pedido.items.reduce(
        (a, x) => a + Number(x.cantidad || 0) * Number(x.precio_unitario || 0),
        0
      )
    );
  }, [snap.pedido]);

  const descMonto = useMemo(() => {
    if (!snap.pedido?.descuento) return 0;
    const t = (snap.pedido.descuento.tipo || 'monto').toLowerCase();
    const v = Number(snap.pedido.descuento.valor || 0);
    if (t === 'porc') {
      const porc = Math.min(100, Math.max(0, v));
      return round2((subtotal * porc) / 100);
    }
    return round2(Math.min(subtotal, Math.max(0, v)));
  }, [snap.pedido, subtotal]);

  const totalLocal = useMemo(() => round2(subtotal - descMonto), [subtotal, descMonto]);

  // 4) Texto de WhatsApp (usamos registro si está, si no, lo local)
  const texto = useMemo(() => {
    if (!snap.cliente || !snap.agencia || !snap.pedido) {
      return 'Faltan datos de la Fase 1 (cliente / agencia / pedido).';
    }

    const nombreCliente = snap.cliente.nombre || snap.cliente.nombre_completo || '—';
    const lineas = [];

    lineas.push('PEDIDO');
    if (snap.registro?.pedido_id) lineas.push(`N°: ${snap.registro.pedido_id}`);
    lineas.push(`Cliente: ${nombreCliente}`);
    lineas.push(`Documento: ${snap.cliente.tipo_doc || ''}-${snap.cliente.nro_doc || ''}`);
    lineas.push(`Agencia: ${snap.agencia.agencia_tipo || '—'}`);

    const destino =
      snap.agencia.agencia_tipo === 'SHALOM'
        ? snap.agencia.nombre_agencia || '-'
        : snap.agencia.direccion || '-';

    lineas.push(`Destino: ${destino}`);
    lineas.push(
      `Ubicación: ${snap.agencia.dpto || '-'}-${snap.agencia.prov || '-'}-${snap.agencia.dist || '-'}`
    );

    lineas.push('Detalle:');
    (snap.pedido.items || []).forEach((x) => {
      const cant = Number(x.cantidad || 0);
      const pu = Number(x.precio_unitario || 0);
      const totalLinea = round2(cant * pu);
      lineas.push(`${cant} x ${x.nombre} = S/${totalLinea.toFixed(2)}`);
    });

    const totalFinal = snap.registro?.total ?? totalLocal;
    const abonoFinal = snap.registro?.abono ?? Number(snap.abonoData?.abono || 0);
    const pendienteFinal =
      snap.registro?.pendiente ?? Math.max(0, totalLocal - Number(snap.abonoData?.abono || 0));

    if (descMonto > 0) lineas.push(`Descuento: -${fmtPEN(descMonto)}`);
    lineas.push(`Total: ${fmtPEN(totalFinal)}`);
    lineas.push(`Adelanto: ${fmtPEN(abonoFinal)}`);
    lineas.push(`Pendiente: ${fmtPEN(pendienteFinal)}`);

    return lineas.join('\n');
  }, [snap, totalLocal, descMonto]);

  // 5) Acciones
  function enviarWhatsApp() {
    if (!snap.cliente?.telefono) return;
    const tel = normalizarTelefono(snap.cliente.telefono);
    if (!tel) return;
    const url = `https://wa.me/${encodeURIComponent(tel)}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    // Ya está todo limpio en localStorage por el efecto de montaje
  }

  function nuevo() {
    // Redundante (ya limpiamos al montar), pero idempotente por si recargan:
    try {
      localStorage.removeItem(KEYS.FASE1_CLIENTE);
      localStorage.removeItem(KEYS.FASE1_AGENCIA);
      localStorage.removeItem(KEYS.FASE1_PEDIDO);
      localStorage.removeItem(KEYS.FASE1_ABONO);
      localStorage.removeItem(KEYS.FASE1_REGISTRO);
    } catch { /* noop */ }
    navigate('/envio/fase1/cliente');
  }

  // 6) Si falta info (por recarga posterior), mostramos aviso
  const faltanDatos = !snap.cliente || !snap.agencia || !snap.pedido;

  return (
    <main className="container narrow">
      <h1>Fase 1 · Enviar</h1>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Vista previa del mensaje</h2>

        {faltanDatos && (
          <div className="notice" style={{ marginBottom: 10 }}>
            Faltan datos de la Fase 1. Regrese y complete cliente, agencia y pedido.
          </div>
        )}

        <textarea
          readOnly
          rows={14}
          style={{ width: '100%', borderRadius: 12, padding: 12 }}
          value={texto}
        />

        <div className="actions-row" style={{ marginTop: 10 }}>
          <button
            className="btn primary"
            onClick={enviarWhatsApp}
            disabled={faltanDatos || !snap.cliente?.telefono}
          >
            Enviar
          </button>
          <button className="btn" onClick={nuevo}>
            Nuevo
          </button>
          <Link to="/" className="btn">
            Inicio
          </Link>
        </div>
      </div>
    </main>
  );
}

// Limpia todo salvo dígitos para wa.me
function normalizarTelefono(t) {
  if (!t) return '';
  return String(t).replace(/\D+/g, '');
}
