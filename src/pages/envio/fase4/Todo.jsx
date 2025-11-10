// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\envio\fase4\Todo.jsx
import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../../../config.js';

const ESTADOS = ['(Todos)','REGISTRADO','EMBALADO','ENTREGADO','CANCELADO','ELIMINADO'];
const AGENCIAS = ['(Todas)','SHALOM','OLVA','FLORES','OTRA'];

export default function Todo() {
  // Filtros
  const [estado, setEstado] = useState('(Todos)');
  const [cliente, setCliente] = useState('');
  const [agencia, setAgencia] = useState('(Todas)');
  const [dpto, setDpto] = useState('');
  const [prov, setProv] = useState('');
  const [dist, setDist] = useState('');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');

  // Datos
  const [rows, setRows] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [tops, setTops] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

async function loadKPIs() {
  try {
    const res = await fetch(`${API_BASE}/api/reportes/kpis`);
    const json = await res.json();
    setKpis(json.data || {}); // 👈 toma el contenido interno
  } catch (e) {
    console.error('Error KPI', e);
  }
}

async function loadTops() {
  try {
    const res = await fetch(`${API_BASE}/api/reportes/tops`);
    const json = await res.json();
    setTops(json.data || {}); // 👈 igual
  } catch (e) {
    console.error('Error TOPS', e);
  }
}

async function load() {
  setLoading(true);
  setMsg('');
  try {
    const qs = new URLSearchParams();
    if (estado !== '(Todos)') qs.set('estado', estado);
    if (cliente) qs.set('cliente', cliente);
    if (agencia !== '(Todas)') qs.set('agencia_tipo', agencia);
    if (dpto) qs.set('dpto', dpto);
    if (prov) qs.set('prov', prov);
    if (dist) qs.set('dist', dist);
    if (fFrom) qs.set('fecha_from', fFrom);
    if (fTo) qs.set('fecha_to', fTo);

    const res = await fetch(`${API_BASE}/api/reportes/todo?${qs.toString()}`);
    const json = await res.json();
    setRows(json.data || []);
  } catch (e) {
    setMsg('Error cargando pedidos: ' + e.message);
  } finally {
    setLoading(false);
  }
}



  useEffect(() => {
    loadKPIs();
    loadTops();
  }, []);

  function buscar() {
    load();
  }

  const totalSoles = useMemo(() => rows.reduce((a,x)=>a+Number(x.total||0),0), [rows]);
  const totalPend  = useMemo(() => rows.reduce((a,x)=>a+Number(x.pendiente||0),0), [rows]);

  return (
    <main className="container">
      <h1>Fase 4 · Todo</h1>

      {/* KPIs */}
      <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
        <KpiCard title="Ingresado (S/)" value={fmt(totalSoles)} />
        <KpiCard title="Pendiente (S/)" value={fmt(totalPend)} />
        <KpiCard title="Entregados (global)" value={kpis?.pedidos_entregados ?? '—'} />
        <KpiCard title="Cancelados (global)" value={kpis?.pedidos_cancelados ?? '—'} />
        <KpiCard title="Registrados." value={kpis?.counts_by_estado?.REGISTRADO ?? '—'} />
        <KpiCard title="Embalados." value={kpis?.counts_by_estado?.EMBALADO ?? '—'} />
        <KpiCard title="Entregados" value={kpis?.counts_by_estado?.ENTREGADO ?? '—'} />
        <KpiCard title="Cancelados" value={kpis?.counts_by_estado?.CANCELADO ?? '—'} />
      </section>

      {/* Filtros */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Filtros</h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
          <select value={estado} onChange={e=>setEstado(e.target.value)}>
            {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input placeholder="Cliente (nombre)" value={cliente} onChange={e=>setCliente(e.target.value)} />
          <select value={agencia} onChange={e=>setAgencia(e.target.value)}>
            {AGENCIAS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input placeholder="Departamento" value={dpto} onChange={e=>setDpto(e.target.value)} />
          <input placeholder="Provincia" value={prov} onChange={e=>setProv(e.target.value)} />
          <input placeholder="Distrito" value={dist} onChange={e=>setDist(e.target.value)} />
          <input type="date" value={fFrom} onChange={e=>setFFrom(e.target.value)} />
          <input type="date" value={fTo} onChange={e=>setFTo(e.target.value)} />
        </div>
        <div className="actions-row" style={{ marginTop: 8 }}>
          <button className="btn primary" onClick={buscar}>Buscar</button>
          <button className="btn" onClick={() => { setEstado('(Todos)'); setCliente(''); setAgencia('(Todas)'); setDpto(''); setProv(''); setDist(''); setFFrom(''); setFTo(''); }}>Limpiar</button>
        </div>
      </section>

      {msg && <div className="notice">{msg}</div>}

      {/* Tabla de resultados */}
      <section className="card" style={{ overflowX:'auto' }}>
        {loading ? <div>Cargando…</div> : rows.length === 0 ? (
          <div className="hint">Sin resultados. Ajusta filtros y presiona Buscar.</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign:'left' }}>#</th>
                <th style={{ textAlign:'left' }}>Fecha</th>
                <th style={{ textAlign:'left' }}>Estado</th>
                <th style={{ textAlign:'left' }}>Cliente</th>
                <th style={{ textAlign:'left' }}>Agencia/Dirección</th>
                <th style={{ textAlign:'left' }}>Ubigeo</th>
                <th>Total</th>
                <th>Abono</th>
                <th>Pendiente</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>{fmtFecha(r.creado_en)}</td>
                  <td>{r.estado}</td>
                  <td>
                    <div><strong>{r.clientes?.nombre_completo}</strong></div>
                    <div className="hint">{r.clientes?.telefono}</div>
                  </td>
                  <td>
                    <div><strong>{r.agencia_tipo}</strong></div>
                    <div className="hint">{r.agencia_tipo === 'SHALOM' ? (r.agencia_nombre || '-') : (r.direccion || '-')}</div>
                  </td>
                  <td>{r.dpto} / {r.prov} / {r.dist}</td>
                  <td style={{ textAlign:'right' }}>S/{Number(r.total).toFixed(2)}</td>
                  <td style={{ textAlign:'right' }}>S/{Number(r.abono).toFixed(2)}</td>
                  <td style={{ textAlign:'right' }}>S/{Number(r.pendiente).toFixed(2)}</td>
                  <td>{r.usuario_crea}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Tops */}
      <section className="grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))' }}>
        <CardList title="Top productos (cant.)" items={(tops?.productos_mas_vendidos||[]).map(x => ({
          left: x.nombre_item, right: `${x.cantidad_total} uds · S/${Number(x.dinero_total).toFixed(2)}`
        }))} />
        <CardList title="Top usuarios (S/)" items={(tops?.usuarios_mas_ventas||[]).map(x => ({
          left: x.usuario_crea, right: `${x.pedidos} ped · S/${Number(x.total).toFixed(2)}`
        }))} />
        <CardList title="Top departamentos" items={(tops?.departamentos_top||[]).map(x => ({
          left: x.dpto, right: `${x.pedidos} envíos`
        }))} />
      </section>
    </main>
  );
}

function KpiCard({ title, value }) {
  return (
    <div className="card" style={{ textAlign:'center' }}>
      <div className="hint" style={{ fontSize:12 }}>{title}</div>
      <div style={{ fontSize:22, fontWeight:800 }}>{value}</div>
    </div>
  );
}
function CardList({ title, items }) {
  return (
    <div className="card">
      <h3 style={{ marginTop:0 }}>{title}</h3>
      {(!items || items.length===0) ? <div className="hint">Sin datos</div> : (
        <ul style={{ listStyle:'none', padding:0, margin:0 }}>
          {items.map((it, i) => (
            <li key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
              <span>{it.left}</span>
              <strong>{it.right}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
function fmt(n){ return 'S/' + Number(n||0).toFixed(2); }
function fmtFecha(s){
  try{ return new Date(s).toLocaleString(); }catch{ return s; }
}
