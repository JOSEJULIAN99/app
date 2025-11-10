// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\envio\fase1\Pedido.jsx
import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../../../config.js';
import { KEYS, loadLocal, saveLocal } from '../../../utils/storage.js';
import { fmtPEN, round2, toNumber } from '../../../utils/money.js';
import { Link, useNavigate } from 'react-router-dom';

export default function Pedido() {
  const navigate = useNavigate();

  // validar fase anterior
  useEffect(() => {
    const cli = loadLocal(KEYS.FASE1_CLIENTE, null);
    const age = loadLocal(KEYS.FASE1_AGENCIA, null);
    if (!cli) navigate('/envio/fase1/cliente', { replace: true });
    else if (!age) navigate('/envio/fase1/agencia', { replace: true });
  }, [navigate]);

  // estado base
  const initial = loadLocal(KEYS.FASE1_PEDIDO, {
    items: [],
    descuento: { tipo: 'monto', valor: 0 },
  });

  const [catalogo, setCatalogo] = useState([]);
  const [items, setItems] = useState(initial.items);
  const [descTipo, setDescTipo] = useState(initial.descuento.tipo || 'monto');
  const [descValor, setDescValor] = useState(initial.descuento.valor || 0);
  const [msg, setMsg] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ====== FILTROS ======
  const [search, setSearch] = useState('');               // filtro por nombre
  const [categoriaSel, setCategoriaSel] = useState('');   // filtro por categoría
  const [favoritosOnly, setFavoritosOnly] = useState(true); // SOLO favoritos por defecto

  // cargar catálogo (refetch al cambiar favoritosOnly)
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const url = `${API_BASE}/api/productos?activos=true&favoritos=${favoritosOnly}&_=${Date.now()}`;
        const res = await fetch(url, {
          headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' },
          signal: controller.signal,
        });

        let raw;
        try { raw = await res.json(); } catch { raw = null; }

        let arr = [];
        if (Array.isArray(raw)) arr = raw;
        else if (raw && Array.isArray(raw.data)) arr = raw.data;
        else if (raw && Array.isArray(raw.productos)) arr = raw.productos;
        else if (raw && Array.isArray(raw.items)) arr = raw.items;

        setCatalogo(arr);
        if (!arr.length) setMsg('No hay productos activos para el filtro seleccionado.');
        else setMsg('');
      } catch (e) {
        if (e.name !== 'AbortError') {
          setMsg('No se pudo cargar el catálogo: ' + e.message);
          setCatalogo([]);
        }
      }
    })();

    return () => controller.abort();
  }, [favoritosOnly]);

  // guardar en localstorage
  useEffect(() => {
    saveLocal(KEYS.FASE1_PEDIDO, {
      items,
      descuento: { tipo: descTipo, valor: descValor },
    });
  }, [items, descTipo, descValor]);

  // ====== helpers ======
  const getCategoria = (p) => (p.categoria ?? '').toString().trim();

  const safeImageSrc = (url) => {
    const s = (url ?? '').toString().trim();
    if (!s) return null;
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/')) return s;
    // cualquier cosa rara (e.g. "via.placeholder.com/80") => ignora
    return null;
  };

  function addProducto(p) {
    setItems((prev) => {
      const pid = p.id ?? p.id_producto ?? p.codigo ?? null;
      const idx = prev.findIndex((x) => x.id === pid && !x.es_manual);
      const basePrice = toNumber(p.precio_base ?? p.precio ?? p.monto ?? 0, 0);

      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + 1 };
        return copy;
      }

      return [
        ...prev,
        {
          id: pid,
          nombre: p.nombre ?? p.descripcion ?? 'Producto',
          cantidad: 1,
          precio_unitario: basePrice,
          es_manual: false,
        },
      ];
    });
  }

  function addManual() {
    const nombre = window.prompt('Nombre del producto manual:');
    if (!nombre) return;
    const precio = toNumber(window.prompt('Precio unitario (S/):', '0'), 0);
    if (precio < 0) {
      setMsg('Precio inválido.');
      return;
    }
    const cant = Math.max(1, parseInt(window.prompt('Cantidad:', '1'), 10) || 1);
    setItems((prev) => [
      ...prev,
      {
        id: null,
        nombre: nombre.trim(),
        cantidad: cant,
        precio_unitario: round2(precio),
        es_manual: true,
      },
    ]);
  }

  function updateCantidad(i, val) {
    const cant = Math.max(1, parseInt(val, 10) || 1);
    setItems((prev) =>
      prev.map((x, idx) => (idx === i ? { ...x, cantidad: cant } : x))
    );
  }

  function updatePrecio(i, val) {
    const n = Math.max(0, toNumber(val, 0));
    setItems((prev) =>
      prev.map((x, idx) => (idx === i ? { ...x, precio_unitario: round2(n) } : x))
    );
  }

  function removeItem(i) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  // ====== catálogo filtrado (categoría + buscar; favoritos ya viene filtrado del backend) ======
  const categorias = useMemo(() => {
    const s = new Set(
      catalogo
        .map(getCategoria)
        .filter((c) => c && c.length > 0)
    );
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'es'));
  }, [catalogo]);

  const catalogoFiltrado = useMemo(() => {
    const term = search.trim().toLowerCase();
    const hasTextFilter = term !== '';
    const hasCategoriaFilter = !!categoriaSel;

    return catalogo.filter((p) => {
      if (hasCategoriaFilter && getCategoria(p) !== categoriaSel) return false;
      if (hasTextFilter) {
        const nombre = (p.nombre ?? p.descripcion ?? '').toString().toLowerCase();
        if (!nombre.includes(term)) return false;
      }
      return true;
    });
  }, [catalogo, search, categoriaSel]);

  // ====== cálculos carrito ======
  const subtotales = useMemo(
    () => items.map((x) => round2(x.cantidad * x.precio_unitario)),
    [items]
  );

  const subtotal = useMemo(
    () => round2(subtotales.reduce((a, b) => a + b, 0)),
    [subtotales]
  );

  const descuento = useMemo(() => {
    const v = toNumber(descValor, 0);
    if (descTipo === 'porc') {
      const porc = Math.min(100, Math.max(0, v));
      return round2((subtotal * porc) / 100);
    }
    return round2(Math.min(subtotal, Math.max(0, v)));
  }, [descTipo, descValor, subtotal]);

  const total = useMemo(() => round2(subtotal - descuento), [subtotal, descuento]);

  // cambios de precio / manuales
  const hayOverrides = useMemo(() => {
    return items.some((x) => {
      if (x.es_manual) return true;
      if (!x.id) return false;
      const cat = catalogo.find(
        (c) => c.id === x.id || c.id_producto === x.id || c.codigo === x.id
      );
      if (!cat) return false;
      const catPrecio = toNumber(cat.precio_base ?? cat.precio ?? cat.monto ?? 0);
      return catPrecio !== toNumber(x.precio_unitario);
    });
  }, [items, catalogo]);

  function continuar() {
    setMsg('');
    if (items.length === 0) {
      setMsg('Agregue al menos un producto.');
      return;
    }
    if (hayOverrides) {
      setConfirmOpen(true);
      return;
    }
    navigate('/envio/fase1/abono');
  }

  // 🔧 ARREGLO: usar el MISMO nombre que en el onClick del modal
  function confirmContinuar() {
    setConfirmOpen(false);
    navigate('/envio/fase1/abono');
  }

  return (
    <main className="container">
      <h1>Fase 1 · Pedido</h1>

      {/* FILTROS */}
      <section className="card filters-bar">
        <div className="filters-row" style={{ gap: 16, flexWrap: 'wrap' }}>
          <div className="filters-group">
            <label className="filters-label">Buscar</label>
            <input
              type="search"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filters-input"
            />
          </div>

          <div className="filters-group">
            <label className="filters-label">Categoría</label>
            <select
              value={categoriaSel}
              onChange={(e) => setCategoriaSel(e.target.value)}
              className="filters-input"
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="filters-group" style={{ alignItems: 'center' }}>
            <label className="filters-label" htmlFor="favOnly">Sólo favoritos</label>
            <input
              id="favOnly"
              type="checkbox"
              checked={favoritosOnly}
              onChange={(e) => setFavoritosOnly(e.target.checked)}
              style={{ marginLeft: 8 }}
            />
          </div>
        </div>
      </section>

      {/* CATÁLOGO */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Catálogo</h2>

        {catalogoFiltrado.length === 0 ? (
          <div className="hint">No hay productos que coincidan con el filtro.</div>
        ) : null}

        <div className="catalog-grid">
          {catalogoFiltrado.map((p) => {
            const src = safeImageSrc(p.imagen_url);
            return (
              <button
                key={p.id ?? p.id_producto ?? p.codigo}
                className="card catalog-card"
                onClick={() => addProducto(p)}
              >
                <div className="catalog-card-body">
                  {src ? (
                    <img
                      src={src}
                      alt={p.nombre ?? p.descripcion ?? 'Producto'}
                      className="catalog-thumb"
                      onError={(e) => {
                        // si falla la imagen remota, muestra placeholder local
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const ph = document.createElement('div');
                          ph.className = 'catalog-thumb placeholder';
                          parent.prepend(ph);
                        }
                      }}
                    />
                  ) : (
                    <div className="catalog-thumb placeholder" />
                  )}
                  <div className="catalog-info">
                    <div className="catalog-name">
                      {p.nombre ?? p.descripcion ?? 'Producto'}
                    </div>
                    <div className="hint">
                      {fmtPEN(
        toNumber(p.precio_base ?? p.precio ?? p.monto ?? 0, 0)
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          <button className="card catalog-card add-manual" onClick={addManual}>
            <div className="catalog-card-body">
              <div className="catalog-thumb placeholder manual">+</div>
              <div className="catalog-info">
                <div className="catalog-name">+ Producto manual</div>
                <div className="hint">
                  Nombre, precio y cantidad personalizados
                </div>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* CARRITO */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Carrito</h2>
        {items.length === 0 ? (
          <div className="hint">
            Aún no hay productos. Toca en el catálogo para añadir.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Producto</th>
                  <th>Cant.</th>
                  <th>Precio (S/)</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((x, i) => (
                  <tr key={i}>
                    <td style={{ padding: '8px 4px' }}>
                      {x.nombre}{' '}
                      {x.es_manual && <span className="hint">(manual)</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        inputMode="numeric"
                        style={{ width: 70, textAlign: 'center' }}
                        value={x.cantidad}
                        onChange={(e) => updateCantidad(i, e.target.value)}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        inputMode="decimal"
                        style={{ width: 110, textAlign: 'center' }}
                        value={x.precio_unitario}
                        onChange={(e) => updatePrecio(i, e.target.value)}
                      />
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {fmtPEN(subtotales[i])}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn" onClick={() => removeItem(i)}>
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* DESCUENTO Y TOTAL */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Descuento y total</h2>
        <div className="actions-row">
          <div className="segmented">
            <button
              className={`segmented-item ${descTipo === 'monto' ? 'active' : ''}`}
              onClick={() => setDescTipo('monto')}
            >
              Monto
            </button>
            <button
              className={`segmented-item ${descTipo === 'porc' ? 'active' : ''}`}
              onClick={() => setDescTipo('porc')}
            >
              %
            </button>
          </div>
          <input
            inputMode="decimal"
            placeholder={descTipo === 'monto' ? '0.00' : '0-100'}
            value={descValor}
            onChange={(e) => setDescValor(e.target.value)}
            style={{ width: 160 }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 18,
            marginTop: 10,
            flexWrap: 'wrap',
          }}
        >
          <div>
            Subtotal: <strong>{fmtPEN(subtotal)}</strong>
          </div>
          <div>
            Descuento: <strong>-{fmtPEN(descuento)}</strong>
          </div>
          <div>
            Total: <strong>{fmtPEN(total)}</strong>
          </div>
        </div>
      </section>

      {msg && <div className="notice">{msg}</div>}

      <div className="actions-row">
        <Link to="/envio/fase1/agencia" className="btn">Atrás</Link>
        <button
          className="btn primary"
          onClick={continuar}
          disabled={items.length === 0}
        >
          Continuar
        </button>
      </div>

      {confirmOpen && (
        <div className="modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmar cambios de precio / productos manuales</h3>
            <p>Has modificado precios o agregado productos manuales. ¿Deseas continuar?</p>
            <div className="actions-row">
              <button className="btn" onClick={() => setConfirmOpen(false)}>
                Cancelar
              </button>
              <button className="btn primary" onClick={confirmContinuar}>
                Sí, continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

