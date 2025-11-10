// C:\Users\Jose-Julian\Desktop\wombo\web\src\utils\money.js

// Convierte cualquier entrada a número seguro.
// - acepta "12,5", "12.5", "  12.50 ", incluso Number
// - si no se puede convertir, devuelve def (0 por defecto)
export function toNumber(v, def = 0) {
  if (v === null || v === undefined) return def;
  // normaliza coma a punto
  const raw = String(v).trim().replace(',', '.');
  // si queda vacío -> def
  if (raw === '') return def;
  const n = Number(raw);
  return Number.isFinite(n) ? n : def;
}

// Redondea a 2 decimales de forma estable
export function round2(n) {
  const num = toNumber(n, 0);
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

// Formatea como moneda peruana simple: S/12.00
// (sin separador de miles, para que no te rompa inputs móviles)
export function fmtPEN(n) {
  const val = toNumber(n, 0);
  return `S/${val.toFixed(2)}`;
}

// ÚTIL (si lo quieres usar después):
// calcula subtotal de un array de items [{cantidad, precio_unitario}]
export function calcSubtotal(items = []) {
  return round2(
    items.reduce(
      (acc, it) => acc + toNumber(it.cantidad, 0) * toNumber(it.precio_unitario, 0),
      0
    )
  );
}
