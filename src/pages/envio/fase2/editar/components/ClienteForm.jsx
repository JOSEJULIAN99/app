// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\envio\fase2\editar\components\ClienteForm.jsx
import { DOCS, formatPhone } from '../lib/formUtils.js';

// Sanitiza lo que se escribe según el tipo de documento
function maskDoc(v, tipo) {
  let s = String(v ?? '').toUpperCase();
  if (tipo === 'DNI') {
    // solo dígitos, máx 8
    s = s.replace(/\D/g, '').slice(0, 8);
  } else if (tipo === 'CE') {
    // alfanumérico, máx 12
    s = s.replace(/[^A-Z0-9]/g, '').slice(0, 12);
  } else {
    // OTRO: libre, pero sin saltos de línea
    s = s.replace(/\s+/g, ' ').slice(0, 24);
  }
  return s;
}

export default function ClienteForm({
  docTipo, setDocTipo,
  docNro, setDocNro,
  cliNombre, setCliNombre,
  cliTel, setCliTel,
  docHint,
  lookupLoading,
  onBuscar
}) {
  return (
    <section className="card form">
      <h2 style={{ marginTop: 0 }}>1) Datos del cliente</h2>

      <label>Tipo de documento</label>
      <div className="segmented">
        {DOCS.map((d) => (
          <button
            key={d}
            className={`segmented-item ${docTipo === d ? 'active' : ''}`}
            onClick={() => {
              setDocTipo(d);
              setDocNro('');       // resetea el número al cambiar de tipo
              setCliNombre('');
              setCliTel('+51');
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
        name="docNro"
        inputMode={docTipo === 'DNI' ? 'numeric' : 'text'}
        // maxLength en text funciona; igual sanitizamos en onChange
        maxLength={docTipo === 'DNI' ? 8 : 12}
        value={String(docNro ?? '')}                          
        onChange={(e) => setDocNro(maskDoc(e.target.value, docTipo))}  
        onPaste={(e) => {                                      /* <- también sanea pegado */
          e.preventDefault();
          const text = (e.clipboardData.getData('text') || '');
          setDocNro(maskDoc(text, docTipo));
        }}
        autoComplete="off"
        placeholder={docTipo === 'DNI' ? '00000000' : docTipo === 'CE' ? 'XXXXXXXXXXXX' : 'Libre'}
      />

      <div className="actions-row">
        <button
          type="button"
          className="btn"
          onClick={onBuscar}
          disabled={lookupLoading}
          title="BD primero; si DNI y no existe, consulta RENIEC"
        >
          {lookupLoading ? 'Buscando…' : 'Buscar'}
        </button>
      </div>

      <label>Nombre completo</label>
      <input
        value={String(cliNombre ?? '')}
        onChange={(e) => setCliNombre(e.target.value)}
        placeholder="Nombres y apellidos"
        maxLength={120}
        autoComplete="off"
      />

      <label>Teléfono (formato internacional)</label>
      <input
        value={String(cliTel ?? '')}
        onChange={(e) => setCliTel(e.target.value)}
        placeholder="+51912345678"
        maxLength={20}
        autoComplete="off"
      />
      <div className="hint">Se enviará como: {formatPhone(cliTel) || '—'}</div>
    </section>
  );
}
