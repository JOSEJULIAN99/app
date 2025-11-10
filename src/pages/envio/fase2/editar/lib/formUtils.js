// C:\Users\Jose-Julian\Desktop\wombo\web\src\pages\envio\fase2\editar\lib\formUtils.js
export const TIPOS = ['SHALOM', 'OLVA', 'FLORES', 'OTRA'];
export const DOCS  = ['DNI', 'CE', 'OTRO'];

export const isDNI   = (doc) => /^\d{8}$/.test(doc);
export const isCE    = (doc) => /^[a-zA-Z0-9]{1,12}$/.test(doc);
export const isPhone = (tel) => /^\+\d{10,15}$/.test(tel);

export function up(v) { return String(v ?? '').trim().toUpperCase(); }

export function identityHeaders() {
  const h = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const u = (localStorage.getItem('wombo_usuario') || '').toUpperCase();
  const uid = localStorage.getItem('wombo_usuario_id') || '';
  if (u) h['x-usuario'] = u;
  if (uid) h['x-usuario-id'] = uid;
  return h;
}

export async function safeJson(res) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return {};
}

export function formatPhone(raw) {
  if (!raw) return '';
  let t = String(raw).trim();
  t = t.replace(/^\+?51/, '');
  t = t.replace(/^\+/, '');
  t = t.replace(/^00/, '');
  t = t.replace(/\D+/g, '');
  const parts = [];
  for (let i = 0; i < t.length; i += 3) parts.push(t.slice(i, i + 3));
  return parts.join(' ').trim();
}

/**
 * Convierte un objeto de producto/detalle de API a un formato de fila de carrito.
 * Mantiene la propiedad `valido` para que el filtro de la vista funcione.
 */
export function toItemRow(it) {
  const nombre =
    it.nombre_item || it.producto_nombre || it.nombre || it.descripcion || 'Producto';
  const precio = Number(it.precio_unitario ?? it.precio ?? it.monto ?? 0);
  const idProd = it.producto_id || it.id_producto || it.id_prod || it.id || null;
  const esManual = !idProd;
  
  return {
    id: idProd,
    nombre,
    cantidad: Number(it.cantidad || 1),
    precio_unitario: Number.isFinite(precio) ? precio : 0,
    es_manual: !!esManual,
    // 🎯 CORRECCIÓN: Mantiene el valor 'valido' (true/false) para el filtro.
    // Si 'valido' no viene (undefined), asumimos TRUE.
    valido: it.valido === undefined ? true : it.valido, 
  };
}

// Catálogo helpers
export const getNombre = (p) => p?.nombre ?? p?.descripcion ?? 'Producto';
export const getCategoria = (p) => (p?.categoria ?? '').toString().trim();
export const getPrecioBase = (p) => Number(p?.precio_base ?? p?.precio ?? p?.monto ?? 0) || 0;

// "torta x3", "torta*3", "torta 3" -> { term, qty }
export function parseTermQty(s) {
  const m = String(s || '').trim().match(/(.+?)[\s*x]+(\d{1,3})$/i);
  if (m) return { term: m[1].trim(), qty: Math.max(1, parseInt(m[2], 10) || 1) };
  return { term: String(s || '').trim(), qty: 1 };
}