// C:\Users\Jose-Julian\Desktop\wombo\web\src\theme\ThemeContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

const ThemeCtx = createContext(null);

const THEMES = {
  light: {
    // Colores claros: Fuerte contraste sobre fondo claro
    '--bg': '#ffffff',           // Blanco puro (mejor contraste)
    '--fg': '#1f2937',           // Gris oscuro para texto
    '--primary': '#0ea5e9',      // Celeste (inmutable)
    '--muted': '#f3f4f6',        // Gris muy claro para botones/fondos sutiles
    '--card': '#ffffff',         // Card blanca
    '--border': '#e5e7eb',       // Borde muy sutil
    '--card-rgb': '255,255,255', // para el blur en CSS
  },
  dim: {
    // Tema intermedio: Base oscura con colores suaves
    '--bg': '#1e293b',           // Azul oscuro suave (Slate-700)
    '--fg': '#f1f5f9',           // Texto blanco muy claro
    '--primary': '#38bdf8',      // Celeste más claro para alto contraste en oscuro
    '--muted': '#334155',        // Fondo de elementos sutiles (Slate-600)
    '--card': '#2d384b',         // Card un poco más clara que el fondo
    '--border': '#475569',       // Borde visible pero discreto
    '--card-rgb': '45,56,75',
  },
  dark: {
    // Tema oscuro puro: Contraste máximo con fondo casi negro
    '--bg': '#0f172a',           // Fondo principal (Slate-900)
    '--fg': '#f8fafc',           // Texto blanco casi puro
    '--primary': '#38bdf8',      // Celeste más claro (inmutable en oscuro)
    '--muted': '#1e293b',        // Para chips / botones (Slate-800)
    '--card': '#1e293b',         // Card (igual que muted para un look plano)
    '--border': '#334155',       // Borde
    '--card-rgb': '30,41,59',
  },
};

const STORAGE_KEY = 'wombo_theme';
const FALLBACK = 'light';

function getInitialTheme() {
  // 1) lo que guardaste
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && THEMES[saved]) return saved;
  }

  // 2) lo que dice el sistema
  // 💡 Nota: Mantenemos 'dark' como fallback del sistema por ser el más común
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }

  // 3) fallback
  return FALLBACK;
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialTheme);

  // aplica las variables al <html>
  useEffect(() => {
    const vars = THEMES[mode] || THEMES[FALLBACK];
    Object.entries(vars).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v);
    });
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  // botón rápido: light -> dim -> dark -> light
  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      if (prev === 'light') return 'dim';
      if (prev === 'dim') return 'dark';
      return 'light';
    });
  }, []);

  const value = {
    mode,
    setMode,
    toggleTheme,
    themes: Object.keys(THEMES), // ['light','dim','dark']
  };

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) {
    throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  }
  return ctx;
}