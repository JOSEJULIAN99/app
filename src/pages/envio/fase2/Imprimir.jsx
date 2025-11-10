// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\envio\fase2\Imprimir.jsx
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE } from '../../../config.js';

// =========================
// CONFIG BÁSICA
// =========================
const EMPRESA = 'WOMBO PERU';
import LOGO_URL from '../../../assets/logo.png';

// Formatea teléfono: quita prefijos (+51, +, 00) y agrupa 3-3-3
function formatPhone(raw) {
  if (!raw) return ' - ';
  let t = String(raw).trim();
  // quitar prefijos comunes
  t = t.replace(/^\+?51/, ''); // quita +51 o 51
  t = t.replace(/^\+/, '');    // quita cualquier + restante
  t = t.replace(/^00/, '');    // quita 00 internacional
  // quitar no dígitos
  t = t.replace(/\D+/g, '');
  // agrupar de 3 en 3 (ej: 987 654 321)
  const parts = [];
  for (let i = 0; i < t.length; i += 3) {
    parts.push(t.slice(i, i + 3));
  }
  return parts.join(' ').trim() || ' - ';
}

export default function Imprimir() {
  const { id } = useParams();

  // ====== STATE ======
  const [data, setData] = useState(null);      // { pedido, detalles }
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [printZoom, setPrintZoom] = useState(1);
  const [didPrint, setDidPrint] = useState(false);

  // ====== REFS ======
  const rootRef = useRef(null);
  const probeRef = useRef(null);

  // ====== CARGA DEL PEDIDO ======
  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg('');
      try {
        const res = await fetch(`${API_BASE}/api/pedidos/${id}`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.message || 'No se pudo cargar el pedido');
        }
        const json = await res.json();

        // Esperado: { ok, data: { pedido, detalles, ... } }
        const payload = json?.data ?? json ?? {};
        const pedido = payload?.pedido ?? payload ?? {};
        const rawDetalles = Array.isArray(payload?.detalles) ? payload.detalles : [];

        // 🎯 CAMBIO QUIRÚRGICO: Filtrar detalles inválidos ANTES de guardar el estado
        const detalles = rawDetalles.filter(d => d.valido === true);

        setData({ pedido, detalles });
      } catch (e) {
        setMsg(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ====== MEDICIÓN Y ZOOM (una hoja) ======
  useLayoutEffect(() => {
    // Recalcular zoom cuando hay datos o al redimensionar
    function measure() {
      if (!rootRef.current || !probeRef.current) {
        setPrintZoom(1);
        return;
      }
      const pagePx = probeRef.current.offsetHeight; // alto util de la página en px (277mm aprox)
      const contentPx = rootRef.current.scrollHeight; // alto del contenido actual
      // margen de seguridad
      const buffer = 8; // px
      const z = Math.min(1, (pagePx - buffer) / contentPx);
      setPrintZoom(z > 0 && Number.isFinite(z) ? z : 1);
    }

    // medir tras pintar
    const t = setTimeout(measure, 0);
    // y ante resize
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, [data]);

  // ====== AUTO-PRINT ROBUSTO ======
  useEffect(() => {
    if (!didPrint && data?.pedido) {
      // esperar un frame para que el zoom se aplique
      const t = setTimeout(() => {
        window.print();
        setDidPrint(true);
      }, 350);
      return () => clearTimeout(t);
    }
  }, [data, didPrint]);

  // ====== RENDER GUARD ======
  if (msg) {
    return (
      <main className="container">
        <div className="notice">{msg}</div>
        <div className="no-print" style={{ marginTop: 12 }}>
          <Link to="/envio/fase2/embalar" className="btn">Volver</Link>
        </div>
      </main>
    );
  }

  if (loading || !data?.pedido) {
    return (
      <main className="container">
        Cargando…
      </main>
    );
  }

  // ====== NORMALIZACIONES ======
  const p = data.pedido;
  const c = p.clientes ?? p.cliente ?? {};
  const detalles = Array.isArray(data.detalles) ? data.detalles : [];

  const doc = [c.tipo_doc, c.nro_doc].filter(Boolean).join(' - ') || ' - ';
  const clienteNombre = c.nombre_completo || ' - ';
  const telefono = formatPhone(c.telefono);

  const operador = p.agencia_tipo || ' - ';
  const destino =
    p.nom_agencia_o_direccion ||
    (p.agencia_tipo === 'SHALOM' ? p.agencia_nombre : p.direccion) ||
    ' - ';
  const ubicacion = [p.dpto, p.prov, p.dist].filter(Boolean).join(' / ') || ' - ';

  const total = Number(p.total || 0);
  const abono = Number(p.abono || 0);
  const pendiente = Number(
    p.pendiente != null ? p.pendiente : (total - abono)
  );

  const fmt = (n) => 'S/' + Number(n || 0).toFixed(2);

  // ====== ESTILOS / LAYOUT ======
  const card = { border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 };
  const key = { color: '#374151', fontWeight: 700, fontSize: 15, letterSpacing: 0.2, textAlign: 'center' };
  const val = { color: '#111827', fontSize: 16, textAlign: 'center' };
  const bigVal = { color: '#111827', fontSize: 20, fontWeight: 800, textAlign: 'center' };

  return (
    <>
      {/* CSS específico para impresión */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm;
        }
        @media print {
          html, body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          #page-probe { display: none !important; }
        }
      `}</style>

      {/* Sonda de página: 277mm ~ margen útil (se oculta en print) */}
      <div
        id="page-probe"
        ref={probeRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          height: '277mm',
          width: '1px',
          overflow: 'hidden',
        }}
      />

      {/* Contenido imprimible: se ajusta con zoom calculado */}
      <main
        ref={rootRef}
        className="container"
        style={{
          maxWidth: 920,
          margin: '0 auto',
          zoom: printZoom, // evita hoja extra en blanco
        }}
      >
        {/* ============== PARTE SUPERIOR (centrada) ============== */}
        <header style={{ ...card, marginTop: 8, marginBottom: 14 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr 140px',
              alignItems: 'center',
              gap: 18,
            }}
          >
            {/* Logo izquierdo */}
            <div style={{ textAlign: 'center' }}>
              <img
                src={LOGO_URL}
                alt={`${EMPRESA} logo izquierdo`}
                style={{ maxWidth: '100%', maxHeight: 90, objectFit: 'contain' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>

            {/* Título (empresa) */}
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ margin: 0, fontSize: 50, letterSpacing: 0.6 }}>{EMPRESA}</h1>
            </div>

            {/* Logo derecho */}
            <div style={{ textAlign: 'center' }}>
              <img
                src={LOGO_URL}
                alt={`${EMPRESA} logo derecho`}
                style={{ maxWidth: '100%', maxHeight: 90, objectFit: 'contain' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          </div>
        </header>

        {/* DATOS CLIENTE (centrado, sin fecha/ni totales) */}
        <section style={{ ...card, marginBottom: 14, textAlign: 'center' }}>
          <h2 style={{ marginTop: 0, marginBottom: 14, fontSize: 20 }}>DATOS</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
            <div>
              <div style={key}>Tipo y N° de documento </div>
              <div style={{ ...bigVal, marginTop: 4 }}>
                {doc} 
              </div>
            </div>
            <div>
              <div style={key}>Nombre completo</div>
              <div style={{ ...bigVal, marginTop: 4 }}>
                {clienteNombre}
              </div>
            </div>
            <div>
              <div style={key}>Número de teléfono</div>
              <div style={{ ...bigVal, marginTop: 4 }}>{telefono}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 6 }}>
              <div>
                <div style={key}>Agencia de envio</div>
                <div style={{ ...val, fontWeight: 700, marginTop: 4 }}>{operador}</div>
              </div>
              <div>
                <div style={key}>Dep/Prov/Dis</div>
                <div style={{ ...val, marginTop: 4 }}>{ubicacion}</div>
              </div>
            </div>

            <div style={{ marginTop: 6 }}>
              <div style={key}>Nombre de agencia / Dirección</div>
              <div style={{ ...val, fontWeight: 800, marginTop: 4 }}>{destino}</div>
            </div>
          </div>
        </section>

        {/* SEPARADOR */}
        <div style={{ borderTop: '8px dashed #111827', margin: '10px 0' }} />

        {/* ============== PARTE INFERIOR (una sola hoja) ============== */}
        <section style={{ ...card }}>
          <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 20, textAlign: 'center' }}>
            Resumen del pedido · #{p.id}
          </h2>

          {/* Fila con documento / nombre (centrado) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, textAlign: 'center' }}>
            <div style={{ ...val }}>
              {doc} - {clienteNombre}
            </div>
            <div style={{ ...val }}>
              {telefono} - {destino}
            </div>
          </div>

          {/* Totales en una fila */}
          <div
            style={{
              marginTop: 10,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 10,
              textAlign: 'center',
            }}
          >
            <div>
              <div style={key}>Abonado</div>
              <div style={{ ...bigVal, marginTop: 4 }}>{fmt(abono)}</div>
            </div>
            <div>
              <div style={key}>Pendiente</div>
              <div
                style={{
                  marginTop: 4,
                  border: '3px solid #111827',
                  borderRadius: 12,
                  padding: '6px 10px',
                  fontSize: 24,
                  fontWeight: 900,
                  display: 'inline-block',
                }}
              >
                {fmt(pendiente)}
              </div>
            </div>
            <div>
              <div style={key}>Total</div>
              <div style={{ ...bigVal, marginTop: 4 }}>{fmt(total)}</div>
            </div>
          </div>

          {/* Detalle de pedido */}
          <div style={{ marginTop: 12 }}>
            <div style={{ ...key, fontSize: 16, textAlign: 'left' }}>Detalle del pedido</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Cant.</th>
                  <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Producto</th>
                  <th style={{ textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>P. Unit</th>
                  <th style={{ textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Importe</th>
                </tr>
              </thead>
              <tbody>
                {detalles.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="hint" style={{ padding: 8, textAlign: 'center' }}>Sin detalles</td>
                  </tr>
                ) : (
                  detalles.map((d) => {
                    const cantidad = Number(d.cantidad || 0);
                    const pu = Number(d.precio_unitario || 0);
                    const imp = Number(d.total_linea ?? (cantidad * pu)).toFixed(2);
                    return (
                      <tr key={d.id}>
                        <td style={{ padding: '6px 4px' }}>{cantidad}</td>
                        <td style={{ padding: '6px 4px' }}>{d.nombre_item || d.nombre || ' - '}</td>
                        <td style={{ padding: '6px 4px', textAlign: 'right' }}>{fmt(pu)}</td>
                        <td style={{ padding: '6px 4px', textAlign: 'right' }}>S/{imp}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Sellos + Clave 4 dígitos */}
          <div
            style={{
              marginTop: 14,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 240px',
              gap: 12,
              alignItems: 'stretch',
            }}
          >
            {/* Sello Envío */}
            <div
              style={{
                border: '3px dashed #111827',
                borderRadius: 12,
                padding: 18,
                minHeight: 88,
                textAlign: 'center',
                fontWeight: 900,
                letterSpacing: 0.4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ENVIO REALIZADO
            </div>

            {/* Sello Entrega */}
            <div
              style={{
                border: '3px dashed #111827',
                borderRadius: 12,
                padding: 18,
                minHeight: 88,
                textAlign: 'center',
                fontWeight: 900,
                letterSpacing: 0.4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ENTREGADO
            </div>

            {/* Clave 4 dígitos */}
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 12,
                minHeight: 110,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ ...key, fontSize: 16 }}>Clave de recojo</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 10,
                  marginTop: 10,
                }}
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      border: '3px solid #111827',
                      borderRadius: 10,
                      height: 52,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pie (ID de guía) */}
        <footer style={{ textAlign: 'center', color: '#6b7280', marginTop: 8 }}>
          Guía / Comprobante interno · #{p.id}
        </footer>

        {/* BOTONES (solo pantalla) */}
        <div className="no-print" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <Link to={`/envio/fase2/imprimir/${id}`} className="btn" onClick={() => window.print()}>
            Reimprimir
          </Link>
          <Link to="/envio/fase2/embalar" className="btn">
            Volver
          </Link>
        </div>
      </main>
    </>
  );
}
