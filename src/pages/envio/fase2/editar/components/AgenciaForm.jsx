// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\envio\fase2\editar\components\AgenciaForm.jsx
import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from "../../../../../config.js";

import { TIPOS, up, safeJson } from '../lib/formUtils.js';

export default function AgenciaForm({
  tipo, setTipo,
  dpto, setDpto,
  prov, setProv,
  dist, setDist,
  nombreAgencia, setNombreAgencia,
  direccion, setDireccion,
}) {
  const [distritos, setDistritos] = useState([]);
  const [agencias, setAgencias] = useState([]);
  const [catMsg, setCatMsg] = useState('');
  const [catLoading, setCatLoading] = useState(false);

  function onChangeDpto(val) { setDpto(val); setProv(''); setDist(''); }
  function onChangeProv(val) { setProv(val); setDist(''); }

  // Cargar distritos para OLVA/FLORES/OTRA
  useEffect(() => {
    if (tipo === 'SHALOM') { setDistritos([]); return; }
    let alive = true;
    const controller = new AbortController();
    setCatMsg(''); setCatLoading(true);

    const q = new URLSearchParams();
    if (dpto) q.set('dpto', up(dpto));
    if (prov) q.set('prov', up(prov));
    if (dist) q.set('dist', up(dist));
    q.set('_', String(Date.now()));

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/catalogo/peru-distritos?${q.toString()}`, {
          headers: { Accept: 'application/json', 'Cache-Control': 'no-store' },
          signal: controller.signal,
        });
        if (!res.ok) {
          const j = await safeJson(res);
          throw new Error(j?.message || `Error catálogo distritos (${res.status}).`);
        }
        const j = await safeJson(res);
        if (!alive) return;
        setDistritos(Array.isArray(j?.data) ? j.data : []);
      } catch (e) {
        if (alive && e.name !== 'AbortError') setCatMsg(e.message);
      } finally { if (alive) setCatLoading(false); }
    })();

    return () => { alive = false; controller.abort(); };
  }, [tipo, dpto, prov, dist]);

  // Cargar agencias SHALOM
  useEffect(() => {
    if (tipo !== 'SHALOM') { setAgencias([]); return; }
    let alive = true;
    const controller = new AbortController();
    setCatMsg(''); setCatLoading(true);

    const q = new URLSearchParams();
    if (dpto) q.set('dpto', up(dpto));
    if (prov) q.set('prov', up(prov));
    if (dist) q.set('dist', up(dist));
    if (nombreAgencia) q.set('nombre', up(nombreAgencia));
    q.set('_', String(Date.now()));

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/catalogo/agencias-shalom?${q.toString()}`, {
          headers: { Accept: 'application/json', 'Cache-Control': 'no-store' },
          signal: controller.signal,
        });
        if (!res.ok) {
          const j = await safeJson(res);
          throw new Error(j?.message || `Error catálogo SHALOM (${res.status}).`);
        }
        const j = await safeJson(res);
        if (!alive) return;
        setAgencias(Array.isArray(j?.data) ? j.data : []);
      } catch (e) {
        if (alive && e.name !== 'AbortError') setCatMsg(e.message);
      } finally { if (alive) setCatLoading(false); }
    })();

    return () => { alive = false; controller.abort(); };
  }, [tipo, dpto, prov, dist, nombreAgencia]);

  // Combos dependientes
  const dptos = useMemo(() => {
    const s = new Set(distritos.map(x => x.dpto)); return Array.from(s).sort();
  }, [distritos]);
  const provs = useMemo(() => {
    const s = new Set(distritos.filter(x => !dpto || x.dpto === dpto).map(x => x.prov));
    return Array.from(s).sort();
  }, [distritos, dpto]);
  const dists = useMemo(() => {
    const s = new Set(distritos.filter(x => (!dpto || x.dpto === dpto) && (!prov || x.prov === prov)).map(x => x.dist));
    return Array.from(s).sort();
  }, [distritos, dpto, prov]);

  return (
    <section className="card form">
      <h2 style={{ marginTop: 0 }}>2) Destino / agencia</h2>

      <label>Operador de envío</label>
      <div className="segmented" style={{ marginBottom: 8 }}>
        {TIPOS.map((t) => (
          <button
            key={t}
            className={`segmented-item ${tipo === t ? 'active' : ''}`}
            onClick={() => {
              setTipo(t);
              if (t === 'SHALOM') setDireccion('');
              else setNombreAgencia('');
              setCatMsg('');
            }}
            type="button"
          >
            {t}
          </button>
        ))}
      </div>

      {tipo === 'SHALOM' ? (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <input placeholder="Departamento" value={dpto} onChange={e => onChangeDpto(e.target.value)} />
            <input placeholder="Provincia"    value={prov} onChange={e => onChangeProv(e.target.value)} />
            <input placeholder="Distrito"     value={dist} onChange={e => setDist(e.target.value)} />
            <input placeholder="Nombre agencia" value={nombreAgencia} onChange={e => setNombreAgencia(e.target.value)} />
          </div>

          <div className="card" style={{ maxHeight: 260, overflow: 'auto', marginTop: 8 }}>
            {catLoading && <div className="hint">Cargando agencias…</div>}
            {!catLoading && agencias.length === 0 && (<div className="hint">No hay resultados. Ajuste filtros.</div>)}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {agencias.map(a => (
                <li
                  key={a.id}
                  onClick={() => {
                    setNombreAgencia(a.nombre_agencia || '');
                    setDpto(a.dpto || '');
                    setProv(a.prov || '');
                    setDist(a.dist || '');
                    if (a.direccion) setDireccion(a.direccion);
                  }}
                  style={{ cursor: 'pointer', padding: 8, borderBottom: '1px solid var(--border)' }}
                >
                  <strong>{a.nombre_agencia}</strong>
                  <div className="hint">{a.dpto} / {a.prov} / {a.dist}</div>
                  {a.direccion && <div className="hint">{a.direccion}</div>}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <select value={dpto} onChange={e => onChangeDpto(e.target.value)}>
              <option value="">Departamento</option>
              {dptos.map(x => (<option key={x} value={x}>{x}</option>))}
            </select>
            <select value={prov} onChange={e => onChangeProv(e.target.value)} disabled={!dpto}>
              <option value="">Provincia</option>
              {provs.map(x => (<option key={x} value={x}>{x}</option>))}
            </select>
            <select value={dist} onChange={e => setDist(e.target.value)} disabled={!prov}>
              <option value="">Distrito</option>
              {dists.map(x => (<option key={x} value={x}>{x}</option>))}
            </select>
          </div>

          <label style={{ marginTop: 8 }}>Dirección</label>
          <input value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Calle, número, referencia" />

          {tipo === 'OTRA' && (
            <>
              <label style={{ marginTop: 8 }}>Nombre de la agencia</label>
              <input value={nombreAgencia} onChange={e => setNombreAgencia(e.target.value)} placeholder="Nombre de la agencia" />
            </>
          )}
        </>
      )}

      {catMsg && <div className="notice" style={{ marginTop: 8 }}>{catMsg}</div>}
    </section>
  );
}
