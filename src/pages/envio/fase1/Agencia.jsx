  // C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\envio\fase1\Agencia.jsx
  import { useEffect, useMemo, useState } from 'react';
  import { API_BASE } from '../../../config.js';
  import { KEYS, loadLocal, saveLocal } from '../../../utils/storage.js';
  import { Link, useNavigate } from 'react-router-dom';

  const TIPOS = ['SHALOM', 'OLVA', 'FLORES', 'OTRA'];
  
  export default function Agencia() {
    const navigate = useNavigate();

    // 1) si no hay cliente en fase 1, redirigir
    useEffect(() => {
      const cli = loadLocal(KEYS.FASE1_CLIENTE, null);
      if (!cli) navigate('/envio/fase1/cliente', { replace: true });
    }, [navigate]);

    // 2) estado base (desde localStorage)
    const initial = loadLocal(KEYS.FASE1_AGENCIA, {
      agencia_tipo: 'SHALOM',
      dpto: '',
      prov: '',
      dist: '',
      nombre_agencia: '',
      direccion: '',
    });

    const [tipo, setTipo] = useState(initial.agencia_tipo);
    const [dpto, setDpto] = useState(initial.dpto);
    const [prov, setProv] = useState(initial.prov);
    const [dist, setDist] = useState(initial.dist); // OJO: dist (no "distrito")
    const [nombreAgencia, setNombreAgencia] = useState(initial.nombre_agencia);
    const [direccion, setDireccion] = useState(initial.direccion);

    // catálogos
    
    const [agencias, setAgencias] = useState([]);
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [dptosList, setDptosList] = useState([]);
  const [provsList, setProvsList] = useState([]);
  const [distsList, setDistsList] = useState([]);
  const [loadingDpto, setLoadingDpto] = useState(false);
  const [loadingProv, setLoadingProv] = useState(false);
  const [loadingDist, setLoadingDist] = useState(false);
    // 3) guardar SIEMPRE en local
    useEffect(() => {
      saveLocal(KEYS.FASE1_AGENCIA, {
        agencia_tipo: tipo,
        dpto,
        prov,
        dist,
        nombre_agencia: nombreAgencia,
        direccion,
      });
    }, [tipo, dpto, prov, dist, nombreAgencia, direccion]);

    // 4) cargar catálogo según tipo (con debounce + AbortController)
    useEffect(() => {
      // Este efecto SÓLO se activa para SHALOM
    if (tipo !== 'SHALOM') {
      setAgencias([]);
      return;
    }
      let alive = true;
      const controller = new AbortController();
      setMsg('');
      setLoading(true);

      const timer = setTimeout(async () => {
        try {
          if (!API_BASE) throw new Error('Config API_BASE está vacío.');

          const cacheBuster = `_=${Date.now()}`;

          if (tipo === 'SHALOM') {
            const qs = new URLSearchParams();
            if (dpto) qs.set('dpto', String(dpto).toUpperCase());
            if (prov) qs.set('prov', String(prov).toUpperCase());
            if (dist) qs.set('dist', String(dist).toUpperCase());
            if (nombreAgencia) qs.set('nombre', String(nombreAgencia).toUpperCase());
            qs.set('_', cacheBuster);

            const res = await fetch(
              `${API_BASE}/api/catalogo/agencias-shalom?${qs.toString()}`,
              {
                headers: { Accept: 'application/json', 'Cache-Control': 'no-store' },
                signal: controller.signal,
              },
            );

            if (!alive) return;
            if (!res.ok) {
              const j = await res.json().catch(() => ({}));
              throw new Error(j?.message || `Error catálogo SHALOM (${res.status})`);
            }

            const json = await res.json();
            const list = Array.isArray(json?.data) ? json.data : [];
            setAgencias(list);
            
          }
        } catch (e) {
          if (alive && e.name !== 'AbortError') setMsg(e.message);
        } finally {
          if (alive) setLoading(false);
        }
      }, 280);

      return () => {
        alive = false;
        controller.abort();
        clearTimeout(timer);
      };
    }, [tipo, dpto, prov, dist, nombreAgencia]);

    // 5) combos para OLVA/FLORES/OTRA
    // Cargar Departamentos (cuando 'tipo' NO es SHALOM)
  useEffect(() => {
    if (tipo === 'SHALOM') {
      setDptosList([]); // Limpiar si es Shalom
      return;
    }

    let alive = true;
    setLoadingDpto(true);
    setMsg('');

    (async () => {
      try {
        if (!API_BASE) throw new Error('Config API_BASE está vacío.');
        const res = await fetch(`${API_BASE}/api/catalogo/peru-dptos`);
        if (!alive) return;
        if (!res.ok) throw new Error('Error cargando departamentos');
        const json = await res.json();
        setDptosList(Array.isArray(json?.data) ? json.data : []);
      } catch (e) {
        if (alive) setMsg(e.message);
      } finally {
        if (alive) setLoadingDpto(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [tipo]); // Se activa al cambiar a/desde Shalom

  // Cargar Provincias (cuando 'dpto' cambia)
  useEffect(() => {
    if (tipo === 'SHALOM' || !dpto) {
      setProvsList([]); // Limpiar si no hay dpto
      return;
    }

    let alive = true;
    setLoadingProv(true);
    setMsg('');

    (async () => {
      try {
        if (!API_BASE) throw new Error('Config API_BASE está vacío.');
        const qs = new URLSearchParams({ dpto: dpto });
        const res = await fetch(`${API_BASE}/api/catalogo/peru-provs?${qs.toString()}`);
        if (!alive) return;
        if (!res.ok) throw new Error('Error cargando provincias');
        const json = await res.json();
        setProvsList(Array.isArray(json?.data) ? json.data : []);
      } catch (e) {
        if (alive) setMsg(e.message);
      } finally {
        if (alive) setLoadingProv(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [tipo, dpto]); // Se activa al cambiar dpto

  // Cargar Distritos (cuando 'prov' cambia)
  useEffect(() => {
    if (tipo === 'SHALOM' || !dpto || !prov) {
      setDistsList([]); // Limpiar si no hay dpto o prov
      return;
    }

    let alive = true;
    setLoadingDist(true);
    setMsg('');

    (async () => {
      try {
        if (!API_BASE) throw new Error('Config API_BASE está vacío.');
        const qs = new URLSearchParams({ dpto: dpto, prov: prov });
        const res = await fetch(`${API_BASE}/api/catalogo/peru-dists?${qs.toString()}`);
        if (!alive) return;
        if (!res.ok) throw new Error('Error cargando distritos');
        const json = await res.json();
        setDistsList(Array.isArray(json?.data) ? json.data : []);
      } catch (e) {
        if (alive) setMsg(e.message);
      } finally {
        if (alive) setLoadingDist(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [tipo, dpto, prov]); // Se activa al cambiar dpto o prov

    // resets coherentes en cascada
    function onChangeDpto(val) {
    setDpto(val);
    setProv(''); // cambiar dpto -> limpiar prov
    setDist(''); // y dist
  }
    function onChangeProv(val) {
    setProv(val);
    setDist(''); // cambiar prov -> limpiar dist
  }

    // 6) continuar
    function continuar() {
      setMsg('');
      if (tipo === 'SHALOM') {
        if (!nombreAgencia?.trim()) {
          setMsg('Seleccione/filtre el nombre de la agencia Shalom.');
          return;
        }
      } else {
        if (!dpto || !prov || !dist) {
          setMsg('Complete Departamento / Provincia / Distrito.');
          return;
        }
        if (!direccion.trim()) {
          setMsg('Ingrese la dirección de destino.');
          return;
        }
        if (tipo === 'OTRA' && !nombreAgencia.trim()) {
          setMsg('Ingrese el nombre de la agencia (OTRA).');
          return;
        }
      }
      navigate('/envio/fase1/pedido');
    }

    return (
      <main className="container">
        <h1>Fase 1 · Agencia</h1>

        <div className="card form">
          <label>Operador de envío</label>
          <div className="segmented">
            {TIPOS.map((t) => (
              <button
                key={t}
                className={`segmented-item ${tipo === t ? 'active' : ''}`}
                onClick={() => {
                  setTipo(t);
                  // reseteo suave al cambiar tipo
                  if (t === 'SHALOM') {
                    setDireccion('');
                  } else {
                    setNombreAgencia('');
                  }
                  setMsg('');
                }}
                type="button"
              >
                {t}
              </button>
            ))}
          </div>

          {tipo === 'SHALOM' ? (
            <>
              {/* filtros responsivos */}
              <div
                className="grid"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}
              >
                <input
                  placeholder="Departamento"
                  value={dpto}
                  onChange={(e) => onChangeDpto(e.target.value)}
                />
                <input
                  placeholder="Provincia"
                  value={prov}
                  onChange={(e) => onChangeProv(e.target.value)}
                />
                <input
                  placeholder="Distrito"
                  value={dist}
                  onChange={(e) => setDist(e.target.value)}
                />
                <input
                  placeholder="Nombre agencia"
                  value={nombreAgencia}
                  onChange={(e) => setNombreAgencia(e.target.value)}
                />
              </div>

              {/* lista de agencias */}
              <div className="card" style={{ maxHeight: 260, overflow: 'auto' }}>
                {loading && <div className="hint">Cargando agencias…</div>}
                {!loading && agencias.length === 0 && (
                  <div className="hint">No hay resultados. Ajuste filtros.</div>
                )}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {agencias.map((a) => (
                    <li
                      key={a.id}
                      onClick={() => {
                        // al seleccionar, rellenamos TODO
                        setNombreAgencia(a.nombre_agencia || '');
                        setDpto(a.dpto || '');
                        setProv(a.prov || '');
                        setDist(a.dist || '');
                        if (a.direccion) setDireccion(a.direccion);
                      }}
                      style={{
                        cursor: 'pointer',
                        padding: 8,
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <strong>{a.nombre_agencia}</strong>
                      <div>
                        {a.dpto} / {a.prov} / {a.dist}
                      </div>
                      {a.direccion && <div className="hint">{a.direccion}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* dpto / prov / dist responsivo */}
              <div
                className="grid"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}
              >
                <select value={dpto} onChange={(e) => onChangeDpto(e.target.value)}>
                  <option value="">Departamento</option>
                  {dptosList.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
                <select
              value={prov}
              onChange={(e) => onChangeProv(e.target.value)}
              disabled={!dpto || loadingProv}
            >
              <option value="">
                {loadingProv ? 'Cargando...' : 'Provincia'}
              </option>
              {provsList.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
                <select
              value={dist}
              onChange={(e) => setDist(e.target.value)}
              disabled={!prov || loadingDist}
            >
              <option value="">
                {loadingDist ? 'Cargando...' : 'Distrito'}
              </option>
              {distsList.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
              </div>

              <label>Dirección (manual)</label>
              <input
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle, número, referencia"
              />

              {tipo === 'OTRA' && (
                <>
                  <label>Nombre de la agencia</label>
                  <input
                    value={nombreAgencia}
                    onChange={(e) => setNombreAgencia(e.target.value)}
                    placeholder="Nombre de la agencia"
                  />
                </>
              )}
            </>
          )}

          {msg && <div className="notice">{msg}</div>}

          <div className="actions-row">
            <Link to="/envio/fase1/cliente" className="btn">
              Atrás
            </Link>
            <button className="btn primary" onClick={continuar}>
              Continuar
            </button>
          </div>
        </div>
      </main>
    );
  }
