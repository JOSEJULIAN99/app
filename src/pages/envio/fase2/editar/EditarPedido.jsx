// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\envio\fase2\editar\EditarPedido.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE } from '../../../../config.js';
import {
  TIPOS, DOCS,
  isDNI, isCE, isPhone, up, identityHeaders, safeJson,
  toItemRow, formatPhone
} from './lib/formUtils.js';

import ClienteForm from './components/ClienteForm.jsx';
import AgenciaForm from './components/AgenciaForm.jsx';
import PedidoItems from './components/PedidoItems.jsx';
import AbonoForm from './components/AbonoForm.jsx';
import Confirmacion from './components/Confirmacion.jsx';

export default function EditarPedido() {
  const { id } = useParams();
  const navigate = useNavigate();

  // base
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // cliente
  const [docTipo, setDocTipo] = useState('DNI');
  const [docNro, setDocNro]   = useState('');
  const [cliNombre, setCliNombre] = useState('');
  const [cliTel, setCliTel] = useState('+51');
  const [lookupLoading, setLookupLoading] = useState(false);
  const prevDocRef = useRef('');

  // agencia
  const [tipo, setTipo] = useState('SHALOM');
  const [dpto, setDpto] = useState('');
  const [prov, setProv] = useState('');
  const [dist, setDist] = useState('');
  const [nombreAgencia, setNombreAgencia] = useState('');
  const [direccion, setDireccion] = useState('');

  // pedido + abono
  const [items, setItems] = useState([]);
  const [descTipo, setDescTipo] = useState('monto');
  const [descValor, setDescValor] = useState(0);
  const [abono, setAbono] = useState(0);

  // motivo
  const [motivo, setMotivo] = useState('');

  const docHint = useMemo(() => {
    if (docTipo === 'DNI') return 'Exactamente 8 dígitos.';
    if (docTipo === 'CE')  return 'Hasta 12 caracteres alfanuméricos.';
    return 'Libre.';
  }, [docTipo]);

  // cargar pedido
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setMsg('');
      try {
        const res = await fetch(`${API_BASE}/api/pedidos/${id}`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (!res.ok) {
          const j = await safeJson(res);
          throw new Error(j?.message || `No se pudo cargar el pedido (${res.status}).`);
        }
        const json = await safeJson(res);
        const payload = json?.data ?? json ?? {};
        const p = payload?.pedido ?? payload ?? {};
        const c = p.clientes ?? p.cliente ?? {};

        // Cliente
        setDocTipo(c.tipo_doc || 'DNI');
        setDocNro(c.nro_doc || '');
        setCliNombre(c.nombre_completo || '');
        setCliTel(c.telefono || '+51');
        prevDocRef.current = c.nro_doc || '';

        // Agencia (normaliza OTRA si agencia_tipo no está en TIPOS)
        const rawTipo = up(p.agencia_tipo || 'SHALOM');
        const known = new Set(TIPOS);
        const isOtraNombre = !known.has(rawTipo);
        const at = isOtraNombre ? 'OTRA' : rawTipo;

        setTipo(at);
        setDpto(p.dpto || '');
        setProv(p.prov || '');
        setDist(p.dist || '');

        const nom = p.nom_agencia_o_direccion || '';
        if (at === 'SHALOM') {
          setNombreAgencia(nom || '');
          setDireccion('');
        } else if (at === 'OTRA') {
          const otraNombre = isOtraNombre ? (p.agencia_tipo || '') : '';
          setNombreAgencia(otraNombre);
          setDireccion(nom || '');
        } else {
          setNombreAgencia('');
          setDireccion(nom || '');
        }

        const rawDetalles = payload?.detalles || json?.detalles || json?.items || json?.detalle;
        
        // 🎯 SISTEMA DE IDENTIFICACIÓN DE PROBLEMAS
        const detallesValidos = Array.isArray(rawDetalles)
            ? rawDetalles.filter(d => {
                const id_item = d.id ?? d.producto_id ?? d.nombre_item;
                const valor_valido = d.valido;
                const tipo_dato = typeof valor_valido;
                
                // 1. Log detallado de cada ítem
                console.log(`[DEBUG ITEM] ID: ${id_item} | VALIDO: ${valor_valido} | TIPO: ${tipo_dato}`);

                // 2. Filtro de Inclusión Estricta (solo pasa si es explícitamente true)
                // Esta es la prueba: si no pasa, sabemos que el valor de 'valido' está mal.
                if (valor_valido === true) return true;

                // 3. Log de exclusión (Esto te dirá por qué el ítem fue excluido de esta prueba)
                console.warn(`[EXCLUIDO POR TIPO DE DATO] Ítem ${id_item} (Tipo: ${tipo_dato})`);

                // 4. Si no es 'true', lo excluimos de la vista
                return false; 
              })
            : [];
            
        setItems(detallesValidos.map(toItemRow));
        // Descuento: backend devuelve 'descuento' como monto
        const dMonto = Number(p.descuento ?? 0);
        setDescTipo('monto');
        setDescValor(Number.isFinite(dMonto) ? dMonto : 0);

        // Abono
        setAbono(Number(p.abono ?? 0));
      } catch (e) {
        if (alive) setMsg(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; controller.abort(); };
  }, [id]);

  // si cambia nro doc, limpiar nombre/teléfono
  useEffect(() => {
    const prev = String(prevDocRef.current || '').trim();
    const curr = String(docNro || '').trim();
    if (prev !== curr) {
      setCliNombre('');
      setCliTel('+51');
      setMsg('');
      prevDocRef.current = curr;
    }
  }, [docNro]);

  // BD/RENIEC
  async function buscarAuto() {
    setMsg('');
    const doc = (docNro || '').trim();
    if (!doc) { setMsg('Ingrese número de documento antes de buscar.'); return; }

    setLookupLoading(true);
    try {
      // 1) BD
      const qs = new URLSearchParams({ tipo_doc: docTipo, nro_doc: doc });
      const urlBD = `${API_BASE}/api/clientes/search?${qs.toString()}`;
      const resBD = await fetch(urlBD, { headers: { Accept: 'application/json' } });

      if (resBD.ok) {
        const json = await resBD.json();
        const row = json?.data ?? json;
        if (row?.nombre_completo) setCliNombre(row.nombre_completo);
        if (row?.telefono) setCliTel(row.telefono);
        setMsg('Cliente encontrado en BD.');
        return;
      }

      // 2) RENIEC si DNI
      if (resBD.status === 404 && docTipo === 'DNI') {
        if (!isDNI(doc)) { setMsg('El DNI debe tener exactamente 8 dígitos.'); return; }
        const urlReniec = `${API_BASE}/api/reniec/dni?numero=${encodeURIComponent(doc)}`;
        const resReniec = await fetch(urlReniec, { headers: { Accept: 'application/json' } });

        if (resReniec.ok) {
          const jr = await resReniec.json();
          const fullName = jr?.full_name || jr?.data?.full_name || '';
          if (fullName) { setCliNombre(fullName); setMsg('RENIEC: nombre completado.'); }
          else { setMsg('RENIEC no devolvió nombre. Escriba manualmente.'); }
        } else if (resReniec.status === 404) {
          setMsg('DNI no encontrado en RENIEC. Ingrese datos manualmente.');
        } else {
          const e = await resReniec.json().catch(() => ({}));
          setMsg(e?.message || 'Error consultando RENIEC.');
        }
        return;
      }

      const errBD = await resBD.json().catch(() => ({}));
      setMsg(errBD?.message || 'Error buscando en BD.');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLookupLoading(false);
    }
  }

  // totales
  const subTotal = useMemo(() => {
    const s = items.reduce((acc, it) => {
      const q = Number(it.cantidad), pu = Number(it.precio_unitario);
      if (!Number.isFinite(q) || !Number.isFinite(pu)) return acc;
      return acc + (q * pu);
    }, 0);
    return Number.isFinite(s) ? s : 0;
  }, [items]);

  const descAplicado = useMemo(() => {
    const v = Number(descValor);
    if (!Number.isFinite(v) || v <= 0) return 0;
    if (descTipo === 'porc') {
      const pct = Math.min(Math.max(v, 0), 100);
      return subTotal * (pct / 100);
    }
    return Math.min(v, subTotal);
  }, [descTipo, descValor, subTotal]);

  const total = useMemo(() => Math.max(subTotal - descAplicado, 0), [subTotal, descAplicado]);
  const pendiente = useMemo(() => Math.max(total - Number(abono || 0), 0), [total, abono]);

  // helpers items
  function setItemAt(idx, patch) { setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it)); }
  function removeItem(idx) { setItems(prev => prev.filter((_, i) => i !== idx)); }
  function addManual() { setItems(prev => [...prev, { id: null, nombre: 'Producto', cantidad: 1, precio_unitario: 0, es_manual: true }]); }

  // validación detallada
  function firstValidationError() {
    const doc = (docNro || '').trim();
    const tel = (cliTel || '').trim();

    if (docTipo === 'DNI' && !isDNI(doc)) return 'El DNI debe tener exactamente 8 dígitos.';
    if (docTipo === 'CE'  && !isCE(doc))  return 'El CE debe tener hasta 12 caracteres alfanuméricos.';
    if (!cliNombre.trim()) return 'Falta el nombre completo del cliente.';
    if (!isPhone(tel)) return 'El teléfono debe estar en formato internacional, ej: +51912345678.';

    const at = up(tipo);
    if (!dpto || !prov || !dist) return 'Seleccione departamento, provincia y distrito.';
    if (at === 'SHALOM' && !nombreAgencia.trim()) return 'Falta el nombre de la agencia SHALOM.';
    if ((at === 'OLVA' || at === 'FLORES') && !direccion.trim()) return 'Falta la dirección para OLVA/FLORES.';
    if (at === 'OTRA') {
      if (!nombreAgencia.trim()) return 'Falta el nombre de la agencia (OTRA).';
      if (!direccion.trim()) return 'Falta la dirección (OTRA).';
    }

    if (!items.length) return 'Agregue al menos un ítem al pedido.';
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!String(it.nombre || '').trim()) return `Ítem #${i + 1}: falta nombre.`;
      const q = Number(it.cantidad); if (!Number.isFinite(q) || q <= 0) return `Ítem #${i + 1}: cantidad inválida.`;
      const pu = Number(it.precio_unitario); if (!Number.isFinite(pu) || pu < 0) return `Ítem #${i + 1}: precio inválido.`;
    }

    const s = items.reduce((acc, it) => acc + Number(it.cantidad) * Number(it.precio_unitario), 0);
    const d = descTipo === 'porc'
      ? Math.min(100, Math.max(0, Number(descValor || 0))) * s / 100
      : Math.min(s, Math.max(0, Number(descValor || 0)));
    const tot = Number((s - d).toFixed(2));
    const a = Number(abono);
    if (!Number.isFinite(a) || a < 0) return 'Abono inválido.';
    if (a > tot) return `El abono (S/${a.toFixed(2)}) no puede ser mayor que el total (S/${tot.toFixed(2)}).`;

    if (!motivo.trim()) return 'Falta el motivo de la modificación.';
    return null;
  }

  async function guardar() {
    setMsg('');
    const err = firstValidationError();
    if (err) { setMsg(err); return; }

    setSaving(true);
    try {
      const at = up(tipo);
      const body = {
        motivo: motivo.trim(),
        cliente: {
          tipo_doc: docTipo,
          nro_doc: (docNro || '').trim(),
          nombre_completo: cliNombre.trim(),
          telefono: (cliTel || '').trim(),
        },
        agencia: {
          agencia_tipo: at,
          dpto: up(dpto), prov: up(prov), dist: up(dist),
          ...(at === 'SHALOM' && { agencia_nombre: nombreAgencia.trim(), direccion: null }),
          ...(at === 'OTRA'   && { agencia_nombre: nombreAgencia.trim(), direccion: (direccion.trim() || null) }),
          ...((at === 'OLVA' || at === 'FLORES') && { direccion: (direccion.trim() || null) }),
        },
        pedido: {
          items: items.map(it => ({
            id: it.id ?? null,
            nombre: String(it.nombre || '').trim(),
            cantidad: Number(it.cantidad),
            precio_unitario: Number(it.precio_unitario),
            es_manual: !!it.es_manual,
          })),
          descuento: {
            // Tu backend hoy guarda 'descuento' (monto). Enviamos tipo/valor por consistencia.
            tipo: descTipo, // 'monto' | 'porc'
            valor: Number(descValor) || 0,
          },
        },
        abono: Number(abono) || 0,
      };

      const res = await fetch(`${API_BASE}/api/pedidos/${id}`, {
        method: 'PATCH',
        headers: identityHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await safeJson(res);
        throw new Error(j?.message || 'No se pudo guardar los cambios.');
        }
      navigate('/envio/fase2/embalar');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  const fmtS = (n) => Number.isFinite(n) ? `S/${n.toFixed(2)}` : '—';

  return (
    <main className="container">
      <h1>Editar pedido #{id}</h1>
      {msg && <div className="notice">{msg}</div>}
      {loading && <div className="hint">Cargando…</div>}

      {!loading && (
        <>
          <ClienteForm
            docTipo={docTipo} setDocTipo={setDocTipo}
            docNro={docNro} setDocNro={setDocNro}
            cliNombre={cliNombre} setCliNombre={setCliNombre}
            cliTel={cliTel} setCliTel={setCliTel}
            docHint={docHint}
            lookupLoading={lookupLoading}
            onBuscar={buscarAuto}
          />

          <AgenciaForm
            tipo={tipo} setTipo={setTipo}
            dpto={dpto} setDpto={setDpto}
            prov={prov} setProv={setProv}
            dist={dist} setDist={setDist}
            nombreAgencia={nombreAgencia} setNombreAgencia={setNombreAgencia}
            direccion={direccion} setDireccion={setDireccion}
          />

          <PedidoItems
            items={items} setItems={setItems}
            setItemAt={setItemAt} removeItem={removeItem} addManual={addManual}
            subTotal={subTotal}
            descTipo={descTipo} setDescTipo={setDescTipo}
            descValor={descValor} setDescValor={setDescValor}
            descAplicado={descAplicado} total={total}
            fmtS={fmtS}
          />

          <AbonoForm abono={abono} setAbono={setAbono} pendiente={pendiente} fmtS={fmtS} />

          <Confirmacion
            motivo={motivo} setMotivo={setMotivo}
            canSave={true} saving={saving}
            onGuardar={guardar}
          />
        </>
      )}
    </main>
  );
}
