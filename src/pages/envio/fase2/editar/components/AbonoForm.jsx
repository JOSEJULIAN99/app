// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\envio\fase2\editar\components\AbonoForm.jsx
export default function AbonoForm({ abono, setAbono, pendiente, fmtS }) {
  return (
    <section className="card form">
      <h2 style={{ marginTop: 0 }}>4) Abono</h2>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div>
          <label>Abono</label>
          <input
            type="number" min="0" step="0.01"
            value={abono}
            onChange={e => setAbono(Math.max(0, Number(e.target.value || 0)))}
          />
        </div>
        <div>
          <label>Pendiente</label>
          <input value={fmtS(pendiente)} readOnly />
        </div>
      </div>
    </section>
  );
}
