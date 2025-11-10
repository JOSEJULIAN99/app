// C:\Users\Jose-Julian\Desktop\wombo\web\src\utils\validators.js

// DNI peruano: exactamente 8 dígitos
export const isDNI = (v) => {
  const s = String(v ?? '').trim();
  return /^\d{8}$/.test(s);
};

// CE: 1 a 12 caracteres alfanuméricos (sin espacios)
export const isCE = (v) => {
  const s = String(v ?? '').trim();
  return /^[A-Za-z0-9]{1,12}$/.test(s);
};

// Teléfono internacional tipo +51987654321
// - empieza con +
// - país no puede iniciar en 0
// - entre 8 y 15 dígitos en total (ITU E.164)
export const isPhone = (v) => {
  const s = String(v ?? '').trim();
  return /^\+[1-9]\d{7,14}$/.test(s);
};

// ÚTIL (si quieres): valida que un string no esté vacío
export const isNotEmpty = (v) => String(v ?? '').trim().length > 0;
