// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\envio\fase2\editar\components\Confirmacion.jsx
import { Link } from 'react-router-dom';

export default function Confirmacion({ motivo, setMotivo, canSave, saving, onGuardar }) {
  return (
    <section className="card form">
      <h2 style={{ marginTop: 0 }}>5) Confirmación</h2>
      <label>Motivo de la modificación (obligatorio)</label>
      <textarea
        rows={4}
        value={motivo}
        onChange={e => setMotivo(e.target.value)}
        placeholder="Describe qué cambias y por qué…"
      />
      <div className="hint">
        Se registrará el usuario de sesión (headers <code>x-usuario</code> / <code>x-usuario-id</code>) y un registro de tipo <strong>MODIFICACION</strong>.
      </div>

      <div className="actions-row" style={{ marginTop: 10 }}>
        <Link to="/envio/fase2/embalar" className="btn">Cancelar</Link>
        <button className="btn primary" onClick={onGuardar} disabled={saving || !canSave}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </section>
  );
}
