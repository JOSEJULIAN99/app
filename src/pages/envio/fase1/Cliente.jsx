// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\envio\fase1\Cliente.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../../config.js';
import { KEYS, loadLocal, saveLocal } from '../../../utils/storage.js';

// Validadores básicos
const isDNI = (doc) => /^\d{8}$/.test(doc);
const isCE = (doc) => /^[a-zA-Z0-9]{1,12}$/.test(doc);
// Teléfono internacional: +########## (10–15 dígitos)
const isPhone = (tel) => /^\+\d{10,15}$/.test(tel);

const DOCS = ['DNI', 'CE', 'OTRO'];

export default function Cliente() {
  const navigate = useNavigate();

  // 2) ESTADO BASE (desde localStorage) - Igual que en Agencia.jsx
  const initial = loadLocal(KEYS.FASE1_CLIENTE, {
    tipo_doc: 'DNI',
    nro_doc: '',
    nombre: '',
    telefono: '+51',
  });

  // Estado del formulario
  const [tipoDoc, setTipoDoc] = useState(initial.tipo_doc);
  const [nroDoc, setNroDoc] = useState(initial.nro_doc);
  const [nombre, setNombre] = useState(initial.nombre);
  const [telefono, setTelefono] = useState(initial.telefono);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Para detectar cambios reales del número de documento
  // ¡IMPORTANTE! Inicializa el ref con el valor cargado.
  const prevDocRef = useRef(initial.nro_doc);

  // CARGA INICIAL (sólo Fase 1; sin “regreso de Fase 2”)
  useEffect(() => {
    // Ya no es necesario cargar aquí
    // El 'useEffect' de carga inicial se elimina
  }, []);

  // Guardar en local cada cambio
  useEffect(() => {
    saveLocal(KEYS.FASE1_CLIENTE, {
      tipo_doc: tipoDoc,
      nro_doc: nroDoc,
      nombre,
      telefono,
    });
  }, [tipoDoc, nroDoc, nombre, telefono]);

  // Si cambia el número de doc (aunque no sea por onChange), limpiar nombre/teléfono
  useEffect(() => {
    const prev = String(prevDocRef.current || '').trim();
    const curr = String(nroDoc || '').trim();
    if (prev !== curr) {
      setNombre('');
      setTelefono('+51');
      setMsg('');
      prevDocRef.current = curr;
    }
  }, [nroDoc]);

  // onChange del número: limpia inmediatamente
  function onChangeNroDoc(e) {
    const v = e.target.value;
    setNroDoc(v);
    setNombre('');
    setTelefono('+51');
    setMsg('');
  }

  const docHint = useMemo(() => {
    if (tipoDoc === 'DNI') return 'Exactamente 8 dígitos.';
    if (tipoDoc === 'CE') return 'Hasta 12 caracteres alfanuméricos.';
    return 'Escribe el número sin restricción estricta.';
  }, [tipoDoc]);

  // Buscar (BD primero; si no existe y es DNI -> RENIEC)
  async function buscarAuto() {
    setMsg('');
    const doc = (nroDoc || '').trim();

    if (!doc) {
      setMsg('Ingrese número de documento antes de buscar.');
      return;
    }

    setLoading(true);
    try {
      // 1) Buscar en BD
      const qs = new URLSearchParams({ tipo_doc: tipoDoc, nro_doc: doc });
      const urlBD = `${API_BASE}/api/clientes/search?${qs.toString()}`;
      const resBD = await fetch(urlBD, { headers: { Accept: 'application/json' } });

      if (resBD.ok) {
        const json = await resBD.json();
        const row = json?.data ?? json;
        if (row?.nombre_completo) setNombre(row.nombre_completo);
        if (row?.telefono) setTelefono(row.telefono);
        setMsg('Cliente encontrado en BD.');
        return;
      }

      // 2) Si 404 y es DNI, intentar RENIEC
      if (resBD.status === 404) {
        if (tipoDoc === 'DNI') {
          if (!isDNI(doc)) {
            setMsg('El DNI debe tener exactamente 8 dígitos.');
            return;
          }
          const urlReniec = `${API_BASE}/api/reniec/dni?numero=${encodeURIComponent(doc)}`;
          const resReniec = await fetch(urlReniec, { headers: { Accept: 'application/json' } });

          if (resReniec.ok) {
            const jr = await resReniec.json();
            const fullName = jr?.full_name || jr?.data?.full_name || '';
            if (fullName) {
              setNombre(fullName);
              setMsg('RENIEC: nombre completado correctamente.');
            } else {
              setMsg('RENIEC no devolvió nombre. Escriba manualmente.');
            }
          } else if (resReniec.status === 404) {
            setMsg('DNI no encontrado en RENIEC. Ingrese datos manualmente.');
          } else {
            const e = await resReniec.json().catch(() => ({}));
            setMsg(e?.message || 'Error consultando RENIEC.');
          }
        } else {
          setMsg('Cliente no existe en BD. Ingrese datos manualmente.');
        }
        return;
      }

      const errBD = await resBD.json().catch(() => ({}));
      setMsg(errBD?.message || 'Error buscando en BD.');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Continuar -> valida y registra/actualiza en backend
  async function continuar() {
    const doc = (nroDoc || '').trim();
    const tel = (telefono || '').trim();

    // Validaciones
    if (tipoDoc === 'DNI' && !isDNI(doc)) {
      setMsg('El DNI debe tener exactamente 8 dígitos.');
      return;
    }
    if (tipoDoc === 'CE' && !isCE(doc)) {
      setMsg('El CE debe tener hasta 12 caracteres alfanuméricos.');
      return;
    }
    if (!(nombre || '').trim()) {
      setMsg('Ingrese el nombre del cliente.');
      return;
    }
    if (!isPhone(tel)) {
      setMsg('Teléfono inválido. Use formato internacional, ej: +51912345678');
      return;
    }

    // Persistimos en local normalizado
    saveLocal(KEYS.FASE1_CLIENTE, {
      tipo_doc: tipoDoc,
      nro_doc: doc,
      nombre: nombre.trim(),
      telefono: tel,
    });

    setSaving(true);
    setMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          tipo_doc: tipoDoc,
          nro_doc: doc,
          nombre_completo: nombre.trim(),
          telefono: tel || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMsg(err?.message || 'No se pudo registrar el cliente en la BD.');
        return;
      }

      navigate('/envio/fase1/agencia');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  function limpiar() {
    setTipoDoc('DNI');
    setNroDoc('');
    setNombre('');
    setTelefono('+51');
    setMsg('Formulario reiniciado.');
    prevDocRef.current = '';
    saveLocal(KEYS.FASE1_CLIENTE, {
      tipo_doc: 'DNI',
      nro_doc: '',
      nombre: '',
      telefono: '+51',
    });
  }

  return (
    <main className="container narrow">
      <h1>Fase 1 · Cliente</h1>

      <div className="card form">
        <label>Tipo de documento</label>
        <div className="segmented">
          {DOCS.map((d) => (
            <button
              key={d}
              className={`segmented-item ${tipoDoc === d ? 'active' : ''}`}
              onClick={() => {
                setTipoDoc(d);
                setNroDoc('');
                setNombre('');
                setTelefono('+51');
                setMsg('');
                prevDocRef.current = '';
              }}
              type="button"
            >
              {d}
            </button>
          ))}
        </div>

        <label>
          Número de documento <span className="hint">({docHint})</span>
        </label>
        <input
          inputMode={tipoDoc === 'DNI' ? 'numeric' : 'text'}
          maxLength={tipoDoc === 'DNI' ? 8 : 12}
          value={nroDoc}
          onChange={onChangeNroDoc}
          placeholder={
            tipoDoc === 'DNI'
              ? '00000000'
              : tipoDoc === 'CE'
              ? 'XXXXXXXXXXXX'
              : 'Libre'
          }
        />

        <div className="actions-row">
          <button
            type="button"
            className="btn"
            onClick={buscarAuto}
            disabled={loading}
            title="Primero busca en tu BD; si es DNI y no hay, consulta RENIEC"
          >
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </div>

        <label>Nombre completo</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombres y apellidos"
        />

        <label>Teléfono (formato internacional)</label>
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="+51912345678"
        />

        {msg && <div className="notice">{msg}</div>}

        <div className="actions-row">
          <button
            type="button"
            className="btn primary"
            onClick={continuar}
            disabled={saving}
          >
            {saving ? 'Guardando…' : 'Continuar'}
          </button>
          <button type="button" className="btn" onClick={limpiar}>
            Limpiar
          </button>
        </div>
      </div>
    </main>
  );
}
