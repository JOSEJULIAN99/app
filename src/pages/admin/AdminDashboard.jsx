// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\admin\AdminDashboard.jsx
import { useEffect, useState } from 'react';
import { API_BASE } from '../../config.js';
import { fetchWithUser } from '../../utils/user.js';

export default function AdminDashboard() {
  const [kpis, setKpis] = useState(null);
  const [tops, setTops] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr('');
      try {
        const [r1, r2] = await Promise.all([
          fetchWithUser(`${API_BASE}/api/reportes/kpis`),
          fetchWithUser(`${API_BASE}/api/reportes/tops`),
        ]);

        if (!r1.ok) {
          const e = await safeJson(r1);
          throw new Error(e?.message || 'Error en KPIs');
        }
        if (!r2.ok) {
          const e = await safeJson(r2);
          throw new Error(e?.message || 'Error en tops');
        }

        const [kpisJson, topsJson] = await Promise.all([r1.json(), r2.json()]);

        if (!alive) return;
        setKpis(kpisJson);
        setTops(topsJson);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || 'No se pudieron cargar los datos');
        setKpis(null);
        setTops(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      {/* KPIs principales */}
      <section
        className="grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}
      >
        <Kpi
          title="Ingresado (S/)"
          value={loading ? '…' : fmtSoles(kpis?.dinero_ingresado)}
        />
        <Kpi
          title="Entregados"
          value={loading ? '…' : safeNum(kpis?.pedidos_entregados)}
        />
        <Kpi
          title="Cancelados"
          value={loading ? '…' : safeNum(kpis?.pedidos_cancelados)}
        />
        <Kpi
          title="REG"
          value={loading ? '…' : safeNum(kpis?.counts_by_estado?.REGISTRADO)}
        />
        <Kpi
          title="EMB"
          value={loading ? '…' : safeNum(kpis?.counts_by_estado?.EMBALADO)}
        />
        <Kpi
          title="ENT"
          value={loading ? '…' : safeNum(kpis?.counts_by_estado?.ENTREGADO)}
        />
      </section>

      {/* Listas Top */}
      <section
        className="grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}
      >
        <CardList
          title="Top productos"
          loading={loading}
          items={(tops?.productos_mas_vendidos || []).map((x) => ({
            left: x.nombre_item,
            right: `${x.cantidad_total} uds · ${fmtSoles(x.dinero_total)}`,
          }))}
        />
        <CardList
          title="Top usuarios"
          loading={loading}
          items={(tops?.usuarios_mas_ventas || []).map((x) => ({
            left: x.usuario_crea,
            right: `${x.pedidos} ped · ${fmtSoles(x.total)}`,
          }))}
        />
        <CardList
          title="Top departamentos"
          loading={loading}
          items={(tops?.departamentos_top || []).map((x) => ({
            left: x.dpto,
            right: `${x.pedidos} envíos`,
          }))}
        />
      </section>

      {err && <div className="card notice" style={{ marginTop: 12 }}>{err}</div>}
    </>
  );
}

function Kpi({ title, value }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div className="hint" style={{ fontSize: 12 }}>
        {title}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>
        {value ?? '—'}
      </div>
    </div>
  );
}

function CardList({ title, items, loading }) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {loading ? (
        <div className="hint">Cargando…</div>
      ) : !items || items.length === 0 ? (
        <div className="hint">Sin datos</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((it, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span>{it.left}</span>
              <strong>{it.right}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// helpers
function fmtSoles(n) {
  return 'S/' + Number(n || 0).toFixed(2);
}
function safeNum(n) {
  return typeof n === 'number' ? n : '—';
}
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
