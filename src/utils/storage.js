// C:\Users\Jose-Julian\Desktop\wombo\web\src\utils\storage.js

// Centralizamos TODAS las claves que ya estás usando en las pantallas:
// - Cliente.jsx        -> 'fase1_cliente'
// - Agencia.jsx        -> 'fase1_agencia'
// - Pedido.jsx         -> 'fase1_pedido'
// - Abono.jsx          -> 'fase1_abono'
// - Enviar.jsx         -> 'fase1_registro'
// Si mañana cambias el nombre, sólo lo cambias aquí.
export const KEYS = {
  FASE1_CLIENTE: 'fase1_cliente',
  FASE1_AGENCIA: 'fase1_agencia',
  FASE1_PEDIDO:  'fase1_pedido',
  FASE1_ABONO:   'fase1_abono',
  FASE1_REGISTRO:'fase1_registro',

 

  // Sesión web (opcional, por si quieres unificar)
  SESSION: 'wombo_session'
};

// Helper seguro para obtener storage (evita crashear en SSR o modo privado)
function getStorage() {
  try {
    if (typeof window !== 'undefined' && window?.localStorage) {
      return window.localStorage;
    }
  } catch (_) {}
  return null;
}

// Guarda un valor en localStorage como JSON (evita escrituras redundantes)
export function saveLocal(key, value) {
  const storage = getStorage();
  if (!storage) return;

  try {
    const next = JSON.stringify(value);
    const prev = storage.getItem(key);
    if (prev === next) return; // nada cambió -> evita I/O
    storage.setItem(key, next);
  } catch (err) {
    // si el usuario está en modo incógnito o se llena el storage, no rompas la app
    console.warn('[storage] no se pudo guardar', key, err);
  }
}

// Lee un valor de localStorage y lo parsea; si falla, devuelve fallback
export function loadLocal(key, fallback = null) {
  const storage = getStorage();
  if (!storage) return fallback;

  try {
    const raw = storage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[storage] no se pudo leer', key, err);
    return fallback;
  }
}

// Borra una clave específica
export function removeLocal(key) {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch (err) {
    console.warn('[storage] no se pudo borrar', key, err);
  }
}

// Borra todo lo de la Fase 1 (lo usas en Enviar.jsx)
export function clearFase1() {
  removeLocal(KEYS.FASE1_CLIENTE);
  removeLocal(KEYS.FASE1_AGENCIA);
  removeLocal(KEYS.FASE1_PEDIDO);
  removeLocal(KEYS.FASE1_ABONO);
  removeLocal(KEYS.FASE1_REGISTRO);
}
