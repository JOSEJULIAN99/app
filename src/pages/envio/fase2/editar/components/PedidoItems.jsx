// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\envio\fase2\editar\components\PedidoItems.jsx

import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../../../../config.js";
import {
  parseTermQty,
  getNombre,
  getCategoria,
  getPrecioBase,
} from "../lib/formUtils.js";

export default function PedidoItems({
  items,
  setItems,
  setItemAt, // <-- Usado para actualizar cantidad/precio/nombre
  removeItem, // <-- Usado para el botón "Quitar"
  addManual, // <-- Usado para el botón "Agregar ítem manual"
  subTotal,
  descTipo,
  setDescTipo,
  descValor,
  setDescValor,
  descAplicado,
  total,
  fmtS,
}) {
  const [catalogo, setCatalogo] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [favoritosOnly, setFavoritosOnly] = useState(false);
  const [error, setError] = useState("");

  // ======== Cargar catálogo ========
  useEffect(() => {
    (async () => {
      try {
        const url = `${API_BASE}/api/productos?activos=true&favoritos=${favoritosOnly}`;
        const res = await fetch(url);
        const data = await res.json();
        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : [];
        setCatalogo(arr);
      } catch {
        setCatalogo([]);
      }
    })();
  }, [favoritosOnly]);

  // ======== Filtrar sugerencias ========
  useEffect(() => {
    const { term } = parseTermQty(search);
    if (!term) return setFiltered([]);
    const t = term.toLowerCase();
    const result = catalogo.filter((p) =>
      getNombre(p).toLowerCase().includes(t)
    );
    setFiltered(result.slice(0, 6));
  }, [search, catalogo]);

  // ======== Agregar desde catálogo (Usa setItems del padre) ========
  function addItem(p, qty = 1) {
    const pid = p.id ?? p.codigo ?? null;
    const base = getPrecioBase(p);
    const nombre = getNombre(p);

    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === pid && !x.es_manual);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].cantidad += qty;
        return copy;
      }
      return [
        ...prev,
        {
          id: pid,
          nombre,
          cantidad: qty,
          precio_unitario: base,
          es_manual: false,
        },
      ];
    });
    setSearch("");
    setFiltered([]);
  }

  // ======== Validaciones (Sin cambios) ========
  function validarLinea(it, idx) {
    if (!String(it.nombre || "").trim()) return `Ítem #${idx + 1}: sin nombre`;
    if (it.cantidad <= 0) return `Ítem #${idx + 1}: cantidad inválida`;
    if (it.precio_unitario < 0) return `Ítem #${idx + 1}: precio negativo`;
    return null;
  }

  function validarTodo() {
    const errs = items.map(validarLinea).filter(Boolean);
    if (errs.length > 0) {
      setError(errs[0]);
      return false;
    }
    setError("");
    return true;
  }

  // ======== Cálculos (Sin cambios) ========
  const totalValidado = useMemo(() => {
    return validarTodo() ? total : 0;
  }, [items, descValor, descTipo, total]);

  return (
    <section className="card form">
      <h2 style={{ marginTop: 0 }}>3) Detalle del pedido</h2>
      {error && <div className="notice error">{error}</div>}

      {/* 🔍 BUSCADOR */}
      <div className="filters-row" style={{ marginBottom: 10 }}>
        <input
          type="search"
          placeholder="Buscar producto para añadir..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "8px 10px", borderRadius: 8 }}
        />
        <label style={{ marginLeft: 8 }}>
          <input
            type="checkbox"
            checked={favoritosOnly}
            onChange={(e) => setFavoritosOnly(e.target.checked)}
          />{" "}
          Solo favoritos
        </label>
      </div>

      {/* SUGERENCIAS */}
      {filtered.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: 12,
            maxHeight: 200,
            overflowY: "auto",
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 4,
          }}
        >
          {filtered.map((p, i) => (
            <div
              key={i}
              onClick={() => addItem(p, 1)}
              style={{
                padding: "8px 10px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
              }}
            >
              <strong>{getNombre(p)}</strong> — {fmtS(getPrecioBase(p))}
              {getCategoria(p) && (
                <span className="hint"> · {getCategoria(p)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TABLA DE ITEMS */}
      <div className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Precio unit.</th>
              <th>Importe</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => {
              const imp = Number(it.cantidad) * Number(it.precio_unitario);
              return (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>
                    {/* 🔒 Nombre bloqueado si viene de catálogo */}
                    {it.es_manual ? (
                      <input
                        value={it.nombre}
                        onChange={(e) =>
                          setItemAt(idx, { nombre: e.target.value }) // 🎯 Usa función del padre
                        }
                        placeholder="Producto manual"
                        style={{ width: "100%" }}
                      />
                    ) : (
                      <span style={{ fontWeight: 600 }}>{it.nombre}</span>
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={it.cantidad}
                      onChange={(e) =>
                        setItemAt(idx, { // 🎯 Usa función del padre
                          cantidad: Math.max(1, Number(e.target.value || 1)),
                        })
                      }
                      style={{ width: 80, textAlign: "right" }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={it.precio_unitario}
                      onChange={(e) =>
                        setItemAt(idx, { // 🎯 Usa función del padre
                          precio_unitario: Math.max(
                            0,
                            Number(e.target.value || 0)
                          ),
                        })
                      }
                      style={{ width: 100, textAlign: "right" }}
                    />
                  </td>
                  <td style={{ textAlign: "right" }}>{fmtS(imp)}</td>
                  <td>
                    <button
                      className="btn small"
                      onClick={() => removeItem(idx)} // 🎯 Usa función del padre
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ marginTop: 10 }}>
          <button className="btn" type="button" onClick={addManual}> 
            + Agregar ítem manual
          </button>
        </div>
      </div>
      
      {/* DESCUENTO Y TOTALES */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginTop: 14,
        }}
      >
        <div>
          <label>Descuento</label>
          <div className="segmented">
            <button
              type="button"
              className={`segmented-item ${
                descTipo === "monto" ? "active" : ""
              }`}
              onClick={() => setDescTipo("monto")}
            >
              Monto
            </button>
            <button
              type="button"
              className={`segmented-item ${
                descTipo === "porc" ? "active" : ""
              }`}
              onClick={() => setDescTipo("porc")}
            >
              %
            </button>
          </div>
        </div>
        <div>
          <label>Valor</label>
          <input
            type="number"
            min="0"
            step={descTipo === "porc" ? "0.1" : "0.01"}
            value={descValor}
            onChange={(e) =>
              setDescValor(Math.max(0, Number(e.target.value || 0)))
            }
          />
        </div>
        <div>
          <label>Subtotal</label>
          <input value={fmtS(subTotal)} readOnly />
        </div>
        <div>
          <label>Descuento aplicado</label>
          <input value={fmtS(descAplicado)} readOnly />
        </div>
        <div>
          <label>Total</label>
          <input
            value={fmtS(totalValidado)}
            readOnly
            style={{ fontWeight: 700 }}
          />
        </div>
      </div>
    </section>
  );
}